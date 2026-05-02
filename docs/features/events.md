# Event Hooks

React to cache events with hooks and listeners.

## Overview

ts-cache emits events for cache operations, allowing you to add logging, metrics, and custom behavior.

## Available Events

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({ store: 'memory' })

// Cache hit
cache.on('hit', ({ key, value }) => {
  console.log(`Cache hit: ${key}`)
})

// Cache miss
cache.on('miss', ({ key }) => {
  console.log(`Cache miss: ${key}`)
})

// Key set
cache.on('set', ({ key, value, ttl }) => {
  console.log(`Set: ${key}, TTL: ${ttl}`)
})

// Key deleted
cache.on('delete', ({ key }) => {
  console.log(`Deleted: ${key}`)
})

// Key expired
cache.on('expire', ({ key }) => {
  console.log(`Expired: ${key}`)
})

// Cache cleared
cache.on('clear', () => {
  console.log('Cache cleared')
})
```

## Metrics Collection

```typescript
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
}

cache.on('hit', () => metrics.hits++)
cache.on('miss', () => metrics.misses++)
cache.on('set', () => metrics.sets++)
cache.on('delete', () => metrics.deletes++)

// Get hit rate
function getHitRate() {
  const total = metrics.hits + metrics.misses
  return total > 0 ? metrics.hits / total : 0
}
```

## Logging

```typescript
import { logger } from './logger'

cache.on('hit', ({ key }) => {
  logger.debug('Cache hit', { key })
})

cache.on('miss', ({ key }) => {
  logger.debug('Cache miss', { key })
})

cache.on('set', ({ key, ttl }) => {
  logger.info('Cache set', { key, ttl })
})

cache.on('error', ({ error, operation, key }) => {
  logger.error('Cache error', { error, operation, key })
})
```

## Cache Warming

Pre-populate cache on startup:

```typescript
cache.on('ready', async () => {
  console.log('Cache ready, warming up...')

  const popularItems = await db.items.findPopular(100)

  for (const item of popularItems) {
    await cache.set(`item:${item.id}`, item, 3600)
  }

  console.log('Cache warmed up')
})
```

## Sync Events (Write-Through)

```typescript
// Sync cache with database on changes
cache.on('set', async ({ key, value }) => {
  if (key.startsWith('user:')) {
    const userId = key.split(':')[1]
    await db.users.updateCache(userId, value)
  }
})

cache.on('delete', async ({ key }) => {
  if (key.startsWith('user:')) {
    const userId = key.split(':')[1]
    await db.users.clearCache(userId)
  }
})
```

## Custom Event Emitters

```typescript
import { EventEmitter } from 'events'

class ObservableCache extends Cache {
  private emitter = new EventEmitter()

  async get<T>(key: string): Promise<T | undefined> {
    const value = await super.get<T>(key)
    this.emitter.emit(value ? 'hit' : 'miss', { key, value })
    return value
  }

  on(event: string, listener: Function) {
    this.emitter.on(event, listener as any)
  }
}
```
