<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version](https://img.shields.io/npm/v/@stacksjs/ts-cache.svg)](https://www.npmjs.com/package/ts-cache)
[![License](https://img.shields.io/npm/l/@stacksjs/ts-cache.svg)](https://github.com/stacksjs/ts-cache/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@stacksjs/ts-cache)](https://bundlephobia.com/package/@stacksjs/ts-cache)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue)](https://www.typescriptlang.org/)

# ts-cache

A high-performance, type-safe caching library for TypeScript and JavaScript applications with support for multiple storage drivers including in-memory and Redis (using Bun's native Redis client).

## Features

- 🚀 **Multiple Drivers** _Memory and Redis support with driver abstraction_
- ⚡ **Bun Native Redis** _Built-in support for Bun's native Redis client (v1.2.9+)_
- 🔄 **Async API** _Promise-based API for all operations_
- ⏱️ **TTL Support** _Flexible time-to-live settings for cache entries_
- 🏷️ **Tagging System** _Organize and invalidate cache by tags_
- 📦 **Batch Operations** _Efficient multi-get, multi-set, and batch operations_
- 🔐 **Advanced Features** _Rate limiting, distributed locking, memoization_
- 📊 **Built-in Monitoring** _Statistics tracking and event system_
- 🛡️ **Type Safety** _Full TypeScript support with generics_
- 🔧 **Configurable** _Extensive options for fine-tuning behavior_
- 🌐 **Namespaces** _Isolate cache data with prefixed namespaces_
- 🔄 **Serializers** _Multiple serialization strategies for different data types_

## Installation

```bash
# Using npm
npm install @stacksjs/ts-cache

# Using yarn
yarn add @stacksjs/ts-cache

# Using pnpm
pnpm add @stacksjs/ts-cache

# Using bun
bun add @stacksjs/ts-cache
```

## Quick Start

### Memory Cache (Default)

```typescript
import { createCache } from '@stacksjs/ts-cache'

const cache = createCache() // Uses memory driver by default

// Store a value (with 5 minute TTL)
await cache.set('user:123', { name: 'John', role: 'admin' }, 300)

// Retrieve a value with type safety
const user = await cache.get<{ name: string, role: string }>('user:123')
if (user) {
  console.log(user.name) // TypeScript knows this is a string
}

// Check if a key exists
if (await cache.has('user:123')) {
  // Key exists and is not expired
}

// Delete a key
await cache.del('user:123')
```

### Redis Cache (Bun Native)

```typescript
import { createCache } from '@stacksjs/ts-cache'

const cache = createCache({
  driver: 'redis',
  url: 'redis://localhost:6379',
  prefix: 'myapp',
  stdTTL: 3600, // Default TTL: 1 hour
})

// Same API as memory cache
await cache.set('session:abc', { userId: 1 })
const session = await cache.get('session:abc')

// Close connection when done
await cache.close()
```

## Advanced Features

### Namespaces

Isolate cache data with namespaced prefixes:

```typescript
const cache = createCache()

// Create namespaced caches
const userCache = cache.namespace('users')
const postCache = cache.namespace('posts')

await userCache.set('1', { name: 'Alice' })
await postCache.set('1', { title: 'Hello World' })

// No collision between namespaces
console.log(await userCache.get('1')) // { name: 'Alice' }
console.log(await postCache.get('1')) // { title: 'Hello World' }
```

### Tagging

Organize and invalidate cache by tags:

```typescript
// Set values with tags
await cache.set('user:1', { name: 'John' })
await cache.tag('user:1', ['users', 'active'])

await cache.set('user:2', { name: 'Jane' })
await cache.tag('user:2', ['users', 'premium'])

// Get all keys by tag
const userKeys = await cache.getKeysByTag('users')

// Delete all entries with a tag
await cache.deleteByTag('users')
```

### Remember Pattern

Laravel-style remember pattern for fetch-or-compute:

```typescript
// Fetch from cache or compute if missing
const user = await cache.remember('user:1', 60, async () => {
  // Only called if cache miss
  return await database.getUser(1)
})

// Remember forever (no expiration)
const config = await cache.rememberForever('config', async () => {
  return await loadConfig()
})
```

### Rate Limiting

Built-in rate limiting utility:

```typescript
import { RateLimiter } from '@stacksjs/ts-cache'

const limiter = new RateLimiter(cache, 100, 60) // 100 requests per 60 seconds

const result = await limiter.check('user:123')
if (result.limited) {
  console.log('Rate limited! Try again at:', new Date(result.resetAt))
}
else {
  console.log('Request allowed. Remaining:', result.remaining)
}
```

### Distributed Locking

Implement distributed locks for critical sections:

```typescript
import { CacheLock } from '@stacksjs/ts-cache'

const lock = new CacheLock(cache, 30) // 30 second lock timeout

const result = await lock.withLock('critical:resource', async () => {
  // This code only runs if lock is acquired
  return await performCriticalOperation()
})

if (result === null) {
  console.log('Could not acquire lock')
}
```

### Memoization

Cache function results with automatic key generation:

```typescript
import { memoize } from '@stacksjs/ts-cache'

async function expensiveFunction(a: number, b: number) {
  // Expensive computation
  return a + b
}

const memoized = memoize(expensiveFunction, cache, {
  ttl: 60,
  keyGenerator: (a, b) => `sum:${a}:${b}`,
})

// First call computes
console.log(await memoized(5, 3)) // Computes and caches

// Second call uses cache
console.log(await memoized(5, 3)) // Returns cached result
```

## Batch Operations

Efficiently handle multiple operations:

```typescript
// Set multiple values at once
await cache.mset([
  { key: 'key1', value: 'value1', ttl: 60 },
  { key: 'key2', value: 'value2', ttl: 120 },
  { key: 'key3', value: 'value3' },
])

// Get multiple values at once
const values = await cache.mget(['key1', 'key2', 'key3'])
console.log(values) // { key1: 'value1', key2: 'value2', key3: 'value3' }

// Delete multiple keys
await cache.del(['key1', 'key2'])
```

## Serializers

Multiple serialization strategies for different data types:

```typescript
import { createCache, serializers } from '@stacksjs/ts-cache'

const cache = createCache({
  driver: 'redis',
  serializer: serializers.auto, // Auto-detects and preserves types
})

// Complex data types are preserved
await cache.set('date', new Date())
await cache.set('regex', /test/gi)
await cache.set('set', new Set([1, 2, 3]))
await cache.set('map', new Map([['a', 1]]))

// Available serializers:
// - serializers.json (default)
// - serializers.string
// - serializers.number
// - serializers.boolean
// - serializers.buffer
// - serializers.auto (preserves types)
// - serializers.msgpack (requires msgpack-lite)
```

## Events

Listen for cache events:

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

cache.on('del', (keys, count) => {
  console.log(`Deleted ${count} keys`)
})

cache.on('flush', () => {
  console.log('Cache flushed')
})
```

## Statistics

Track cache performance:

```typescript
const stats = await cache.getStats()
console.log(stats)
// {
//   hits: 127,
//   misses: 9,
//   keys: 42,
//   ksize: 840,
//   vsize: 2390
// }
```

## Configuration

### Memory Driver Options

```typescript
const cache = createCache({
  driver: 'memory',
  stdTTL: 3600, // Default TTL in seconds
  checkPeriod: 600, // Check for expired items every 10 minutes
  maxKeys: 1000, // Maximum number of keys
  useClones: true, // Clone values on get/set
  deleteOnExpire: true, // Remove items when they expire
  prefix: 'myapp', // Key prefix for namespacing
})
```

### Redis Driver Options

```typescript
const cache = createCache({
  driver: 'redis',
  url: 'redis://localhost:6379', // Redis connection URL
  // Or use individual options:
  host: 'localhost',
  port: 6379,
  password: 'secret',
  database: 0,

  // Connection options
  connectionTimeout: 5000,
  autoReconnect: true,
  maxRetries: 10,
  tls: false,

  // Cache options
  stdTTL: 3600,
  prefix: 'myapp',
})
```

## Utilities

### Circuit Breaker

Protect against cascading failures:

```typescript
import { CircuitBreaker } from '@stacksjs/ts-cache'

const breaker = new CircuitBreaker(cache, 5, 60) // 5 failures in 60 seconds

try {
  const result = await breaker.execute('api:endpoint', async () => {
    return await callExternalAPI()
  })
}
catch (error) {
  console.log('Circuit breaker is open')
}
```

### Cache Warmer

Preload cache with data:

```typescript
import { CacheWarmer } from '@stacksjs/ts-cache'

const warmer = new CacheWarmer(cache)

await warmer.warm([
  { key: 'user:1', fetcher: () => getUser(1), ttl: 3600 },
  { key: 'user:2', fetcher: () => getUser(2), ttl: 3600 },
])
```

### Debounced Cache

Debounce cache writes:

```typescript
import { DebouncedCache } from '@stacksjs/ts-cache'

const debounced = new DebouncedCache(cache, 1000) // 1 second delay

// Multiple rapid calls only write once
debounced.set('key', 'value1')
debounced.set('key', 'value2')
debounced.set('key', 'value3') // Only this value is written after 1 second
```

## Migration from v0.1.x

The legacy synchronous API is still available for backwards compatibility:

```typescript
import { Cache, createCache } from '@stacksjs/ts-cache'

// Old synchronous API (still works)
const syncCache = new Cache()
syncCache.set('key', 'value')
const syncValue = syncCache.get('key')

// New async API (recommended)
const asyncCache = createCache()
await asyncCache.set('key', 'value')
const asyncValue = await asyncCache.get('key')
```

## Use Cases

- **API Response Caching**: Reduce API calls by caching responses
- **Session Management**: Store user sessions with Redis for distributed apps
- **Rate Limiting**: Implement request throttling with automatic expiration
- **Distributed Locking**: Coordinate access to shared resources
- **Function Memoization**: Cache expensive function results
- **Database Query Caching**: Speed up repeated database queries
- **Computed Values**: Store results of expensive calculations

## Documentation

For detailed documentation, see:

- [Introduction](https://github.com/stacksjs/ts-cache/blob/main/docs/intro.md)
- [Installation Guide](https://github.com/stacksjs/ts-cache/blob/main/docs/install.md)
- [Usage Guide](https://github.com/stacksjs/ts-cache/blob/main/docs/usage.md)
- [API Reference](https://github.com/stacksjs/ts-cache/blob/main/docs/api.md)
- [Configuration Options](https://github.com/stacksjs/ts-cache/blob/main/docs/config.md)
- [Features](https://github.com/stacksjs/ts-cache/blob/main/docs/features.md)

## Contributing

Please see the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

"Software that is free, but hopes for a postcard." We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [`node-cache`](https://github.com/node-cache/node-cache) _for the original Node.js implementation_
- [Bun](https://bun.sh) _for the native Redis client_
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/ts-cache/contributors)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙
