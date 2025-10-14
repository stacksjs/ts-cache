#!/usr/bin/env bun
/**
 * Comprehensive driver benchmark comparing all ts-cache drivers
 * with popular alternatives in each category
 */

import { LRUCache } from 'lru-cache'
import { bench, group, run } from 'mitata'
import NodeCache from 'node-cache'
import { Cache } from '../src/cache'
import { createCache } from '../src/manager'

// ============================================================
// Setup All Drivers
// ============================================================

// ts-cache drivers (with cloning for safety)
const memorySyncCache = new Cache({ stdTTL: 100, checkPeriod: 120 })
const memoryAsyncCache = createCache({ driver: 'memory', stdTTL: 100 })
const memoryLRUCache = createCache({ driver: 'memory', stdTTL: 100, maxKeys: 10000 })

// ts-cache drivers (no cloning, for fair comparison with lru-cache)
const memorySyncCacheNoClone = new Cache({ stdTTL: 100, checkPeriod: 120, useClones: false })
const memoryLRUCacheNoClone = createCache({ driver: 'memory', stdTTL: 100, maxKeys: 10000, useClones: false })

// ts-cache drivers (ultra-performance mode: no cloning, no stats, no events, no TTL, Map storage)
const memorySyncCacheUltraFast = new Cache({
  stdTTL: 0,
  checkPeriod: 0,
  useClones: false,
  enableStats: false,
  enableEvents: false,
  maxPerformance: true,
})

// Competitors
const nodeCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })
const lruCache = new LRUCache({ max: 10000, ttl: 100000 })

// Test data
const testKey = 'test-key'
const testValue = { id: 123, name: 'John Doe', email: 'john@example.com', created: Date.now() }
const testValueLarge = {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com',
  data: Array.from({ length: 100 }).fill({ foo: 'bar', baz: 'qux' }),
}

console.log('🏃 Running Comprehensive Driver Benchmarks')
console.log('━'.repeat(60))
console.log()
console.log('Testing Drivers:')
console.log('  - ts-cache (memory, sync)')
console.log('  - ts-cache (memory, async)')
console.log('  - ts-cache (memory-lru, async)')
console.log('  - ts-cache (memory, sync, no-clone)')
console.log('  - ts-cache (memory-lru, async, no-clone)')
console.log('  - node-cache')
console.log('  - lru-cache')
console.log()
console.log('Note: No-clone variants store references (like lru-cache) for fair comparison')
console.log()

// ============================================================
// Memory Driver Comparison
// ============================================================

group('Memory Drivers - SET (single small value)', () => {
  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.set(testKey, testValue)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.set(testKey, testValue)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.set(testKey, testValue)
  })

  bench('node-cache', () => {
    nodeCache.set(testKey, testValue)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValue)
  })
})

group('Memory Drivers - GET (single small value)', () => {
  // Prepare
  memorySyncCache.set(testKey, testValue)
  nodeCache.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.get(testKey)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.get(testKey)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.get(testKey)
  })

  bench('node-cache', () => {
    nodeCache.get(testKey)
  })

  bench('lru-cache', () => {
    lruCache.get(testKey)
  })
})

group('Memory Drivers - SET (single large value)', () => {
  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.set(testKey, testValueLarge)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.set(testKey, testValueLarge)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.set(testKey, testValueLarge)
  })

  bench('node-cache', () => {
    nodeCache.set(testKey, testValueLarge)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValueLarge)
  })
})

group('Memory Drivers - GET (single large value)', () => {
  // Prepare
  memorySyncCache.set(testKey, testValueLarge)
  nodeCache.set(testKey, testValueLarge)
  lruCache.set(testKey, testValueLarge)

  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.get(testKey)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.get(testKey)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.get(testKey)
  })

  bench('node-cache', () => {
    nodeCache.get(testKey)
  })

  bench('lru-cache', () => {
    lruCache.get(testKey)
  })
})

// ============================================================
// Batch Operations
// ============================================================

