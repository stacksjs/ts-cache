/* eslint-disable no-console */
/* eslint-disable antfu/no-top-level-await */
import { CacheLock, createCache, memoize, RateLimiter, serializers } from '../src'

// Example 1: Using the default memory cache
async function memoryExample() {
  const cache = createCache()

  // Basic operations
  await cache.set('user:1', { name: 'John', age: 30 }, 60)
  const user = await cache.get('user:1')
  console.log('User:', user)

  // Fetch or compute
  const data = await cache.fetch('expensive:data', async () => {
    // This only runs if not cached
    console.log('Computing expensive data...')
    return { result: 'expensive computation' }
  }, 300)

  console.log('Data:', data)
}

// Example 2: Using Redis with Bun's native client
async function _redisExample() {
  const cache = createCache({
    driver: 'redis',
    url: 'redis://localhost:6379',
    prefix: 'myapp',
    serializer: serializers.json,
  })

  // Same API as memory cache
  await cache.set('session:abc123', { userId: 1, token: 'xxx' }, 3600)
  const session = await cache.get('session:abc123')
  console.log('Session:', session)

  // Close connection when done
  await cache.close()
}

// Example 3: Using namespaces
async function namespaceExample() {
  const cache = createCache()

  // Create namespaced caches
  const userCache = cache.namespace('users')
  const postCache = cache.namespace('posts')

  // Keys are automatically prefixed
  await userCache.set('1', { name: 'Alice' })
  await postCache.set('1', { title: 'Hello World' })

  // No collision between namespaces
  console.log(await userCache.get('1')) // { name: 'Alice' }
  console.log(await postCache.get('1')) // { title: 'Hello World' }
}

// Example 4: Using tags
async function tagsExample() {
  const cache = createCache()

  await cache.set('user:1', { name: 'John' })
  await cache.set('user:2', { name: 'Jane' })
  await cache.set('post:1', { title: 'Hello' })

  // Tag the entries
  await cache.tag('user:1', ['users', 'active'])
  await cache.tag('user:2', ['users', 'active'])
  await cache.tag('post:1', ['posts'])

  // Get all keys by tag
  const userKeys = await cache.getKeysByTag('users')
  console.log('User keys:', userKeys)

  // Delete all entries with a tag
  await cache.deleteByTag('users')
}

// Example 5: Rate limiting
async function rateLimitExample() {
  const cache = createCache()
  const limiter = new RateLimiter(cache, 10, 60) // 10 requests per 60 seconds

  const result = await limiter.check('user:123')
  if (result.limited) {
    console.log('Rate limited! Try again at:', new Date(result.resetAt))
  }
  else {
    console.log('Request allowed. Remaining:', result.remaining)
  }
}

// Example 6: Distributed locking
async function _lockExample() {
  const cache = createCache({ driver: 'redis' })
  const lock = new CacheLock(cache, 30)

  const result = await lock.withLock('critical:resource', async () => {
    // This code only runs if lock is acquired
    console.log('Processing critical resource...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'done'
  })

  if (result === null) {
    console.log('Could not acquire lock')
  }
  else {
    console.log('Result:', result)
  }

  await cache.close()
}

// Example 7: Memoization
async function memoizeExample() {
  const cache = createCache()

  async function expensiveFunction(a: number, b: number) {
    console.log('Computing...')
    await new Promise(resolve => setTimeout(resolve, 100))
    return a + b
  }

  const memoized = memoize(expensiveFunction, cache, {
    ttl: 60,
    keyGenerator: (a, b) => `sum:${a}:${b}`,
  })

  // First call computes
  console.log(await memoized(5, 3)) // logs "Computing..." and 8

  // Second call uses cache
  console.log(await memoized(5, 3)) // logs 8 immediately
}

// Example 8: Remember pattern
async function rememberExample() {
  const cache = createCache()

  // Laravel-style remember
  const user = await cache.remember('user:1', 60, async () => {
    console.log('Fetching user from database...')
    return { id: 1, name: 'John' }
  })

  console.log('User:', user)

  // Remember forever (no TTL)
  const config = await cache.rememberForever('app:config', async () => {
    console.log('Loading config...')
    return { version: '1.0.0' }
  })

  console.log('Config:', config)
}

// Example 9: Using custom serializers
async function _serializerExample() {
  const cache = createCache({
    driver: 'redis',
    serializer: serializers.auto, // Auto-detects and preserves types
  })

  // Complex data types are preserved
  await cache.set('date', new Date())
  await cache.set('regex', /test/gi)
  await cache.set('set', new Set([1, 2, 3]))
  await cache.set('map', new Map([['a', 1], ['b', 2]]))

  const date = await cache.get<Date>('date')
  console.log('Date is Date instance:', date instanceof Date)

  await cache.close()
}

// Example 10: Batch operations
async function batchExample() {
  const cache = createCache()

  // Set multiple values at once
  await cache.mset([
    { key: 'user:1', value: { name: 'John' }, ttl: 60 },
    { key: 'user:2', value: { name: 'Jane' }, ttl: 60 },
    { key: 'user:3', value: { name: 'Bob' }, ttl: 60 },
  ])

  // Get multiple values at once
  const users = await cache.mget(['user:1', 'user:2', 'user:3'])
  console.log('Users:', users)
}

// Run examples
if (import.meta.main) {
  console.log('=== Memory Cache Example ===')
  await memoryExample()

  console.log('\n=== Namespace Example ===')
  await namespaceExample()

  console.log('\n=== Tags Example ===')
  await tagsExample()

  console.log('\n=== Rate Limit Example ===')
  await rateLimitExample()

  console.log('\n=== Memoize Example ===')
  await memoizeExample()

  console.log('\n=== Remember Example ===')
  await rememberExample()

  console.log('\n=== Batch Example ===')
  await batchExample()

  // Uncomment to test Redis examples (requires Redis server)
  // console.log('\n=== Redis Example ===')
  // await redisExample()
  //
  // console.log('\n=== Lock Example ===')
  // await lockExample()
  //
  // console.log('\n=== Serializer Example ===')
  // await serializerExample()
}
