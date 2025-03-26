# API Reference

This document provides a comprehensive reference for the ts-cache API, detailing all available methods, options, and events.

## Table of Contents

- [Cache Class](#cache-class)
- [Constructor Options](#constructor-options)
- [Core Methods](#core-methods)
- [TTL Methods](#ttl-methods)
- [Batch Operations](#batch-operations)
- [Statistics](#statistics)
- [Events](#events)
- [Error Codes](#error-codes)

## Cache Class

The main `Cache` class is the primary entry point for using ts-cache.

```typescript
import { Cache } from 'ts-cache';
// or
import Cache from 'ts-cache';
```

You can use either the default cache instance or create your own:

```typescript
// Using default instance
import cache from 'ts-cache';

// Creating custom instance
import { Cache } from 'ts-cache';
const myCache = new Cache({ ttl: 600 });
```

## Constructor Options

When creating a new cache instance, you can specify several options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | `number` | `0` | Default time-to-live in seconds (0 = infinite) |
| `checkPeriod` | `number` | `600` | Period in seconds for automatic cleanup (0 = no periodic cleanup) |
| `maxKeys` | `number` | `-1` | Maximum number of keys allowed (-1 = no limit) |
| `useClones` | `boolean` | `true` | Whether to clone values when getting/setting |
| `forceString` | `boolean` | `false` | Whether to convert values to strings |
| `stale` | `boolean` | `false` | Allow retrieval of stale items before cleanup |
| `promiseValueSize` | `number` | `1` | Size calculation for Promise values |
| `deleteOnExpire` | `boolean` | `true` | Whether to delete keys when they expire |
| `enableLegacyCallbacks` | `boolean` | `false` | Enable old-style callbacks |

## Core Methods

### set(key, value, [ttl])

Sets a value in the cache.

```typescript
cache.set(key: string | number, value: any, ttl?: number): boolean
```

**Parameters:**

- `key`: String or number key for the cache entry
- `value`: Any value to store (objects, strings, numbers, etc.)
- `ttl`: (Optional) Time-to-live in seconds, overrides default TTL

**Returns:** Boolean indicating success

**Example:**

```typescript
cache.set('user:123', { name: 'John', role: 'admin' }, 300);
```

### get(key)

Retrieves a value from the cache.

```typescript
cache.get<T>(key: string | number): T | undefined
```

**Parameters:**

- `key`: String or number key to retrieve

**Returns:** The cached value, or undefined if not found or expired

**Example:**

```typescript
const user = cache.get<UserType>('user:123');
if (user) {
  console.log(user.name); // TypeScript knows this is UserType
}
```

### has(key)

Checks if a key exists in the cache and is not expired.

```typescript
cache.has(key: string | number): boolean
```

**Parameters:**

- `key`: String or number key to check

**Returns:** Boolean indicating if the key exists and is not expired

**Example:**

```typescript
if (cache.has('api:response:users')) {
  // Use cached response
} else {
  // Fetch new data
}
```

### del(key)

Deletes a key from the cache.

```typescript
cache.del(key: string | number | Array<string | number>): boolean
```

**Parameters:**

- `key`: String, number, or array of keys to delete

**Returns:** Boolean indicating if deletion was successful

**Example:**

```typescript
// Delete single key
cache.del('session:token');

// Delete multiple keys
cache.del(['user:123', 'user:124', 'user:125']);
```

### take(key)

Gets a value and removes it from the cache in one atomic operation.

```typescript
cache.take<T>(key: string | number): T | undefined
```

**Parameters:**

- `key`: String or number key to retrieve and delete

**Returns:** The cached value before deletion, or undefined if not found

**Example:**

```typescript
const oneTimeToken = cache.take<string>('auth:one-time-token');
```

### reset()

Deletes all keys from the cache.

```typescript
cache.reset(): void
```

**Example:**

```typescript
cache.reset(); // Clear entire cache
```

### keys()

Returns an array of all keys in the cache.

```typescript
cache.keys(): string[]
```

**Returns:** Array of key strings

**Example:**

```typescript
const allKeys = cache.keys();
console.log(`Cache has ${allKeys.length} items`);
```

### fetch(key, [ttl], valueOrFn)

Gets a value from the cache or computes and stores it if not present.

```typescript
// With direct value
cache.fetch<T>(key: string | number, value: T): T

// With TTL and direct value
cache.fetch<T>(key: string | number, ttl: number, value: T): T

// With function
cache.fetch<T>(key: string | number, fn: () => T): T

// With TTL and function
cache.fetch<T>(key: string | number, ttl: number, fn: () => T): T
```

**Parameters:**

- `key`: String or number key to fetch
- `ttl`: (Optional) Time-to-live in seconds
- `valueOrFn`: Value to store or function to compute value

**Returns:** The cached or computed value

**Example:**

```typescript
// With direct value
const user = cache.fetch('user:123', { name: 'Default User' });

// With computation function and TTL
const apiData = cache.fetch('api:users', 300, () => {
  return fetchUsersFromApi();
});
```

## TTL Methods

### ttl(key, [ttl])

Gets or sets the time-to-live for a key.

```typescript
// Get TTL
cache.ttl(key: string | number): number

// Set TTL
cache.ttl(key: string | number, ttl: number): boolean
```

**Parameters:**

- `key`: String or number key to check/modify
- `ttl`: (Optional) New TTL in seconds (0 = infinite)

**Returns:**

- When getting: Remaining TTL in seconds, or -1 if expired/not found
- When setting: Boolean indicating success

**Example:**

```typescript
// Get remaining TTL
const remainingTime = cache.ttl('session:token');

// Set new TTL
cache.ttl('session:token', 3600); // Extend to 1 hour
```

### getTtl(key)

Gets the expiration timestamp for a key.

```typescript
cache.getTtl(key: string | number): number
```

**Parameters:**

- `key`: String or number key to check

**Returns:** Unix timestamp in seconds when the key will expire, or 0 if non-expiring, or -1 if not found

**Example:**

```typescript
const expiryTimestamp = cache.getTtl('session:token');
```

## Batch Operations

### mset(keyValuePairs)

Sets multiple values in the cache at once.

```typescript
cache.mset(keyValuePairs: Array<{
  key: string | number,
  val: any,
  ttl?: number
}>): boolean
```

**Parameters:**

- `keyValuePairs`: Array of objects with key, val, and optional ttl

**Returns:** Boolean indicating success

**Example:**

```typescript
cache.mset([
  { key: 'user:123', val: { name: 'John' } },
  { key: 'user:124', val: { name: 'Jane' }, ttl: 600 }
]);
```

### mget(keys)

Gets multiple values from the cache at once.

```typescript
cache.mget<T>(keys: Array<string | number>): Record<string, T>
```

**Parameters:**

- `keys`: Array of keys to retrieve

**Returns:** Object mapping keys to their values

**Example:**

```typescript
const users = cache.mget<UserType>(['user:123', 'user:124', 'user:125']);
// { 'user:123': { name: 'John' }, 'user:124': { name: 'Jane' } }
```

### mdel(keys)

Deletes multiple keys from the cache at once.

```typescript
cache.mdel(keys: Array<string | number>): boolean
```

**Parameters:**

- `keys`: Array of keys to delete

**Returns:** Boolean indicating if all deletions were successful

**Example:**

```typescript
cache.mdel(['session:1', 'session:2', 'session:3']);
```

## Statistics

### getStats()

Returns statistics about the cache.

```typescript
cache.getStats(): {
  hits: number,
  misses: number,
  keys: number,
  ksize: number,
  vsize: number
}
```

**Returns:** Object with cache statistics

- `hits`: Number of successful retrievals
- `misses`: Number of failed retrievals
- `keys`: Number of keys in cache
- `ksize`: Approximate size of keys in bytes
- `vsize`: Approximate size of values in bytes

**Example:**

```typescript
const stats = cache.getStats();
console.log(`Hit ratio: ${stats.hits / (stats.hits + stats.misses)}`);
```

### resetStats()

Resets the cache statistics.

```typescript
cache.resetStats(): void
```

**Example:**

```typitten
cache.resetStats();
```

## Events

ts-cache provides an EventEmitter interface for reacting to cache operations.

### Event: 'set'

Fired when a key is set in the cache.

```typescript
cache.on('set', (key: string, value: any) => {
  console.log(`Key ${key} was set`);
});
```

### Event: 'del'

Fired when a key is manually deleted.

```typescript
cache.on('del', (key: string, value: any) => {
  console.log(`Key ${key} was deleted`);
});
```

### Event: 'expired'

Fired when a key expires and is removed from the cache.

```typescript
cache.on('expired', (key: string, value: any) => {
  console.log(`Key ${key} expired`);
});
```

### Event: 'flush'

Fired when the cache is reset.

```typescript
cache.on('flush', () => {
  console.log('Cache was flushed');
});
```

### Event: 'flush-stats'

Fired when the cache statistics are reset.

```typescript
cache.on('flush-stats', () => {
  console.log('Cache statistics were reset');
});
```

## Error Codes

ts-cache defines several error codes for common error conditions:

| Error Code | Description |
|------------|-------------|
| `ECACHEFULL` | Cache is full (hit maxKeys limit) |
| `EKEYTYPE` | Key is of invalid type |
| `EVALTYPE` | Value is of invalid type |
| `ENOTFOUND` | Key not found in cache |
| `EKEYSTYPE` | Keys argument is not an array |
| `ETTLTYPE` | TTL is not a number |

**Example:**

```typescript
try {
  // Code that might throw an error
  cache.set(null, 'value');
} catch (err) {
  if (err.errorcode === 'EKEYTYPE') {
    console.error('Invalid key type provided');
  }
}
```
