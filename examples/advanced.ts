/* eslint-disable no-console */
/* eslint-disable antfu/no-top-level-await */
import {
  CacheAsidePattern,
  compressors,
  createCache,
  createMiddlewareCache,
  loggingMiddleware,
  MemoryLRUDriver,
  metricsMiddleware,
  MultiLevelPattern,
  RefreshAheadPattern,
  serializers,
  WriteThroughPattern,
} from '../src'

// Example 1: LRU Cache with Compression
async function lruWithCompression() {
  console.log('=== LRU Cache with Compression ===')

  const cache = createCache({
    customDriver: new MemoryLRUDriver({
      maxKeys: 100, // Only keep 100 items
      compressor: compressors.smart, // Compress if beneficial
      enableCompression: true,
    }),
  })

  // Add large data
  for (let i = 0; i < 150; i++) {
    await cache.set(`item:${i}`, {
      id: i,
      data: 'x'.repeat(1000), // 1KB of data
      timestamp: Date.now(),
    })
  }

  // Only most recent 100 items are kept
  const stats = await cache.getStats()
  console.log('Cache stats:', stats)
  console.log('Keys count:', stats.keys) // Should be ~100

  await cache.close()
}

// Example 2: Middleware Chain
async function middlewareExample() {
  console.log('\n=== Middleware Chain ===')

  const baseCache = createCache()
  const cache = createMiddlewareCache(baseCache)

  // Add logging middleware
  cache.middleware.use(loggingMiddleware())

  // Add metrics middleware
  const metrics: Record<string, number[]> = {}
  cache.middleware.use(
    metricsMiddleware((operation, key, duration) => {
      if (!metrics[operation]) {
        metrics[operation] = []
      }
      metrics[operation].push(duration)
    }),
  )

  // Use the cache
  await cache.set('user:1', { name: 'Alice' })
  await cache.get('user:1')
  await cache.get('user:2') // miss

  console.log('Metrics:', metrics)

  await cache.close()
}

// Example 3: Cache-Aside Pattern
async function cacheAsideExample() {
  console.log('\n=== Cache-Aside Pattern ===')

  const cache = createCache()

  // Simulate database
  const database = new Map([
    ['user:1', { id: 1, name: 'Alice' }],
    ['user:2', { id: 2, name: 'Bob' }],
  ])

  const cacheAside = new CacheAsidePattern(
    cache,
    async (key) => {
      console.log(`Loading ${key} from database...`)
      await new Promise(resolve => setTimeout(resolve, 100))
      return database.get(key.toString())
    },
    60,
  )

  // First access loads from DB
  const user1 = await cacheAside.get('user:1')
  console.log('First access:', user1)

  // Second access uses cache
  const user1Again = await cacheAside.get('user:1')
  console.log('Second access (cached):', user1Again)

  await cache.close()
}

// Example 4: Write-Through Pattern
async function writeThroughExample() {
  console.log('\n=== Write-Through Pattern ===')

  const cache = createCache()
  const database = new Map()

  const writeThrough = new WriteThroughPattern(
    cache,
    async (key, value) => {
      console.log(`Writing ${key} to database...`)
      database.set(key.toString(), value)
    },
    60,
  )

  // Write goes to both cache and database
  await writeThrough.set('user:1', { name: 'Alice' })

  console.log('In cache:', await writeThrough.get('user:1'))
  console.log('In database:', database.get('user:1'))

  await cache.close()
}

// Example 5: Multi-Level Cache
async function multiLevelExample() {
  console.log('\n=== Multi-Level Cache ===')

  // L1: Fast in-memory cache (small, short TTL)
  const l1 = createCache({
    customDriver: new MemoryLRUDriver({ maxKeys: 10 }),
  })

  // L2: Larger in-memory cache (longer TTL)
  const l2 = createCache({
    customDriver: new MemoryLRUDriver({ maxKeys: 100 }),
  })

  // L3: Redis cache (persistent, longest TTL)
  // const l3 = createCache({ driver: 'redis' })

  const multiLevel = new MultiLevelPattern(
    [l1, l2], // [l1, l2, l3] with Redis
    [10, 60], // TTLs: 10s for L1, 60s for L2
  )

  // Set value (goes to all levels)
  await multiLevel.set('user:1', { name: 'Alice' })

  // Get value (checks L1 first, then L2, then L3)
  const user = await multiLevel.get('user:1')
  console.log('Retrieved from cache:', user)

  await l1.close()
  await l2.close()
}