group('Memory Drivers - SET (batch 100 items)', () => {
  const items = Array.from({ length: 100 }).map((_, i) => ({
    key: `key-${i}`,
    value: { id: i, data: `value-${i}` },
  }))

  bench('ts-cache (memory, sync) - loop', () => {
    for (const { key, value } of items) {
      memorySyncCache.set(key, value)
    }
  })

  bench('ts-cache (memory, async) - mset', async () => {
    await memoryAsyncCache.mset(items.map(({ key, value }) => ({ key, value })))
  })

  bench('ts-cache (memory-lru, async) - mset', async () => {
    await memoryLRUCache.mset(items.map(({ key, value }) => ({ key, value })))
  })

  bench('node-cache - loop', () => {
    for (const { key, value } of items) {
      nodeCache.set(key, value)
    }
  })

  bench('lru-cache - loop', () => {
    for (const { key, value } of items) {
      lruCache.set(key, value)
    }
  })
})

group('Memory Drivers - GET (batch 100 items)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `key-${i}`)

  // Prepare all caches
  for (let i = 0; i < 100; i++) {
    const key = `key-${i}`
    const value = { id: i, data: `value-${i}` }
    memorySyncCache.set(key, value)
    nodeCache.set(key, value)
    lruCache.set(key, value)
  }

  bench('ts-cache (memory, sync) - loop', () => {
    for (const key of keys) {
      memorySyncCache.get(key)
    }
  })

  bench('ts-cache (memory, async) - mget', async () => {
    await memoryAsyncCache.mget(keys)
  })

  bench('ts-cache (memory-lru, async) - mget', async () => {
    await memoryLRUCache.mget(keys)
  })

  bench('node-cache - mget', () => {
    nodeCache.mget(keys)
  })

  bench('lru-cache - loop', () => {
    for (const key of keys) {
      lruCache.get(key)
    }
  })
})

// ============================================================
// No-Clone Comparison (fair comparison with lru-cache)
// ============================================================

group('No-Clone Comparison - SET (single small value)', () => {
  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.set(testKey, testValue)
  })

  bench('ts-cache (memory, sync, ultra-fast)', () => {
    memorySyncCacheUltraFast.set(testKey, testValue)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.set(testKey, testValue)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValue)
  })
})

group('No-Clone Comparison - GET (single small value)', () => {
  // Prepare
  memorySyncCacheNoClone.set(testKey, testValue)
  memorySyncCacheUltraFast.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.get(testKey)
  })

  bench('ts-cache (memory, sync, ultra-fast)', () => {
    memorySyncCacheUltraFast.get(testKey)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.get(testKey)
  })

  bench('lru-cache', () => {
    lruCache.get(testKey)
  })
})

group('No-Clone Comparison - SET (single large value)', () => {
  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.set(testKey, testValueLarge)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.set(testKey, testValueLarge)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValueLarge)
  })
})

group('No-Clone Comparison - GET (single large value)', () => {
  // Prepare
  memorySyncCacheNoClone.set(testKey, testValueLarge)
  lruCache.set(testKey, testValueLarge)

  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.get(testKey)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.get(testKey)
  })

  bench('lru-cache', () => {
    lruCache.get(testKey)
  })
})

group('No-Clone Comparison - HAS/EXISTS', () => {
  // Prepare
  memorySyncCacheNoClone.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.has(testKey)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.has(testKey)
  })

  bench('lru-cache', () => {
    lruCache.has(testKey)
  })
})

group('No-Clone Comparison - DELETE', () => {
  bench('ts-cache (memory, sync, no-clone)', () => {
    memorySyncCacheNoClone.set(testKey, testValue)
    memorySyncCacheNoClone.del(testKey)
  })

  bench('ts-cache (memory-lru, async, no-clone)', async () => {
    await memoryLRUCacheNoClone.set(testKey, testValue)
    await memoryLRUCacheNoClone.del(testKey)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValue)
    lruCache.delete(testKey)
  })
})

group('No-Clone Comparison - Batch SET (100 items)', () => {
  const items = Array.from({ length: 100 }).map((_, i) => ({
    key: `key-${i}`,
    value: { id: i, data: `value-${i}` },
  }))

  bench('ts-cache (memory, sync, no-clone) - loop', () => {
    for (const { key, value } of items) {
      memorySyncCacheNoClone.set(key, value)
    }
  })

  bench('lru-cache - loop', () => {
    for (const { key, value } of items) {
      lruCache.set(key, value)
    }
  })
})

group('No-Clone Comparison - Batch GET (100 items)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `key-${i}`)

  // Prepare
  for (let i = 0; i < 100; i++) {
    const key = `key-${i}`
    const value = { id: i, data: `value-${i}` }
    memorySyncCacheNoClone.set(key, value)
    lruCache.set(key, value)
  }

  bench('ts-cache (memory, sync, no-clone) - loop', () => {
    for (const key of keys) {
      memorySyncCacheNoClone.get(key)
    }
  })

  bench('lru-cache - loop', () => {
    for (const key of keys) {
      lruCache.get(key)
    }
  })
})

