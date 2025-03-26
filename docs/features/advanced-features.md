# Advanced Features

ts-cache goes beyond basic caching functionality to provide advanced features that make your code more efficient and elegant.

## Batch Operations

Efficient handling of multiple items at once:

- Multi-get (`mget`) for retrieving multiple values in one operation
- Multi-set (`mset`) for storing multiple values in one operation
- Batch delete for removing multiple keys at once

```typescript
// Multi-get example
const values = cache.mget(['key1', 'key2', 'key3'])

// Multi-set example
cache.mset([
  { key: 'key1', val: 'value1' },
  { key: 'key2', val: 'value2', ttl: 300 }
])

// Batch delete
cache.del(['key1', 'key2', 'key3'])
```

## Compute-If-Absent Pattern

The `fetch` method provides an elegant way to implement the compute-if-absent pattern:

- Get a value if it exists in the cache
- Compute and store the value if it doesn't exist
- Support for both value and function-based computation
- Optional TTL for newly computed values

```typescript
// Using fetch with a direct value
const value = cache.fetch('key', 'default-value')

// Using fetch with a computation function
const result = cache.fetch('compute-key', () => {
  return expensiveComputation()
})

// With TTL
const data = cache.fetch('api-data', 300, async () => {
  return await fetchFromApi()
})
```

## Take Operation

The `take` method provides an atomic get-and-remove operation:

- Retrieve a value and remove it from the cache in one operation
- Perfect for one-time-use tokens, codes, or temporary data

```typescript
// Get and remove in one operation
const token = cache.take('one-time-token')
```
