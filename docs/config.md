# TS-Cache Configuration Guide

TS-Cache is designed to be highly configurable to meet diverse caching needs. This document explains all available configuration options and how to use them effectively.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [TTL Configuration](#ttl-configuration)
- [Memory Management](#memory-management)
- [Performance Tuning](#performance-tuning)
- [Advanced Options](#advanced-options)
- [Configuration Examples](#configuration-examples)

## Basic Configuration

When creating a new cache instance, you can pass a configuration object to customize its behavior:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  ttl: 600, // Default TTL: 10 minutes
  checkPeriod: 60, // Check for expired items every minute
  maxKeys: 1000, // Store maximum 1000 items
  useClones: true, // Clone values on get/set operations
  deleteOnExpire: true // Remove items when they expire
})
```

## TTL Configuration

Time-to-Live (TTL) controls how long items remain in the cache before expiring.

### Default TTL

The `ttl` option sets the default TTL for all cache entries in seconds:

```typescript
const cache = new Cache({
  ttl: 3600 // Default: items expire after 1 hour
})
```

Setting `ttl` to `0` means items never expire by default:

```typescript
const cache = new Cache({
  ttl: 0 // Default: items never expire
})
```

### Cleanup Period

The `checkPeriod` option controls how often the cache checks for and removes expired items:

```typescript
const cache = new Cache({
  checkPeriod: 300 // Check for expired items every 5 minutes
})
```

Set to `0` to disable automatic cleanup (only manual or on-demand cleanup will occur):

```typescript
const cache = new Cache({
  checkPeriod: 0 // Disable automatic cleanup
})
```

### Delete on Expire

The `deleteOnExpire` option controls whether expired items are removed from memory:

```typescript
const cache = new Cache({
  deleteOnExpire: true // Remove expired items from memory (default)
})
```

Setting this to `false` can be useful if you want to keep expired items for debugging:

```typescript
const cache = new Cache({
  deleteOnExpire: false // Keep expired items in memory
})
```

### Stale Items

The `stale` option allows retrieval of expired items before they're cleaned up:

```typescript
const cache = new Cache({
  stale: true // Allow access to expired items until cleanup
})
```

## Memory Management

### Maximum Keys

The `maxKeys` option limits the number of items that can be stored in the cache:

```typescript
const cache = new Cache({
  maxKeys: 10000 // Store maximum 10,000 items
})
```

Set to `-1` for unlimited items (limited only by available memory):

```typescript
const cache = new Cache({
  maxKeys: -1 // No limit on number of items
})
```

### Size Calculation

TS-Cache estimates memory usage for different types of values. You can customize these estimates:

```typescript
const cache = new Cache({
  // Size multipliers for different value types
  objectValueSize: 80, // Bytes per object
  promiseValueSize: 40, // Bytes per promise
  arrayValueSize: 40 // Bytes per array
})
```

## Performance Tuning

### Cloning Control

The `useClones` option controls whether values are cloned when storing or retrieving:

```typescript
const cache = new Cache({
  useClones: false // Store and return references instead of clones
})
```

This has significant performance implications:

- `true` (default): Safe but slower - values are isolated when stored/retrieved
- `false`: Fast but requires care - changes to returned values will affect cached values

### String Conversion

The `forceString` option forces all values to be stored as strings:

```typescript
const cache = new Cache({
  forceString: true // Convert all values to strings
})
```

This can be useful for caches that need to persist data or transmit it.

## Advanced Options

### Legacy Callbacks

The `enableLegacyCallbacks` option enables callback-style API for compatibility:

```typescript
const cache = new Cache({
  enableLegacyCallbacks: true // Enable callback-style APIs
})
```

This is not recommended for new code but can help with migration from older versions.

### Custom Data Store

For advanced scenarios, you can provide a custom data store:

```typescript
const cache = new Cache({
  store: customStore // Use a custom storage implementation
})
```

The custom store must implement the required interface for keys, values, and TTL.

## Configuration Examples

### High-Performance Cache

Configuration optimized for maximum performance:

```typescript
const highPerformanceCache = new Cache({
  useClones: false, // Don't clone values
  checkPeriod: 0, // No automatic cleanup
  deleteOnExpire: false, // Don't automatically remove expired items
  forceString: false // Store native objects
})
```

### Memory-Optimized Cache

Configuration optimized for minimal memory usage:

```typescript
const memoryOptimizedCache = new Cache({
  maxKeys: 500, // Limit number of items
  ttl: 300, // Short TTL (5 minutes)
  checkPeriod: 60, // Frequent cleanup
  forceString: true, // Store as strings
  deleteOnExpire: true // Remove expired items immediately
})
```

### API Response Cache

Configuration suitable for caching API responses:

```typescript
const apiCache = new Cache({
  ttl: 600, // 10 minute default TTL
  checkPeriod: 120, // Check every 2 minutes
  useClones: true, // Clone to prevent response mutation
  maxKeys: 1000, // Reasonable limit
  stale: true // Allow stale responses during revalidation
})
```

### Session Cache

Configuration suitable for user session data:

```typescript
const sessionCache = new Cache({
  ttl: 1800, // 30 minute sessions
  maxKeys: 10000, // Support many users
  useClones: true, // Prevent session corruption
  checkPeriod: 300 // Clean expired sessions every 5 minutes
})
```

### Long-term Cache

Configuration for rarely-changing data:

```typescript
const longTermCache = new Cache({
  ttl: 86400, // 24 hour cache
  checkPeriod: 3600, // Check once per hour
  useClones: true, // Protect data integrity
  stale: true // Allow stale data during revalidation
})
```
