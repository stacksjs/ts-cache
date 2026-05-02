# API Reference

Complete reference for all ts-cache methods and options.

## createCache()

Factory function to create a cache instance:

```typescript
import { createCache } from '@stacksjs/ts-cache'

const cache = createCache(options)
```

### Options

```typescript
interface CacheOptions {
  // Driver selection
  driver?: 'memory' | 'memory-lru' | 'redis'

  // Common options
  prefix?: string           // Key prefix for namespacing
  stdTTL?: number          // Default TTL in seconds (0 = no expiration)
  checkPeriod?: number     // Expiration check interval in seconds
  maxKeys?: number         // Maximum number of keys
  useClones?: boolean      // Clone values on get/set
  deleteOnExpire?: boolean // Delete expired items

  // Redis-specific options
  url?: string             // Redis connection URL
  host?: string            // Redis host
  port?: number            // Redis port
  password?: string        // Redis password
  database?: number        // Redis database number
  connectionTimeout?: number
  autoReconnect?: boolean
  maxRetries?: number
  tls?: boolean

  // Performance options
  enableStats?: boolean    // Enable statistics tracking
  enableEvents?: boolean   // Enable event emission
  maxPerformance?: boolean // Use Map for storage

  // Compression
  compression?: {
    algorithm?: 'gzip' | 'brotli' | 'smart' | 'none'
    level?: number
    threshold?: number
    enabled?: boolean
  }
}
```

## Core Methods

### get()

Retrieves a value from the cache.

```typescript
get<T>(key: Key): T | undefined
// Async version
get<T>(key: Key): Promise<T | undefined>
```

**Parameters:**
- `key` - The cache key (string or number)

**Returns:** The cached value or `undefined` if not found/expired

**Example:**
```typescript
// Basic get
const value = await cache.get('key')

// With type assertion
const user = await cache.get<User>('user:123')

// Handle missing values
const value = await cache.get('key') ?? 'default'
```

### set()

Stores a value in the cache.

```typescript
set<T>(key: Key, value: T, ttl?: number): boolean
// Async version
set<T>(key: Key, value: T, ttl?: number): Promise<boolean>
```

**Parameters:**
- `key` - The cache key
- `value` - The value to store
- `ttl` - Optional TTL in seconds (overrides default)

**Returns:** `true` if successful

**Example:**
```typescript
// With default TTL
await cache.set('key', 'value')

// With specific TTL (5 minutes)
await cache.set('key', 'value', 300)

// Store complex objects
await cache.set('user:123', { id: 123, name: 'John' }, 3600)
```

### mget()

Retrieves multiple values at once.

```typescript
mget<T>(keys: Key[]): { [key: string]: T }
// Async version
mget<T>(keys: Key[]): Promise<{ [key: string]: T }>
```

**Parameters:**
- `keys` - Array of cache keys

**Returns:** Object mapping keys to their values (missing keys are omitted)

**Example:**
```typescript
const values = await cache.mget(['key1', 'key2', 'key3'])
// { key1: 'value1', key2: 'value2' }
// key3 is missing/expired, so not included
```

### mset()

Stores multiple values at once.

```typescript
interface ValueSetItem<T> {
  key: Key
  val: T
  ttl?: number
}

mset<T>(keyValueSet: ValueSetItem<T>[]): boolean
// Async version
mset<T>(keyValueSet: ValueSetItem<T>[]): Promise<boolean>
```

**Parameters:**
- `keyValueSet` - Array of key-value-ttl objects

**Returns:** `true` if successful

**Example:**
```typescript
await cache.mset([
  { key: 'key1', val: 'value1', ttl: 60 },
  { key: 'key2', val: 'value2', ttl: 120 },
  { key: 'key3', val: 'value3' }, // Uses default TTL
])
```

### del()

Deletes one or more keys.

```typescript
del(keys: Key | Key[]): number
// Async version
del(keys: Key | Key[]): Promise<number>
```

**Parameters:**
- `keys` - Single key or array of keys to delete

**Returns:** Number of keys deleted

**Example:**
```typescript
// Delete single key
await cache.del('key')

// Delete multiple keys
const deleted = await cache.del(['key1', 'key2', 'key3'])
console.log(`Deleted ${deleted} keys`)
```

### take()

