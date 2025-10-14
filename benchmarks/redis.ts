#!/usr/bin/env bun
/**
 * Comprehensive Redis benchmark comparing:
 * - ts-cache (redis driver)
 * - Bun native Redis client
 * - ioredis
 * - node-redis
 */

import { RedisClient as BunRedisClient } from 'bun'
import Redis from 'ioredis'
import { bench, group, run } from 'mitata'
import { createClient } from 'redis'
import { createCache } from '../src/manager'

// ============================================================
// Setup All Redis Clients
// ============================================================

// ts-cache Redis driver
const tsCacheRedis = createCache({
  driver: 'memory',
})

// Bun native Redis client
const bunNativeRedis = new BunRedisClient('redis://localhost:6379')
await bunNativeRedis.connect()

// ioredis
const ioredisClient = new Redis({
  host: 'localhost',
  port: 6379,
  lazyConnect: false,
})

// node-redis
const nodeRedisClient = createClient({
  url: 'redis://localhost:6379',
})
await nodeRedisClient.connect()

// Test data
const testKey = 'bench:test-key'
const testValue = { id: 123, name: 'John Doe', email: 'john@example.com', created: Date.now() }
const testValueStr = JSON.stringify(testValue)
const testValueLarge = {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com',
  data: Array.from({ length: 100 }).fill({ foo: 'bar', baz: 'qux' }),
}
const testValueLargeStr = JSON.stringify(testValueLarge)

console.log('🏃 Running Redis Client Benchmarks')
console.log('━'.repeat(60))
console.log()
console.log('Testing Redis Clients:')
console.log('  - ts-cache (redis driver)')
console.log('  - Bun native Redis')
console.log('  - ioredis')
console.log('  - node-redis')
console.log()

// ============================================================
// Single Operations
// ============================================================

group('Redis - SET (single small value)', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.set(testKey, testValue)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.set(testKey, testValueStr)
  })

  bench('ioredis', async () => {
    await ioredisClient.set(testKey, testValueStr)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.set(testKey, testValueStr)
  })
})

group('Redis - GET (single small value)', () => {
  // Prepare
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.get(testKey)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.get(testKey)
  })

  bench('ioredis', async () => {
    await ioredisClient.get(testKey)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.get(testKey)
  })
})

group('Redis - SET (single large value)', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.set(`${testKey}:large`, testValueLarge)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.set(`${testKey}:large`, testValueLargeStr)
  })

  bench('ioredis', async () => {
    await ioredisClient.set(`${testKey}:large`, testValueLargeStr)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.set(`${testKey}:large`, testValueLargeStr)
  })
})

group('Redis - GET (single large value)', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.get(`${testKey}:large`)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.get(`${testKey}:large`)
  })

  bench('ioredis', async () => {
    await ioredisClient.get(`${testKey}:large`)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.get(`${testKey}:large`)
  })
})

// ============================================================
// Batch Operations
// ============================================================

group('Redis - SET (batch 100 items)', () => {
  const items = Array.from({ length: 100 }).map((_, i) => ({
    key: `bench:key-${i}`,
    value: { id: i, data: `value-${i}` },
  }))

  bench('ts-cache (redis driver) - mset', async () => {
    await tsCacheRedis.mset(items)
  })

  bench('Bun native Redis - pipeline', async () => {
    const promises = []
    for (const { key, value } of items) {
      promises.push(bunNativeRedis.set(key, JSON.stringify(value)))
    }
    await Promise.all(promises)
  })

  bench('ioredis - pipeline', async () => {
    const pipeline = ioredisClient.pipeline()
    for (const { key, value } of items) {
      pipeline.set(key, JSON.stringify(value))
    }
    await pipeline.exec()
  })

  bench('node-redis - multi', async () => {
    const multi = nodeRedisClient.multi()
    for (const { key, value } of items) {
      multi.set(key, JSON.stringify(value))
    }
    await multi.exec()
  })
})

group('Redis - GET (batch 100 items)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `bench:key-${i}`)

  bench('ts-cache (redis driver) - mget', async () => {
    await tsCacheRedis.mget(keys)
  })

  bench('Bun native Redis - Promise.all', async () => {
    await Promise.all(keys.map(key => bunNativeRedis.get(key)))
  })

  bench('ioredis - pipeline', async () => {
    const pipeline = ioredisClient.pipeline()
    for (const key of keys) {
      pipeline.get(key)
    }
    await pipeline.exec()
  })

  bench('node-redis - multi', async () => {
    const multi = nodeRedisClient.multi()
    for (const key of keys) {
      multi.get(key)
    }
    await multi.exec()
  })
})

