# Multi-Store Setup

Configure multiple cache stores for optimal performance.

## Overview

Use multiple cache stores together for different caching strategies and data types.

## Tiered Caching

```typescript
import { Cache, TieredCache } from 'ts-cache'

const cache = new TieredCache([
  // L1: Fast in-memory cache
  new Cache({
    store: 'memory',
    max: 1000,
    ttl: 60 * 1000, // 1 minute
  }),
  // L2: Redis for longer-term storage
  new Cache({
    store: 'redis',
    ttl: 3600 * 1000, // 1 hour
  }),
])

// Reads check L1 first, then L2
// Writes populate both levels
const data = await cache.get('key')
await cache.set('key', value)
```

## Store by Type

Use different stores for different data:

```typescript
const stores = {
  session: new Cache({
    store: 'redis',
    prefix: 'session:',
    ttl: 3600,
  }),

  config: new Cache({
    store: 'memory',
    prefix: 'config:',
    ttl: 86400,
  }),

  query: new Cache({
    store: 'memory',
    max: 500,
    ttl: 300,
  }),
}

// Use appropriate store
await stores.session.set('user:123', sessionData)
await stores.config.set('settings', appSettings)
await stores.query.set('users:active', queryResult)
```

## Fallback Configuration

```typescript
const cache = new Cache({
  store: 'redis',
  fallback: {
    store: 'memory',
    max: 1000,
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
})

// Automatically falls back to memory if Redis fails
```

## Store Manager

```typescript
class CacheManager {
  private stores = new Map<string, Cache>()

  register(name: string, config: CacheConfig) {
    this.stores.set(name, new Cache(config))
  }

  store(name: string = 'default') {
    const store = this.stores.get(name)
    if (!store) throw new Error(`Cache store '${name}' not found`)
    return store
  }
}

const cacheManager = new CacheManager()
cacheManager.register('default', { store: 'memory' })
cacheManager.register('redis', { store: 'redis', host: 'localhost' })

// Use specific store
const data = await cacheManager.store('redis').get('key')
```

## Write-Through / Write-Behind

```typescript
class WriteThroughCache {
  constructor(
    private fast: Cache,
    private persistent: Cache
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    // Try fast cache first
    let value = await this.fast.get<T>(key)

    if (!value) {
      // Fall back to persistent
      value = await this.persistent.get<T>(key)
      if (value) {
        // Populate fast cache
        await this.fast.set(key, value)
      }
    }

    return value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Write to both
    await Promise.all([
      this.fast.set(key, value, ttl),
      this.persistent.set(key, value, ttl),
    ])
  }
}
```