Gets a value and deletes it atomically.

```typescript
take<T>(key: Key): T | undefined
// Async version
take<T>(key: Key): Promise<T | undefined>
```

**Parameters:**
- `key` - The cache key

**Returns:** The value, or `undefined` if not found

**Example:**
```typescript
// One-time tokens
const token = await cache.take('reset-token:abc')
if (token) {
  // Token has been removed from cache
  await processToken(token)
}
```

### has()

Checks if a key exists and is not expired.

```typescript
has(key: Key): boolean
// Async version
has(key: Key): Promise<boolean>
```

**Parameters:**
- `key` - The cache key

**Returns:** `true` if key exists and is valid

**Example:**
```typescript
if (await cache.has('session:123')) {
  console.log('Session is active')
}
```

### keys()

Lists all keys in the cache.

```typescript
keys(): string[]
// Async version
keys(pattern?: string): Promise<string[]>
```

**Parameters:**
- `pattern` - Optional pattern for filtering (Redis only, supports `*` wildcards)

**Returns:** Array of key names

**Example:**
```typescript
// All keys
const allKeys = await cache.keys()

// Keys matching pattern (Redis)
const userKeys = await cache.keys('user:*')
```

## TTL Methods

### ttl()

Sets or updates the TTL of a key.

```typescript
ttl(key: Key, ttl?: number): boolean
// Async version
ttl(key: Key, ttl?: number): Promise<boolean>
```

**Parameters:**
- `key` - The cache key
- `ttl` - New TTL in seconds (uses default if omitted, negative deletes the key)

**Returns:** `true` if key exists and TTL was set

**Example:**
```typescript
// Reset to default TTL
await cache.ttl('key')

// Set specific TTL
await cache.ttl('key', 3600)

// Delete by setting negative TTL
await cache.ttl('key', -1)
```

### getTtl()

Gets the remaining TTL of a key.

```typescript
getTtl(key: Key): number | undefined
// Async version
getTtl(key: Key): Promise<number | undefined>
```

**Parameters:**
- `key` - The cache key

**Returns:** Timestamp when key expires, `0` for no expiration, `undefined` if not found

**Example:**
```typescript
const expiresAt = await cache.getTtl('key')
if (expiresAt) {
  const remaining = expiresAt - Date.now()
  console.log(`Expires in ${Math.ceil(remaining / 1000)} seconds`)
}
```

## Fetch Methods

### fetch()

Gets a value or computes it if missing.

```typescript
fetch<T>(key: Key, value: (() => T) | T): T
fetch<T>(key: Key, ttl: number | string, value: (() => T) | T): T
// Async version
fetch<T>(key: Key, value: (() => Promise<T>) | T): Promise<T>
fetch<T>(key: Key, ttl: number, value: (() => Promise<T>) | T): Promise<T>
```

**Parameters:**
- `key` - The cache key
- `ttl` - Optional TTL in seconds
- `value` - Value or function that returns the value

**Returns:** The cached or computed value

**Example:**
```typescript
// With static value
const value = cache.fetch('key', 'default')

// With computed value
const user = await cache.fetch('user:123', async () => {
  return await db.users.findById(123)
})

// With TTL
const config = await cache.fetch('config', 3600, async () => {
  return await loadConfig()
})
```

### remember()

Laravel-style remember pattern.

```typescript
remember<T>(key: Key, ttl: number, callback: () => Promise<T>): Promise<T>
```

**Parameters:**
- `key` - The cache key
- `ttl` - TTL in seconds
- `callback` - Async function to compute value on cache miss

**Returns:** The cached or computed value

**Example:**
```typescript
const user = await cache.remember('user:123', 60, async () => {
  return await database.getUser(123)
})
```

### rememberForever()

Remember with no expiration.

```typescript
rememberForever<T>(key: Key, callback: () => Promise<T>): Promise<T>
```

**Example:**
```typescript
const config = await cache.rememberForever('config', async () => {
  return await loadConfig()
})
```

## Namespace Methods

### namespace()

Creates a namespaced cache instance.

```typescript
namespace(prefix: string): Cache
```

**Parameters:**
- `prefix` - Namespace prefix

**Returns:** A new cache instance with the namespace prefix

