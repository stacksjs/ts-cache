# Usage Guide

ts-cache provides a simple yet powerful API for in-memory caching. This guide will walk you through common use cases and best practices.

## Quick Start

```typescript
import { cache } from 'ts-cache'

// Store a value in the cache
cache.set('greeting', 'Hello, World!')

// Retrieve the value
const greeting = cache.get('greeting')
console.log(greeting) // "Hello, World!"

// Store with an expiration time (TTL) of 60 seconds
cache.set('temporaryValue', { data: 'This will expire' }, 60)

// Check if a key exists
if (cache.has('greeting')) {
  console.log('Greeting exists in cache')
}
```

## Basic Operations

### Setting Values

```typescript
// Basic set operation
cache.set('key', 'value')

// Set with a TTL of 5 minutes (300 seconds)
cache.set('key', 'value', 300)

// Set an object
cache.set('user', { id: 1, name: 'John' })
```

### Getting Values

```typescript
// Basic get operation
const value = cache.get('key')

// Type-safe get
interface User {
  id: number
  name: string
}

const user = cache.get<User>('user')
console.log(user?.name) // TypeScript knows this is a string
```

### Deleting Values

```typescript
// Delete a single key
cache.del('key')

// Delete multiple keys
cache.del(['key1', 'key2', 'key3'])

// Get the number of deleted keys
const deletedCount = cache.del(['key1', 'key2'])
console.log(`Deleted ${deletedCount} keys`)
```

### Checking Existence

```typescript
// Check if a key exists and is not expired
if (cache.has('key')) {
  // Key exists
}
```

## Working with TTL (Time To Live)

### Setting Expiration Time

```typescript
// Set a key with a TTL of 10 minutes
cache.set('tempKey', 'tempValue', 600)

// Set a key that never expires (TTL = 0)
cache.set('permanentKey', 'permanentValue', 0)
```

### Modifying TTL

```typescript
// Change the TTL of an existing key
cache.ttl('key', 300) // Set to 5 minutes

// Reset to default TTL
cache.ttl('key')

// Remove the key by setting negative TTL
cache.ttl('key', -1)
```

### Getting TTL

```typescript
// Get the remaining TTL for a key
const ttl = cache.getTtl('key')

if (ttl === undefined) {
  console.log('Key does not exist')
}
else if (ttl === 0) {
  console.log('Key has no expiration')
}
else {
  console.log(`Key expires at timestamp: ${ttl}`)
  const secondsLeft = Math.round((ttl - Date.now()) / 1000)
  console.log(`Seconds left: ${secondsLeft}`)
}
```

## Advanced Features

### Batch Operations

#### Multiple Get

```typescript
// Get multiple values at once
const values = cache.mget(['key1', 'key2', 'key3'])
console.log(values) // { key1: 'value1', key2: 'value2', key3: 'value3' }

// Type-safe multiple get
interface User {
  id: number
  name: string
}

const users = cache.mget<User>(['user1', 'user2'])
```

#### Multiple Set

```typescript
// Set multiple values at once
cache.mset([
  { key: 'key1', val: 'value1' },
  { key: 'key2', val: 'value2' },
  { key: 'key3', val: 'value3', ttl: 300 } // With TTL
])
```

### Fetch API

Fetch provides a "get or compute" pattern. It retrieves a value from the cache if it exists, or computes and stores it if not.

```typescript
// Basic fetch with a value
const value = cache.fetch('key', 'default-value')

// Fetch with a computation function
const result = cache.fetch('compute-key', () => {
  return expensiveOperation()
})

// Fetch with TTL and a computation function
const resultWithTTL = cache.fetch('compute-key', 300, () => {
  return expensiveOperation()
})
```

### Take API

Take retrieves a value and removes it from the cache in one operation.

```typescript
// Get and remove a value (useful for one-time use tokens)
const token = cache.take('one-time-token')
if (token) {
  // Use the token, it's already been removed from cache
}
```

### Cache Statistics