// ============================================================
// LRU-specific operations
// ============================================================

group('LRU Eviction Performance (max 100 items, insert 200)', () => {
  bench('ts-cache (memory-lru)', async () => {
    const lruTest = createCache({ driver: 'memory', maxKeys: 100 })
    for (let i = 0; i < 200; i++) {
      await lruTest.set(`key-${i}`, { id: i })
    }
    await lruTest.close()
  })

  bench('lru-cache', () => {
    const lruTest = new LRUCache({ max: 100 })
    for (let i = 0; i < 200; i++) {
      lruTest.set(`key-${i}`, { id: i })
    }
  })
})

// ============================================================
// HAS/EXISTS Operations
// ============================================================

group('Memory Drivers - HAS/EXISTS', () => {
  // Prepare
  memorySyncCache.set(testKey, testValue)
  nodeCache.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.has(testKey)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.has(testKey)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.has(testKey)
  })

  bench('node-cache', () => {
    nodeCache.has(testKey)
  })

  bench('lru-cache', () => {
    lruCache.has(testKey)
  })
})

// ============================================================
// KEYS Operations
// ============================================================

group('Memory Drivers - KEYS (100 keys)', () => {
  // Prepare
  for (let i = 0; i < 100; i++) {
    const key = `key-${i}`
    memorySyncCache.set(key, testValue)
    nodeCache.set(key, testValue)
    lruCache.set(key, testValue)
  }

  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.keys()
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.keys()
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.keys()
  })

  bench('node-cache', () => {
    nodeCache.keys()
  })

  bench('lru-cache', () => {
    Array.from(lruCache.keys())
  })
})

// ============================================================
// DELETE Operations
// ============================================================

group('Memory Drivers - DELETE (single key)', () => {
  bench('ts-cache (memory, sync)', () => {
    memorySyncCache.set(testKey, testValue)
    memorySyncCache.del(testKey)
  })

  bench('ts-cache (memory, async)', async () => {
    await memoryAsyncCache.set(testKey, testValue)
    await memoryAsyncCache.del(testKey)
  })

  bench('ts-cache (memory-lru, async)', async () => {
    await memoryLRUCache.set(testKey, testValue)
    await memoryLRUCache.del(testKey)
  })

  bench('node-cache', () => {
    nodeCache.set(testKey, testValue)
    nodeCache.del(testKey)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValue)
    lruCache.delete(testKey)
  })
})

// ============================================================
// FLUSH/CLEAR Operations
// ============================================================

group('Memory Drivers - FLUSH (100 keys)', () => {
  bench('ts-cache (memory, sync)', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      memorySyncCache.set(`key-${i}`, testValue)
    }
    // Clear
    memorySyncCache.flushAll()
  })

  bench('ts-cache (memory, async)', async () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      await memoryAsyncCache.set(`key-${i}`, testValue)
    }
    // Clear
    await memoryAsyncCache.flush()
  })

  bench('ts-cache (memory-lru, async)', async () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      await memoryLRUCache.set(`key-${i}`, testValue)
    }
    // Clear
    await memoryLRUCache.flush()
  })

  bench('node-cache', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      nodeCache.set(`key-${i}`, testValue)
    }
    // Clear
    nodeCache.flushAll()
  })

  bench('lru-cache', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      lruCache.set(`key-${i}`, testValue)
    }
    // Clear
    lruCache.clear()
  })
})

// Run all benchmarks
await run({
  colors: true,
})

// Cleanup
await memoryAsyncCache.close()
await memoryLRUCache.close()
await memoryLRUCacheNoClone.close()

console.log()
console.log('✅ Driver benchmarks complete!')
console.log()
console.log('Key Insights:')
console.log('  - Default ts-cache uses useClones: true for data safety (deep clones)')
console.log('  - No-clone variants use useClones: false (references, like lru-cache)')
console.log('  - Compare no-clone results for apples-to-apples performance comparison')
console.log()
console.log('Note: Redis driver benchmarks require a running Redis instance.')
console.log('Run `docker run -d -p 6379:6379 redis:alpine` to test Redis drivers.')