**Example:**
```typescript
const userCache = cache.namespace('users')
const postCache = cache.namespace('posts')

await userCache.set('1', user1)
// Actual key: 'users:1'

await postCache.set('1', post1)
// Actual key: 'posts:1'
```

## Tagging Methods

### tag()

Associates tags with a key.

```typescript
tag(key: Key, tags: string[]): Promise<void>
```

**Example:**
```typescript
await cache.set('user:1', userData)
await cache.tag('user:1', ['users', 'active'])
```

### getKeysByTag()

Gets all keys with a specific tag.

```typescript
getKeysByTag(tag: string): Promise<string[]>
```

**Example:**
```typescript
const activeUsers = await cache.getKeysByTag('active')
```

### deleteByTag()

Deletes all keys with a specific tag.

```typescript
deleteByTag(tag: string): Promise<number>
```

**Returns:** Number of keys deleted

**Example:**
```typescript
const deleted = await cache.deleteByTag('users')
console.log(`Deleted ${deleted} user cache entries`)
```

## Statistics Methods

### getStats()

Gets cache statistics.

```typescript
getStats(): Stats
// Async version
getStats(): Promise<Stats>

interface Stats {
  hits: number    // Cache hits
  misses: number  // Cache misses
  keys: number    // Current key count
  ksize: number   // Total key size in bytes
  vsize: number   // Total value size in bytes
}
```

**Example:**
```typescript
const stats = await cache.getStats()
console.log(`Hit rate: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(1)}%`)
```

### flushStats()

Resets statistics counters.

```typescript
flushStats(): void
```

**Example:**
```typescript
cache.flushStats()
```

## Flush Methods

### flushAll()

Clears all cached data and resets statistics.

```typescript
flushAll(startPeriod?: boolean): void
// Async version
flushAll(): Promise<void>
```

**Parameters:**
- `startPeriod` - Whether to restart the check period (default: true)

**Example:**
```typescript
await cache.flushAll()
```

## Lifecycle Methods

### close()

Closes the cache and releases resources.

```typescript
close(): void
// Async version
close(): Promise<void>
```

**Example:**
```typescript
// Clean up on shutdown
process.on('SIGTERM', async () => {
  await cache.close()
  process.exit(0)
})
```

## Event Methods

### on()

Subscribes to cache events.

```typescript
on(event: string, listener: (...args: any[]) => void): this
```

**Events:**
- `set` - `(key, value)` - Value was stored
- `del` - `(key, value)` - Value was deleted
- `expired` - `(key, value)` - Value expired
- `flush` - Cache was flushed
- `flush_stats` - Statistics were reset
- `hit` - `(key, value)` - Cache hit
- `miss` - `(key)` - Cache miss

**Example:**
```typescript
cache.on('expired', (key, value) => {
  console.log(`Key ${key} expired`)
})

cache.on('flush', () => {
  console.log('Cache was cleared')
})
```

### emit()

Emits a cache event.

```typescript
emit(event: string, ...args: any[]): boolean
```

## Error Handling

ts-cache throws specific errors:

```typescript
interface CacheError extends Error {
  name: string
  errorcode: string
  message: string
  data: any
}
```

**Error Codes:**
- `EKEYTYPE` - Invalid key type (must be string or number)
- `ECACHEFULL` - Cache has reached maxKeys limit

**Example:**
```typescript
try {
  cache.set({} as any, 'value') // Invalid key
} catch (error) {
  if (error.errorcode === 'EKEYTYPE') {
    console.error('Invalid key type:', error.data.type)
  }
}
```

## Type Definitions

### Key

```typescript
type Key = string | number
```

### ValueSetItem

```typescript
interface ValueSetItem<T = any> {
  key: Key
  val: T
  ttl?: number
}
```

### Stats

```typescript
interface Stats {
  hits: number
  misses: number
  keys: number
  ksize: number
  vsize: number
}
```

### Options

```typescript
interface Options {
  forceString?: boolean
  objectValueSize?: number
  promiseValueSize?: number
  arrayValueSize?: number
  stdTTL?: number
  checkPeriod?: number
  useClones?: boolean
  deleteOnExpire?: boolean
  enableLegacyCallbacks?: boolean
  maxKeys?: number
  enableStats?: boolean
  enableEvents?: boolean
  maxPerformance?: boolean
}
```