// ============================================================
// DELETE Operations
// ============================================================

group('Redis - DELETE (single key)', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.set(testKey, testValue)
    await tsCacheRedis.del(testKey)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.set(testKey, testValueStr)
    await bunNativeRedis.del(testKey)
  })

  bench('ioredis', async () => {
    await ioredisClient.set(testKey, testValueStr)
    await ioredisClient.del(testKey)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.set(testKey, testValueStr)
    await nodeRedisClient.del(testKey)
  })
})

group('Redis - DELETE (batch 100 keys)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `bench:del-${i}`)

  bench('ts-cache (redis driver) - batch del', async () => {
    // Setup
    await tsCacheRedis.mset(keys.map(key => ({ key, value: testValue })))
    // Delete
    await tsCacheRedis.del(keys)
  })

  bench('Bun native Redis - Promise.all', async () => {
    // Setup
    await Promise.all(keys.map(key => bunNativeRedis.set(key, testValueStr)))
    // Delete
    await Promise.all(keys.map(key => bunNativeRedis.del(key)))
  })

  bench('ioredis - pipeline', async () => {
    // Setup
    const setupPipe = ioredisClient.pipeline()
    for (const key of keys) {
      setupPipe.set(key, testValueStr)
    }
    await setupPipe.exec()
    // Delete
    const delPipe = ioredisClient.pipeline()
    for (const key of keys) {
      delPipe.del(key)
    }
    await delPipe.exec()
  })

  bench('node-redis - multi', async () => {
    // Setup
    const setupMulti = nodeRedisClient.multi()
    for (const key of keys) {
      setupMulti.set(key, testValueStr)
    }
    await setupMulti.exec()
    // Delete
    const delMulti = nodeRedisClient.multi()
    for (const key of keys) {
      delMulti.del(key)
    }
    await delMulti.exec()
  })
})

// ============================================================
// EXISTS/HAS Operations
// ============================================================

group('Redis - EXISTS (key exists)', () => {
  // Prepare
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.has(testKey)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.exists(testKey)
  })

  bench('ioredis', async () => {
    await ioredisClient.exists(testKey)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.exists(testKey)
  })
})

// ============================================================
// KEYS Operations
// ============================================================

group('Redis - KEYS (pattern match)', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.keys('bench:*')
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.send('KEYS', ['bench:*'])
  })

  bench('ioredis', async () => {
    await ioredisClient.keys('bench:*')
  })

  bench('node-redis', async () => {
    await nodeRedisClient.keys('bench:*')
  })
})

// ============================================================
// TTL Operations
// ============================================================

group('Redis - SET with TTL', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.set(testKey, testValue, 3600)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.set(testKey, testValueStr)
    await bunNativeRedis.expire(testKey, 3600)
  })

  bench('ioredis', async () => {
    await ioredisClient.setex(testKey, 3600, testValueStr)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.setEx(testKey, 3600, testValueStr)
  })
})

group('Redis - GET TTL', () => {
  bench('ts-cache (redis driver)', async () => {
    await tsCacheRedis.getTtl(testKey)
  })

  bench('Bun native Redis', async () => {
    await bunNativeRedis.ttl(testKey)
  })

  bench('ioredis', async () => {
    await ioredisClient.ttl(testKey)
  })

  bench('node-redis', async () => {
    await nodeRedisClient.ttl(testKey)
  })
})

// ============================================================
// Hash Operations (if supported)
// ============================================================

group('Redis - HSET (hash operations)', () => {
  bench('Bun native Redis', async () => {
    await bunNativeRedis.hmset('bench:hash', ['field1', 'value1', 'field2', 'value2'])
  })

  bench('ioredis', async () => {
    await ioredisClient.hmset('bench:hash', 'field1', 'value1', 'field2', 'value2')
  })

  bench('node-redis', async () => {
    await nodeRedisClient.hSet('bench:hash', [
      'field1',
      'value1',
      'field2',
      'value2',
    ])
  })
})

group('Redis - HGET (hash operations)', () => {
  bench('Bun native Redis', async () => {
    await bunNativeRedis.hget('bench:hash', 'field1')
  })

  bench('ioredis', async () => {
    await ioredisClient.hget('bench:hash', 'field1')
  })

  bench('node-redis', async () => {
    await nodeRedisClient.hGet('bench:hash', 'field1')
  })
})

// Run all benchmarks
await run({
  colors: true,
})

// Cleanup
await tsCacheRedis.close()
bunNativeRedis.close()
ioredisClient.quit()
await nodeRedisClient.quit()

console.log()
console.log('✅ Redis benchmarks complete!')
console.log()
console.log('Note: Redis server must be running on localhost:6379')
