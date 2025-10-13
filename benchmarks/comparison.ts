#!/usr/bin/env bun
/**
 * Comprehensive benchmark comparing ts-cache with competitors
 * Uses mitata for accurate performance measurements
 */

import { bench, group, run } from 'mitata'
import NodeCache from 'node-cache'
import { LRUCache } from 'lru-cache'
import { Cache } from '../src/cache'
import { createCache } from '../src/manager'

// ============================================================
// Setup Instances
// ============================================================

// ts-cache (legacy sync API)
const tsCache = new Cache({ stdTTL: 100, checkperiod: 120 })

// ts-cache (new async API)
const tsCacheAsync = createCache({ driver: 'memory', stdTTL: 100 })

// node-cache
const nodeCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

// lru-cache
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

console.log('🏃 Running Cache Performance Benchmarks')
console.log('━'.repeat(60))
console.log()

// ============================================================
// Single Operations
// ============================================================

group('SET (single small value)', () => {
  bench('ts-cache (sync)', () => {
    tsCache.set(testKey, testValue)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.set(testKey, testValue)
  })

  bench('node-cache', () => {
    nodeCache.set(testKey, testValue)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValue)
  })
})

group('GET (single small value)', () => {
  // Prepare
  tsCache.set(testKey, testValue)
  nodeCache.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (sync)', () => {
    tsCache.get(testKey)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.get(testKey)
  })

  bench('node-cache', () => {
    nodeCache.get(testKey)
  })

  bench('lru-cache', () => {
    lruCache.get(testKey)
  })
})

group('SET (single large value)', () => {
  bench('ts-cache (sync)', () => {
    tsCache.set(testKey, testValueLarge)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.set(testKey, testValueLarge)
  })

  bench('node-cache', () => {
    nodeCache.set(testKey, testValueLarge)
  })

  bench('lru-cache', () => {
    lruCache.set(testKey, testValueLarge)
  })
})

group('GET (single large value)', () => {
  // Prepare
  tsCache.set(testKey, testValueLarge)
  nodeCache.set(testKey, testValueLarge)
  lruCache.set(testKey, testValueLarge)

  bench('ts-cache (sync)', () => {
    tsCache.get(testKey)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.get(testKey)
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

group('SET (batch 100 items)', () => {
  const items = Array.from({ length: 100 }).map((_, i) => ({
    key: `key-${i}`,
    value: { id: i, data: `value-${i}` },
  }))

  bench('ts-cache (sync)', () => {
    for (const { key, value } of items) {
      tsCache.set(key, value)
    }
  })

  bench('ts-cache (async) - mset', async () => {
    await tsCacheAsync.mset(items.map(({ key, value }) => ({ key, value })))
  })

  bench('node-cache', () => {
    for (const { key, value } of items) {
      nodeCache.set(key, value)
    }
  })

  bench('lru-cache', () => {
    for (const { key, value } of items) {
      lruCache.set(key, value)
    }
  })
})

group('GET (batch 100 items)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `key-${i}`)

  // Prepare all caches
  for (let i = 0; i < 100; i++) {
    const key = `key-${i}`
    const value = { id: i, data: `value-${i}` }
    tsCache.set(key, value)
    nodeCache.set(key, value)
    lruCache.set(key, value)
  }

  bench('ts-cache (sync)', () => {
    for (const key of keys) {
      tsCache.get(key)
    }
  })

  bench('ts-cache (async) - mget', async () => {
    await tsCacheAsync.mget(keys)
  })

  bench('node-cache - mget', () => {
    nodeCache.mget(keys)
  })

  bench('lru-cache', () => {
    for (const key of keys) {
      lruCache.get(key)
    }
  })
})

// ============================================================
// DELETE Operations
// ============================================================

group('DELETE (single key)', () => {
  bench('ts-cache (sync)', () => {
    tsCache.set(testKey, testValue)
    tsCache.del(testKey)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.set(testKey, testValue)
    await tsCacheAsync.del(testKey)
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

group('DELETE (batch 100 keys)', () => {
  const keys = Array.from({ length: 100 }).map((_, i) => `key-${i}`)

  bench('ts-cache (sync)', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      tsCache.set(`key-${i}`, testValue)
    }
    // Delete
    for (const key of keys) {
      tsCache.del(key)
    }
  })

  bench('ts-cache (async) - batch del', async () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      await tsCacheAsync.set(`key-${i}`, testValue)
    }
    // Delete
    await tsCacheAsync.del(keys)
  })

  bench('node-cache - batch del', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      nodeCache.set(`key-${i}`, testValue)
    }
    // Delete
    nodeCache.del(keys)
  })

  bench('lru-cache', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      lruCache.set(`key-${i}`, testValue)
    }
    // Delete
    for (const key of keys) {
      lruCache.delete(key)
    }
  })
})

