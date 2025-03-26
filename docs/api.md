# API Reference

## Cache Class

The main class for handling in-memory caching operations.

### Constructor

```typescript
constructor(options: Options = {})
```

Creates a new cache instance with optional configuration.

#### Configuration Options

```typescript
interface Options {
  forceString?: boolean
  objectValueSize?: number
  promiseValueSize?: number
  arrayValueSize?: number
  stdTTL?: number
  checkperiod?: number
  useClones?: boolean
  deleteOnExpire?: boolean
  enableLegacyCallbacks?: boolean
  maxKeys?: number
}
```

### Core Methods

#### get

```typescript
get<T>(key: Key): T | undefined
```

Retrieves a value from the cache. Returns `undefined` if the key doesn't exist or has expired.

**Parameters:**

- `key` (string | number): The key to retrieve
- Generic type `T`: The expected type of the retrieved value

**Returns:**

- The stored value or `undefined` if not found

**Example:**

```typescript
const value = cache.get<string>('myKey')
```

#### set

```typescript
set<T>(key: Key, value: T, ttl?: number | string): boolean
```

Sets a value in the cache with an optional Time To Live (TTL).

**Parameters:**

- `key` (string | number): The key to store the value under
- `value` (any): The value to store
- `ttl` (number | string, optional): Time to live in seconds. `0` means unlimited

**Returns:**

- `true` if the operation was successful

**Example:**

```typescript
cache.set('myKey', 'myValue', 60) // Expire after 60 seconds
```

#### mget

```typescript
mget<T>(keys: Key[]): { [key: string]: T }
```

Retrieves multiple values from the cache at once.

**Parameters:**

- `keys` (array): An array of keys to retrieve
- Generic type `T`: The expected type of the retrieved values

**Returns:**

- An object with the requested keys as properties and their values

**Example:**

```typescript
const values = cache.mget<string>(['key1', 'key2', 'key3'])
```

#### mset

```typescript
mset<T>(keyValueSet: ValueSetItem<T>[]): boolean
```

Sets multiple values in the cache at once.

**Parameters:**

- `keyValueSet` (array): An array of objects containing key, value, and optional ttl

**Returns:**

- `true` if the operation was successful

**Interface:**

```typescript
interface ValueSetItem<T> {
  key: Key
  val: T
  ttl?: number
}
```

**Example:**

```typescript
cache.mset([
  { key: 'key1', val: 'value1' },
  { key: 'key2', val: 'value2', ttl: 100 }
])
```

#### del

```typescript
del(keys: Key | Key[]): number
```

Deletes one or more keys from the cache.

**Parameters:**

- `keys` (string | number | array): A key or array of keys to delete

**Returns:**

- The number of deleted keys

**Example:**

```typescript
const deletedCount = cache.del(['key1', 'key2'])
```

#### has

```typescript
has(key: Key): boolean
```

Checks if a key exists in the cache and hasn't expired.

**Parameters:**

- `key` (string | number): The key to check

**Returns:**

- `true` if the key exists and is valid, `false` otherwise

**Example:**

```typescript
if (cache.has('myKey')) {
  // Key exists and is not expired
}
```

#### keys

```typescript
keys(): string[]
```

Lists all keys stored in the cache.

**Returns:**

- An array of all keys

**Example:**

```typescript
const allKeys = cache.keys()
```

#### take

```typescript
take<T>(key: Key): T | undefined
```

Gets a cached value and removes it from the cache in one operation.

**Parameters:**

- `key` (string | number): The key to retrieve and delete
- Generic type `T`: The expected type of the retrieved value

**Returns:**

- The stored value or `undefined` if not found

**Example:**

```typescript
const value = cache.take<string>('myKey')
```

#### ttl

```typescript
ttl(key: Key, ttl?: number): boolean
```

Resets or modifies the TTL of an existing cache key.

**Parameters:**

- `key` (string | number): The cache key
- `ttl` (number, optional): The new TTL in seconds. Default is the stdTTL

**Returns:**

- `true` if the key exists and TTL was updated, `false` otherwise

**Example:**

```typescript
cache.ttl('myKey', 300) // Reset TTL to 300 seconds
```

#### getTtl

```typescript
getTtl(key: Key): number | undefined
```

Gets the remaining TTL for a cache key.

**Parameters:**

- `key` (string | number): The cache key

**Returns:**

- Timestamp in milliseconds when the key will expire, `0` for infinite TTL, or `undefined` if the key doesn't exist

**Example:**

```typescript
const expireTime = cache.getTtl('myKey')
```

#### fetch

```typescript
fetch<T>(key: Key, ttlOrValue: number | string | (() => T) | T, value?: (() => T) | T): T
```

Gets a value from cache or computes and stores it if not present.

**Parameters:**

- `key` (string | number): The cache key
- `ttlOrValue`: Either a TTL value or the value/function to store
- `value` (optional): The value/function to store (if first param is TTL)

**Returns:**

- The fetched or computed value

**Example:**

```typescript
// With a value
const result = cache.fetch('myKey', 'myValue')

// With a function that computes the value
const result = cache.fetch('myKey', () => computeExpensiveValue())

// With TTL and a value
const result = cache.fetch('myKey', 60, 'myValue')
```

#### flushAll

```typescript
flushAll(): void
```

Clears all data from the cache and resets the stats.

**Example:**

```typescript
cache.flushAll()
```

#### flushStats

```typescript
flushStats(): void
```

Resets all cache statistics counters.

**Example:**

```typescript
cache.flushStats()
```

#### getStats

```typescript
getStats(): Stats
```

Gets the current cache statistics.

**Returns:**

- A Stats object with hit/miss counts, key count, and size information

**Interface:**

```typescript
interface Stats {
  hits: number
  misses: number
  keys: number
  ksize: number
  vsize: number
}
```

**Example:**

```typescript
const stats = cache.getStats()
```

#### close

```typescript
close(): void
```

Stops the automatic cleanup interval.

**Example:**

```typescript
cache.close()
```

### Events

The Cache class extends EventEmitter and emits the following events:

- `set` - Emitted when a key is set (Parameters: key, value)
- `del` - Emitted when a key is deleted (Parameters: key, value)
- `expired` - Emitted when a key expires (Parameters: key, value)
- `flush` - Emitted when cache is flushed
- `flush_stats` - Emitted when stats are flushed

**Example:**

```typescript
cache.on('expired', (key, value) => {
  console.log(`Key ${key} expired with value:`, value)
})
```

## Default Export

The library exports a default pre-configured cache instance for convenience:

```typescript
import cache from 'ts-cache'

cache.set('key', 'value')
```

## Types

### Key

```typescript
type Key = string | number
```

Keys can be either strings or numbers.

### Data

```typescript
interface Data {
  [key: string]: WrappedValue<any>
}
```

Internal storage container for cached data.

### WrappedValue

```typescript
interface WrappedValue<T> {
  t: number // TTL timestamp
  v: T      // Value
}
```

Internal wrapper for cached values with metadata.

### CacheError

```typescript
interface CacheError extends Error {
  name: string
  errorcode: string
  message: string
  data: any
}
```

Extended error type returned by cache operations.

## Usage Examples

See the [Usage Guide](./usage.md) for detailed examples of how to use these APIs.
