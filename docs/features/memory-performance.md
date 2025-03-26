# Memory & Performance Features

ts-cache includes several features to help optimize memory usage and performance for your specific use case.

## Memory Usage Management

ts-cache includes several features to help manage memory usage:

- Maximum key limit option (`maxKeys`)
- Memory usage estimation statistics
- Size estimator configuration for different value types

```typescript
// Limit the maximum number of keys
const cache = new Cache({
  maxKeys: 10000 // Maximum 10,000 keys
})
```

## Clone Control

Control how values are handled when stored and retrieved:

- Optional cloning of values (enabled by default)
- Reference mode for better performance with large objects
- Independent control of cloning behavior for get/set operations

```typescript
// Disable cloning for better performance
const cache = new Cache({
  useClones: false // Store and return references
})
```

## Statistics

Built-in statistics collection for monitoring cache performance:

- Hit and miss counters
- Key count tracking
- Approximate memory usage estimation
- Statistics reset capability

```typescript
// Get cache statistics
const stats = cache.getStats()
console.log(stats)
// {
//   hits: 24,
//   misses: 3,
//   keys: 5,
//   ksize: 50,
//   vsize: 400
// }
```
