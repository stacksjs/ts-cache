# Core Caching Features

ts-cache provides a solid foundation of essential caching capabilities that make it flexible and powerful for a wide range of applications.

## Key-Value Storage

The foundation of ts-cache is a simple but powerful key-value storage system:

- Support for string and number keys
- Storage of any JavaScript value (primitives, objects, arrays, functions, etc.)
- Automatic key conversion to strings for internal storage
- Optional string conversion for values via `forceString` setting

## Time-To-Live (TTL) Management

Every cached item can have its own expiration time:

- Set TTL when adding items to the cache
- Default TTL configurable at the cache level
- Modify TTL of existing cache entries
- Infinite TTL support (never expire)
- Get remaining TTL for any cached item

```typescript
// Different TTL examples
cache.set('key1', 'value1', 60) // Expires in 60 seconds
cache.set('key2', 'value2', 0) // Never expires
cache.set('key3', 'value3') // Uses default TTL

// Change TTL of existing item
cache.ttl('key1', 300) // Reset to 5 minutes
```

## Automatic Cleanup

ts-cache includes built-in mechanisms for managing expired items:

- Configurable periodic cleanup of expired items
- On-demand expiration check when retrieving items
- Event emission when items expire
- Customizable cleanup interval

```typescript
// Configure cleanup interval
const cache = new Cache({
  checkPeriod: 300 // Check for expired items every 5 minutes
})
```
