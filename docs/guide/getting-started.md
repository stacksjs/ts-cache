# Getting Started

ts-cache is a high-performance, type-safe caching library for TypeScript and JavaScript applications with support for multiple storage drivers including in-memory and Redis (using Bun's native Redis client).

## Features

- **Multiple Drivers** - Memory, Memory-LRU, and Redis (using Bun's native client)
- **Async & Sync APIs** - Promise-based async API with legacy sync support
- **Flexible TTL** - Per-key TTL with fixed, sliding window, and probabilistic strategies
- **Batch Operations** - Efficient mset/mget for multiple keys at once
- **Tagging System** - Organize and invalidate cache entries by tags
- **Caching Patterns** - Cache-aside, read-through, write-through, write-behind, refresh-ahead
- **CLI Tool** - Complete command-line interface
- **Compression** - gzip, brotli, and smart compression
- **Type Safety** - Full TypeScript support with generics

## Installation

Install ts-cache using your preferred package manager:

```bash
# Using bun
bun add @stacksjs/ts-cache

# Using npm
npm install @stacksjs/ts-cache

# Using pnpm
pnpm add @stacksjs/ts-cache

# Using yarn
yarn add @stacksjs/ts-cache
```

## Quick Start

### Basic Usage

```typescript
import { createCache } from '@stacksjs/ts-cache'

// Create a cache instance (uses memory driver by default)
const cache = createCache()

// Store a value with 5 minute TTL
await cache.set('user:123', { name: 'John', role: 'admin' }, 300)

// Retrieve a value with type safety
const user = await cache.get<{ name: string, role: string }>('user:123')
if (user) {
  console.log(user.name) // TypeScript knows this is a string
}

// Check if a key exists
if (await cache.has('user:123')) {
  console.log('User is cached')
}

// Delete a key
await cache.del('user:123')
```

### Using the Synchronous API

For simpler use cases, use the synchronous Cache class:

```typescript
import { Cache } from '@stacksjs/ts-cache'

const cache = new Cache()

// Synchronous operations
cache.set('key', 'value', 60) // 60 second TTL
const value = cache.get('key')
cache.del('key')
```

### Redis Cache

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

## Core Operations

### Set and Get

```typescript
// Set with default TTL
await cache.set('key', 'value')

// Set with specific TTL (in seconds)
await cache.set('key', 'value', 300) // 5 minutes

// Get with type assertion
const value = await cache.get<string>('key')

// Get with fallback
const value = await cache.get('key') ?? 'default'
```

### Multiple Keys (Batch Operations)

```typescript
// Set multiple values at once
await cache.mset([
  { key: 'key1', value: 'value1', ttl: 60 },
  { key: 'key2', value: 'value2', ttl: 120 },
  { key: 'key3', value: 'value3' },
])

// Get multiple values at once
const values = await cache.mget(['key1', 'key2', 'key3'])
console.log(values)
// { key1: 'value1', key2: 'value2', key3: 'value3' }

// Delete multiple keys
await cache.del(['key1', 'key2'])
```

### Take (Get and Delete)

```typescript
// Get value and remove it atomically
const token = await cache.take('one-time-token')
if (token) {
  // Token is now deleted from cache
  useToken(token)
}
```

### Fetch (Get or Compute)

```typescript
// Get value or compute if missing
const user = await cache.fetch('user:123', async () => {
  return await database.getUser(123)
})

// With TTL
const user = await cache.fetch('user:123', 300, async () => {
  return await database.getUser(123)
})
```

### Check Existence

```typescript
// Check if key exists and is not expired
const exists = await cache.has('key')

// List all keys
const keys = await cache.keys()

// List keys matching pattern (with Redis)
const userKeys = await cache.keys('user:*')
```

## Configuration

### Memory Cache Options

```typescript
const cache = createCache({
  driver: 'memory',

  // Time-to-live in seconds (0 = no expiration)
  stdTTL: 3600,

  // Check for expired items every N seconds
  checkPeriod: 600,

  // Maximum number of keys
  maxKeys: 1000,

  // Clone values on get/set
  useClones: true,

  // Delete items when they expire
  deleteOnExpire: true,

  // Key prefix
  prefix: 'myapp',
})
```

### Redis Cache Options

```typescript
const cache = createCache({
  driver: 'redis',

  // Connection
  url: 'redis://localhost:6379',
  // Or individual options:
  host: 'localhost',
  port: 6379,
  password: 'secret',
  database: 0,

  // Connection settings
  connectionTimeout: 5000,
  autoReconnect: true,
  maxRetries: 10,
  tls: false,

  // Cache settings
  stdTTL: 3600,
  prefix: 'myapp',
})
```

### LRU Cache Options

```typescript
const cache = createCache({
  driver: 'memory-lru',
  maxKeys: 1000, // Required for LRU
  stdTTL: 3600,
})
```

## Namespaces

Isolate cache data with namespaces:

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

## Tagging

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

## Remember Pattern

Laravel-style fetch-or-compute pattern:

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

// Calculate hit rate
const hitRate = stats.hits / (stats.hits + stats.misses)
console.log(`Hit rate: ${(hitRate * 100).toFixed(1)}%`)
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

cache.on('expired', (key, value) => {
  console.log(`Key expired: ${key}`)
})

cache.on('flush', () => {
  console.log('Cache flushed')
})
```

## Flushing

```typescript
// Clear all cache data
await cache.flushAll()

// Reset statistics only
await cache.flushStats()
```

## Cleanup

```typescript
// Stop background cleanup tasks
cache.close()
```

## Performance Tips

For maximum performance, disable features you don't need:

```typescript
const cache = new Cache({
  useClones: false,     // Store references (no cloning)
  enableStats: false,   // Disable statistics
  enableEvents: false,  // Disable events
  stdTTL: 0,           // Disable TTL checking
  checkPeriod: 0,      // Disable expiration checks
  maxPerformance: true, // Use Map storage
})
```

## Next Steps

- [API Reference](/guide/api) - Complete method documentation
- [TTL Management](/guide/ttl) - Time-to-live strategies and patterns