// ============================================================
// HAS/EXISTS Operations
// ============================================================

group('HAS/EXISTS (key exists)', () => {
  // Prepare
  tsCache.set(testKey, testValue)
  nodeCache.set(testKey, testValue)
  lruCache.set(testKey, testValue)

  bench('ts-cache (sync)', () => {
    tsCache.has(testKey)
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.has(testKey)
  })

  bench('node-cache', () => {
    nodeCache.has(testKey)
  })

  bench('lru-cache', () => {
    lruCache.has(testKey)
  })
})

// ============================================================
// KEYS/LIST Operations
// ============================================================

group('KEYS/LIST (100 keys)', () => {
  // Prepare
  for (let i = 0; i < 100; i++) {
    const key = `key-${i}`
    tsCache.set(key, testValue)
    nodeCache.set(key, testValue)
    lruCache.set(key, testValue)
  }

  bench('ts-cache (sync)', () => {
    tsCache.keys()
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.keys()
  })

  bench('node-cache', () => {
    nodeCache.keys()
  })

  bench('lru-cache', () => {
    Array.from(lruCache.keys())
  })
})

// ============================================================
// FLUSH/CLEAR Operations
// ============================================================

group('FLUSH/CLEAR (100 keys)', () => {
  bench('ts-cache (sync)', () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      tsCache.set(`key-${i}`, testValue)
    }
    // Clear
    tsCache.flushAll()
  })

  bench('ts-cache (async)', async () => {
    // Setup
    for (let i = 0; i < 100; i++) {
      await tsCacheAsync.set(`key-${i}`, testValue)
    }
    // Clear
    await tsCacheAsync.flush()
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

// ============================================================
// Mixed Operations (Real-World Simulation)
// ============================================================

group('MIXED operations (80% read, 20% write)', () => {
  let counter = 0

  bench('ts-cache (sync)', () => {
    for (let i = 0; i < 100; i++) {
      if (i % 5 === 0) {
        // 20% writes
        tsCache.set(`key-${counter++}`, testValue)
      }
      else {
        // 80% reads
        tsCache.get(`key-${counter % 100}`)
      }
    }
  })

  bench('ts-cache (async)', async () => {
    for (let i = 0; i < 100; i++) {
      if (i % 5 === 0) {
        await tsCacheAsync.set(`key-${counter++}`, testValue)
      }
      else {
        await tsCacheAsync.get(`key-${counter % 100}`)
      }
    }
  })

  bench('node-cache', () => {
    for (let i = 0; i < 100; i++) {
      if (i % 5 === 0) {
        nodeCache.set(`key-${counter++}`, testValue)
      }
      else {
        nodeCache.get(`key-${counter % 100}`)
      }
    }
  })

  bench('lru-cache', () => {
    for (let i = 0; i < 100; i++) {
      if (i % 5 === 0) {
        lruCache.set(`key-${counter++}`, testValue)
      }
      else {
        lruCache.get(`key-${counter % 100}`)
      }
    }
  })
})

// ============================================================
// Statistics
// ============================================================

group('STATISTICS', () => {
  // Prepare
  for (let i = 0; i < 100; i++) {
    tsCache.set(`key-${i}`, testValue)
    nodeCache.set(`key-${i}`, testValue)
  }

  bench('ts-cache (sync)', () => {
    tsCache.getStats()
  })

  bench('ts-cache (async)', async () => {
    await tsCacheAsync.getStats()
  })

  bench('node-cache', () => {
    nodeCache.getStats()
  })

  bench('lru-cache', () => {
    lruCache.size
  })
})

// Run all benchmarks
await run({
  units: false,
  silent: false,
  avg: true,
  json: false,
  colors: true,
  min_max: true,
  percentiles: true,
})

// Cleanup
await tsCacheAsync.close()