```typescript
// Get statistics
const stats = cache.getStats()
console.log(stats)
// {
//   hits: 10,      // Cache hits
//   misses: 2,     // Cache misses
//   keys: 5,       // Number of keys
//   ksize: 50,     // Approximate key size in bytes
//   vsize: 400     // Approximate value size in bytes
// }

// Reset statistics
cache.flushStats()
```

### Flushing the Cache

```typescript
// Remove all keys and reset stats
cache.flushAll()
```

### Closing the Cache

```typescript
// Stop the automatic cleanup of expired keys
cache.close()
```

## Event Handling

ts-cache emits events that you can listen to:

```typescript
// Listen for key expiration
cache.on('expired', (key, value) => {
  console.log(`Key ${key} expired with value:`, value)
  // You might want to take some action when keys expire
})

// Listen for key deletion
cache.on('del', (key, value) => {
  console.log(`Key ${key} was deleted with value:`, value)
})

// Listen for key setting
cache.on('set', (key, value) => {
  console.log(`Key ${key} was set with value:`, value)
})

// Listen for cache flush
cache.on('flush', () => {
  console.log('Cache was flushed')
})

// Listen for stats flush
cache.on('flush_stats', () => {
  console.log('Cache stats were reset')
})
```

## Custom Cache Instance

You can create your own cache instance with custom configuration:

```typescript
import { Cache } from 'ts-cache'

const customCache = new Cache({
  stdTTL: 60, // Default TTL is 60 seconds
  checkPeriod: 120, // Check for expired keys every 2 minutes
  maxKeys: 1000, // Store maximum 1000 keys
  useClones: false, // Don't clone values (for performance)
  deleteOnExpire: true, // Automatically delete expired keys
  forceString: false, // Don't force string conversion
})

// Use the custom cache
customCache.set('key', 'value')
```

## Type Safety Examples

ts-cache provides full TypeScript support for type-safe operations:

```typescript
// Define an interface
interface Product {
  id: number
  name: string
  price: number
  inStock: boolean
}

// Type-safe set
cache.set<Product>('product:123', {
  id: 123,
  name: 'Laptop',
  price: 999.99,
  inStock: true
})

// Type-safe get
const product = cache.get<Product>('product:123')
if (product) {
  console.log(`${product.name} costs $${product.price}`)

  if (product.inStock) {
    // TypeScript knows this is a boolean
    console.log('Product is in stock')
  }
}

// Type-safe batch operations
const products = cache.mget<Product>(['product:123', 'product:456'])
Object.entries(products).forEach(([key, product]) => {
  console.log(`${key}: ${product.name}`)
})
```

## Best Practices

### Memory Management

1. **Set appropriate TTLs**: Use shorter TTLs for frequently changing data and longer or infinite TTLs for static data.

```typescript
// Short TTL for user sessions (30 minutes)
cache.set(`session:${userId}`, sessionData, 1800)

// Long TTL for fairly static data (1 day)
cache.set('app:settings', appSettings, 86400)

// Infinite TTL for constant data
cache.set('countries', countriesList, 0)
```

2. **Limit cache size**: Set a reasonable `maxKeys` value based on your application needs and available memory.

```typescript
const cache = new Cache({
  maxKeys: 10000 // Limit to 10,000 keys
})
```

3. **Use reference mode for large objects**: Disable cloning for large objects when possible.

```typescript
const cache = new Cache({
  useClones: false // Don't clone values
})
```

### Performance Tuning

1. **Adjust cleanup interval**: Increase the `checkPeriod` for lower CPU usage or decrease it for more accurate expiration.

```typescript
const cache = new Cache({
  checkPeriod: 1800 // Check every 30 minutes
})
```

2. **Batch operations**: Use `mget` and `mset` for better performance when working with multiple keys.

```typescript
// Better than calling get() multiple times
const values = cache.mget(['key1', 'key2', 'key3'])
```

3. **Use the fetch API**: For computation-heavy functions, leverage the built-in fetch method.

```typescript
const result = cache.fetch('expensive-query', 300, () => {
  return performExpensiveQueryOperation()
})
```

For more detailed information about available methods and options, check out the [API Documentation](./api.md).
