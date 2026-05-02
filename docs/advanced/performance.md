# Performance Tuning

Optimize cache performance for high-throughput applications.

## Overview

Fine-tune ts-cache for maximum performance in demanding applications.

## Memory Configuration

```typescript
const cache = new Cache({
  store: 'memory',
  max: 10000, // Max items
  maxSize: 50 * 1024 * 1024, // 50MB max
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 300 * 1000,
  updateAgeOnGet: false, // Don't update timestamp on read
  updateAgeOnHas: false,
})
```

## Batch Operations

```typescript
// Single operations (slower)
for (const item of items) {
  await cache.set(`item:${item.id}`, item)
}

// Batch operations (faster)
await cache.mset(
  items.map((item) => [`item:${item.id}`, item])
)

// Batch get
const values = await cache.mget([
  'item:1', 'item:2', 'item:3'
])
```

## Connection Pooling

```typescript
const cache = new Cache({
  store: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // Connection pool settings
    family: 4,
    keepAlive: 30000,
    connectTimeout: 10000,
  },
})
```

## Serialization

```typescript
// Default JSON (slower, more compatible)
const cache = new Cache({ store: 'redis' })

// MessagePack (faster, smaller)
import { encode, decode } from '@msgpack/msgpack'

const cache = new Cache({
  store: 'redis',
  serializer: {
    serialize: encode,
    deserialize: decode,
  },
})
```

## Compression

```typescript
import { compress, decompress } from 'bun:zlib'

const cache = new Cache({
  store: 'redis',
  compress: {
    threshold: 1024, // Only compress > 1KB
    serialize: async (value) => {
      const json = JSON.stringify(value)
      return json.length > 1024
        ? compress(json)
        : json
    },
    deserialize: async (data) => {
      // Detect if compressed
      if (isCompressed(data)) {
        return JSON.parse(await decompress(data))
      }
      return JSON.parse(data)
    },
  },
})
```

## Pipeline Operations

```typescript
// Redis pipeline for bulk operations
const pipeline = cache.pipeline()

for (const item of items) {
  pipeline.set(`item:${item.id}`, item)
  pipeline.expire(`item:${item.id}`, 3600)
}

await pipeline.exec()
```

## Benchmarking

```typescript
async function benchmark() {
  const iterations = 10000
  const testData = { id: 1, name: 'test', data: 'x'.repeat(100) }

  // Write benchmark
  console.time('writes')
  for (let i = 0; i < iterations; i++) {
    await cache.set(`bench:${i}`, testData)
  }
  console.timeEnd('writes')

  // Read benchmark
  console.time('reads')
  for (let i = 0; i < iterations; i++) {
    await cache.get(`bench:${i}`)
  }
  console.timeEnd('reads')

  // Batch benchmark
  console.time('batch-write')
  await cache.mset(
    Array.from({ length: iterations }, (_, i) => [`batch:${i}`, testData])
  )
  console.timeEnd('batch-write')
}
```

## Best Practices

1. Use appropriate TTLs - not too short (cache thrashing) or long (stale data)
2. Batch operations when possible
3. Use compression for large values
4. Monitor hit rates and adjust strategy
5. Use connection pooling for Redis
6. Consider serialization format based on data type
