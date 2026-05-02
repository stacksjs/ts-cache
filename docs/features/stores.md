# Cache Stores

Configure and use different cache storage backends.

## Overview

ts-cache supports multiple storage backends, allowing you to choose the right cache store for your use case.

## Memory Store

In-memory caching for fast access:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  store: 'memory',
  max: 1000, // Maximum items
  ttl: 60 * 1000, // Default TTL: 1 minute
})

await cache.set('user:123', userData)
const user = await cache.get('user:123')
```

## Redis Store

Distributed caching with Redis:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  store: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
  },
  prefix: 'myapp:',
})

// Works the same as memory cache
await cache.set('session:abc', sessionData, { ttl: 3600 })
```

## File Store

File-based caching for persistence:

```typescript
const cache = new Cache({
  store: 'file',
  path: './cache',
  ttl: 86400 * 1000, // 24 hours
})

await cache.set('report:daily', reportData)
```

## SQLite Store

SQLite-backed cache for durability:

```typescript
const cache = new Cache({
  store: 'sqlite',
  database: './cache.db',
  table: 'cache_entries',
})
```

## Custom Stores

Create your own cache store:

```typescript
import { CacheStore } from 'ts-cache'

class DynamoDBStore implements CacheStore {
  async get<T>(key: string): Promise<T | undefined> {
    const item = await dynamodb.get({ Key: { pk: key } })
    return item?.value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await dynamodb.put({
      Item: {
        pk: key,
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
      },
    })
  }

  async delete(key: string): Promise<boolean> {
    await dynamodb.delete({ Key: { pk: key } })
    return true
  }

  async clear(): Promise<void> {
    // Implementation
  }
}

const cache = new Cache({
  store: new DynamoDBStore(),
})
```

## Store Comparison

| Store | Speed | Persistence | Distributed | Use Case |
|-------|-------|-------------|-------------|----------|
| Memory | Fastest | No | No | Single-server, hot data |
| Redis | Fast | Optional | Yes | Multi-server, sessions |
| File | Medium | Yes | No | Development, small apps |
| SQLite | Medium | Yes | No | Edge, embedded apps |
