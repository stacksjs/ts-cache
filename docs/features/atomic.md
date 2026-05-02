# Atomic Operations

Perform atomic cache operations for concurrent safety.

## Overview

Atomic operations ensure data integrity when multiple processes access the cache simultaneously.

## Increment & Decrement

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({ store: 'redis' })

// Initialize counter
await cache.set('visits', 0)

// Atomic increment
await cache.increment('visits')      // 1
await cache.increment('visits', 5)   // 6

// Atomic decrement
await cache.decrement('visits')      // 5
await cache.decrement('visits', 2)   // 3
```

## Add & Put

Conditional setting:

```typescript
// Add only if key doesn't exist (returns false if exists)
const added = await cache.add('lock:resource', 'owner-1', 30)

if (added) {
  // Successfully acquired lock
  try {
    await processResource()
  } finally {
    await cache.delete('lock:resource')
  }
}

// Put always sets the value
await cache.put('key', 'value', 60)
```

## Compare and Swap

```typescript
// Update only if current value matches
const success = await cache.cas('counter', {
  expected: 5,
  value: 6,
})

if (!success) {
  // Value was changed by another process
}
```

## Locks

Distributed locking:

```typescript
// Acquire lock with automatic release
const lock = await cache.lock('process:daily-report', 60)

if (lock.acquired) {
  try {
    await generateDailyReport()
  } finally {
    await lock.release()
  }
} else {
  console.log('Another process is generating the report')
}

// Block until lock is available
const lock = await cache.lock('resource', 60, { block: 5000 })
```

## Rate Limiting

```typescript
async function rateLimit(key: string, limit: number, window: number) {
  const current = await cache.increment(`ratelimit:${key}`)

  if (current === 1) {
    // First request - set expiry
    await cache.expire(`ratelimit:${key}`, window)
  }

  return current <= limit
}

// Usage
const allowed = await rateLimit('api:user:123', 100, 60)
if (!allowed) {
  throw new Error('Rate limit exceeded')
}
```

## Atomic Remember

Cache with race condition protection:

```typescript
// Only one process will execute the callback
const data = await cache.remember('expensive-query', 3600, async () => {
  return await expensiveOperation()
}, { lock: true })
```

## Transaction-like Operations

```typescript
// Multi-key atomic operations (Redis)
await cache.multi([
  { op: 'set', key: 'user:123:name', value: 'John' },
  { op: 'set', key: 'user:123:email', value: 'john@example.com' },
  { op: 'increment', key: 'user:count' },
])
```