// Example 6: Refresh-Ahead Pattern
async function _refreshAheadExample() {
  console.log('\n=== Refresh-Ahead Pattern ===')

  const cache = createCache()
  let loadCount = 0

  const refreshAhead = new RefreshAheadPattern(
    cache,
    async (key) => {
      loadCount++
      console.log(`Loading ${key} (count: ${loadCount})...`)
      return { data: `Fresh data for ${key}`, timestamp: Date.now() }
    },
    10, // 10 second TTL
    0.7, // Refresh when 70% of TTL has passed (7 seconds)
  )

  // Initial load
  await refreshAhead.get('data:1')

  // Wait 8 seconds (past threshold)
  await new Promise(resolve => setTimeout(resolve, 8000))

  // This triggers background refresh
  await refreshAhead.get('data:1')

  console.log('Load count:', loadCount) // Should be 2

  await cache.close()
}

// Example 7: Compression Comparison
async function compressionExample() {
  console.log('\n=== Compression Comparison ===')

  const largeData = 'x'.repeat(10000) // 10KB of data

  // Test different compressors
  const compressorTypes = ['gzip', 'brotli', 'smart', 'none'] as const

  for (const type of compressorTypes) {
    const cache = createCache({
      customDriver: new MemoryLRUDriver({
        compressor: compressors[type],
        enableCompression: type !== 'none',
      }),
    })

    await cache.set('data', largeData)
    const stats = await cache.getStats()

    console.log(`${type}: ${stats.vsize} bytes`)

    await cache.close()
  }
}

// Example 8: Stale-While-Revalidate with Middleware
async function _staleWhileRevalidateExample() {
  console.log('\n=== Stale-While-Revalidate ===')

  const baseCache = createCache()
  const cache = createMiddlewareCache(baseCache)

  let revalidateCount = 0

  // Add stale-while-revalidate middleware
  const { staleWhileRevalidateMiddleware } = await import('../src/middleware')

  cache.middleware.use(
    staleWhileRevalidateMiddleware(
      baseCache,
      async (key) => {
        revalidateCount++
        console.log(`Revalidating ${key}...`)
        return { data: 'Fresh data', timestamp: Date.now() }
      },
      5, // Revalidate when < 5 seconds remaining
    ),
  )

  // Set with 10 second TTL
  await cache.set('api:data', { data: 'Initial', timestamp: Date.now() }, 10)

  // Wait 6 seconds (TTL < 5 seconds remaining)
  await new Promise(resolve => setTimeout(resolve, 6000))

  // This should trigger background revalidation
  await cache.get('api:data')

  await new Promise(resolve => setTimeout(resolve, 100))

  console.log('Revalidate count:', revalidateCount)

  await cache.close()
}

// Example 9: Type-Safe Auto Serialization
async function autoSerializationExample() {
  console.log('\n=== Auto Serialization ===')

  const cache = createCache({
    driver: 'memory',
    serializer: serializers.auto,
  })

  // Store different types
  await cache.set('date', new Date('2025-01-01'))
  await cache.set('regex', /test/gi)
  await cache.set('set', new Set([1, 2, 3]))
  await cache.set('map', new Map([['a', 1], ['b', 2]]))

  // Retrieve with types preserved
  const date = await cache.get<Date>('date')
  const regex = await cache.get<RegExp>('regex')
  const set = await cache.get<Set<number>>('set')
  const map = await cache.get<Map<string, number>>('map')

  console.log('Date is Date:', date instanceof Date)
  console.log('RegExp is RegExp:', regex instanceof RegExp)
  console.log('Set is Set:', set instanceof Set)
  console.log('Map is Map:', map instanceof Map)

  await cache.close()
}

// Example 10: Custom Middleware for Encryption
async function encryptionExample() {
  console.log('\n=== Encryption Middleware ===')

  const baseCache = createCache()
  const cache = createMiddlewareCache(baseCache)

  // Simple XOR encryption (use real encryption in production!)
  const key = 42
  const encrypt = (data: string) => {
    return data
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) ^ key))
      .join('')
  }
  const decrypt = (data: string) => encrypt(data) // XOR is symmetric

  const { encryptionMiddleware } = await import('../src/middleware')

  cache.middleware.use(encryptionMiddleware(encrypt, decrypt))

  await cache.set('secret', 'sensitive data')

  // Data is encrypted in cache
  const encrypted = await baseCache.get('secret')
  console.log('Encrypted:', encrypted)

  // But decrypted when accessed through middleware
  const decrypted = await cache.get('secret')
  console.log('Decrypted:', decrypted)

  await cache.close()
}

// Run all examples
if (import.meta.main) {
  await lruWithCompression()
  await middlewareExample()
  await cacheAsideExample()
  await writeThroughExample()
  await multiLevelExample()
  // await refreshAheadExample() // Uncomment to test (takes 8+ seconds)
  await compressionExample()
  // await staleWhileRevalidateExample() // Uncomment to test (takes 6+ seconds)
  await autoSerializationExample()
  await encryptionExample()

  console.log('\n=== All examples completed ===')
}
