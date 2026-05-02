# Distributed Caching

Scale caching across multiple servers.

## Overview

Distributed caching ensures cache consistency and availability across multiple application instances.

## Redis Cluster

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  store: 'redis-cluster',
  cluster: [
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
  ],
  options: {
    enableReadyCheck: true,
    scaleReads: 'slave', // Read from replicas
  },
})
```

## Cache Invalidation

Broadcast invalidation to all instances:

```typescript
import { CacheInvalidator } from 'ts-cache'

const invalidator = new CacheInvalidator({
  pubsub: redisClient,
  channel: 'cache:invalidate',
})

// Listen for invalidation messages
invalidator.subscribe((keys) => {
  for (const key of keys) {
    localCache.delete(key)
  }
})

// Invalidate across all instances
async function invalidateKey(key: string) {
  await cache.delete(key)
  await invalidator.publish([key])
}
```

## Consistent Hashing

Distribute keys across cache nodes:

```typescript
import { ConsistentHash } from 'ts-cache'

const ring = new ConsistentHash([
  'cache-1.internal:6379',
  'cache-2.internal:6379',
  'cache-3.internal:6379',
])

function getNodeForKey(key: string) {
  return ring.get(key)
}

// Key 'user:123' always goes to the same node
const node = getNodeForKey('user:123')
```

## Cache-Aside with Distributed Lock

```typescript
async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try cache first
  let value = await cache.get<T>(key)
  if (value) return value

  // Acquire distributed lock
  const lock = await cache.lock(`lock:${key}`, 30)

  if (!lock.acquired) {
    // Another instance is fetching - wait and retry
    await sleep(100)
    return getOrSet(key, fetchFn, ttl)
  }

  try {
    // Double-check after acquiring lock
    value = await cache.get<T>(key)
    if (value) return value

    // Fetch and cache
    value = await fetchFn()
    await cache.set(key, value, ttl)
    return value
  } finally {
    await lock.release()
  }
}
```

## Read Replicas

```typescript
const cache = new Cache({
  store: 'redis',
  master: { host: 'redis-master', port: 6379 },
  replicas: [
    { host: 'redis-replica-1', port: 6379 },
    { host: 'redis-replica-2', port: 6379 },
  ],
  readPreference: 'replica', // Read from replicas
})
```

## Health Checks

```typescript
async function healthCheck() {
  const results = await Promise.allSettled([
    cache.ping(),
    cache.get('__health__'),
  ])

  return {
    healthy: results.every((r) => r.status === 'fulfilled'),
    latency: await measureLatency(),
  }
}

async function measureLatency() {
  const start = performance.now()
  await cache.set('__latency__', Date.now(), 1)
  return performance.now() - start
}
```
