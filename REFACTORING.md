# Cache Refactoring Summary

## Overview

The cache library has been refactored from a single monolithic class into a modular, driver-based architecture with extensive new features and Redis support using Bun's native Redis client.

## New Architecture

### File Structure

```
src/
├── cache.ts                  # Legacy synchronous cache (backwards compatible)
├── manager.ts                # New async cache manager with driver abstraction
├── config.ts                 # Configuration constants
├── types.ts                  # Core type definitions
├── index.ts                  # Main exports
├── drivers/
│   ├── types.ts             # Driver interfaces and types
│   ├── memory.ts            # In-memory cache driver
│   ├── redis.ts             # Redis driver (Bun native)
│   └── index.ts             # Driver exports
├── serializers/
│   └── index.ts             # Serialization strategies
└── utils/
    └── index.ts             # Utility classes and functions
```

## Key Features Added

### 1. Multiple Drivers

- **Memory Driver**: Fast in-memory caching (same as before, but async)
- **Redis Driver**: Distributed caching using Bun's native Redis client (v1.2.9+)
- Driver abstraction allows easy addition of new drivers

### 2. Async API

All operations are now promise-based for consistency and to support external storage drivers:

```typescript
// Old (still works via legacy Cache class)
cache.set('key', 'value')
const value = cache.get('key')

// New (recommended)
await cache.set('key', 'value')
const value = await cache.get('key')
```

### 3. Redis Support

Full Redis support using Bun's native Redis client:

```typescript
const cache = createCache({
  driver: 'redis',
  url: 'redis://localhost:6379',
  prefix: 'myapp',
})

await cache.set('key', 'value', 3600)
```

Features:
- Connection management (auto-reconnect, retries)
- TLS support
- Pub/Sub support (via Bun's Redis client)
- All standard Redis operations
- Tag support using Redis Sets

### 4. Tagging System

Organize and invalidate cache by tags:

```typescript
await cache.set('user:1', userData)
await cache.tag('user:1', ['users', 'active'])

// Get all keys by tag
const userKeys = await cache.getKeysByTag('users')

// Delete all entries with a tag
await cache.deleteByTag('users')
```

### 5. Namespaces

Isolate cache data with prefixed namespaces:

```typescript
const userCache = cache.namespace('users')
const postCache = cache.namespace('posts')

await userCache.set('1', userData)
await postCache.set('1', postData)

// No collision between namespaces
```

### 6. Serializers

Multiple serialization strategies:

- **JSON**: Default serializer for objects
- **String**: Plain text values
- **Number**: Numeric values
- **Boolean**: Boolean values
- **Buffer**: Binary data
- **Auto**: Automatically detects and preserves types (Date, RegExp, Set, Map, etc.)
- **MessagePack**: Efficient binary serialization (optional dependency)

```typescript
const cache = createCache({
  driver: 'redis',
  serializer: serializers.auto, // Preserves types
})

await cache.set('date', new Date())
const date = await cache.get<Date>('date')
// date is still a Date instance!
```

### 7. Advanced Utilities

#### Rate Limiting

```typescript
import { RateLimiter } from '@stacksjs/ts-cache'

const limiter = new RateLimiter(cache, 100, 60)
const result = await limiter.check('user:123')

if (result.limited) {
  console.log('Rate limited!')
}
```

#### Distributed Locking

```typescript
import { CacheLock } from '@stacksjs/ts-cache'

const lock = new CacheLock(cache, 30)
const result = await lock.withLock('resource', async () => {
  // Critical section
  return await performOperation()
})
```

#### Memoization

```typescript
import { memoize } from '@stacksjs/ts-cache'

const memoized = memoize(expensiveFunction, cache, {
  ttl: 60,
  keyGenerator: (a, b) => `sum:${a}:${b}`,
})
```

#### Circuit Breaker

```typescript
import { CircuitBreaker } from '@stacksjs/ts-cache'

const breaker = new CircuitBreaker(cache, 5, 60)
const result = await breaker.execute('api', async () => {
  return await callExternalAPI()
})
```

#### Cache Warmer

```typescript
import { CacheWarmer } from '@stacksjs/ts-cache'

const warmer = new CacheWarmer(cache)
await warmer.warm([
  { key: 'user:1', fetcher: () => getUser(1), ttl: 3600 },
  { key: 'user:2', fetcher: () => getUser(2), ttl: 3600 },
])
```

#### Debounced Cache

```typescript
import { DebouncedCache } from '@stacksjs/ts-cache'

const debounced = new DebouncedCache(cache, 1000)
debounced.set('key', 'value') // Debounced by 1 second
```

### 8. Remember Pattern

Laravel-style remember pattern:

```typescript
const user = await cache.remember('user:1', 60, async () => {
  return await database.getUser(1)
})

const config = await cache.rememberForever('config', async () => {
  return await loadConfig()
})
```

### 9. Events

Listen for cache operations:

```typescript
cache.on('hit', (key, value) => {
  console.log(`Cache hit: ${key}`)
})

cache.on('miss', (key) => {
  console.log(`Cache miss: ${key}`)
})

cache.on('set', (key, value, ttl) => {
  console.log(`Cache set: ${key}`)
})
```

## Backwards Compatibility

The legacy synchronous `Cache` class is still available:

```typescript
import { Cache } from '@stacksjs/ts-cache'

const cache = new Cache()
cache.set('key', 'value')
const value = cache.get('key')
```

## Migration Guide

### From v0.1.x to v0.2.x

1. **Update imports and initialization**:

   Before (v0.1.x):
   ```typescript
   import cache from '@stacksjs/ts-cache'
   ```

   After (v0.2.x):
   ```typescript
   import { createCache } from '@stacksjs/ts-cache'
   const cache = createCache()
   ```

2. **Add async/await**:
   ```typescript
   // Old
   cache.set('key', 'value')
   const value = cache.get('key')

   // New
   await cache.set('key', 'value')
   const value = await cache.get('key')
   ```

3. **Update configuration** (optional):
   ```typescript
   const cache = createCache({
     driver: 'memory', // or 'redis'
     stdTTL: 3600,
     // ... other options
   })
   ```

## Configuration

### Memory Driver Options

```typescript
const cache = createCache({
  driver: 'memory',
  stdTTL: 3600,
  checkPeriod: 600,
  maxKeys: 1000,
  useClones: true,
  deleteOnExpire: true,
  prefix: 'myapp',
})
```

### Redis Driver Options

```typescript
const cache = createCache({
  driver: 'redis',
  url: 'redis://localhost:6379',
  // Or individual options:
  host: 'localhost',
  port: 6379,
  password: 'secret',
  database: 0,
  connectionTimeout: 5000,
  autoReconnect: true,
  maxRetries: 10,
  tls: false,
  stdTTL: 3600,
  prefix: 'myapp',
  serializer: serializers.json,
})
```

## Testing

Run the examples to test the new features:

```bash
bun examples/usage.ts
```

## Performance Notes

- Memory driver: Same performance as before
- Redis driver: Uses Bun's native bindings for optimal performance
- Serialization overhead depends on chosen serializer
- Auto-serializer adds minimal overhead for type preservation

## Future Enhancements

Potential additions for future versions:

- [ ] Database drivers (PostgreSQL, MongoDB, etc.)
- [ ] File system driver
- [ ] More pub/sub features
- [ ] Cache warming strategies
- [ ] Advanced eviction policies (LRU, LFU)
- [ ] Compression support
- [ ] Cache metrics and monitoring

## Credits

- Original `node-cache` implementation
- Bun team for native Redis client
- Community feedback and contributions
