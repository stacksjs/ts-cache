# Configuration

ts-cache provides several configuration options to customize the behavior of the cache according to your needs. This guide explains all available options in detail.

## Basic Configuration

The `Cache` constructor accepts a configuration object that allows you to customize its behavior:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  // Your configuration options here
})
```

## Configuration Options

### Core Settings

```typescript
interface Options {
  // Convert all elements to string
  forceString?: boolean

  // Used for calculating value size
  objectValueSize?: number
  promiseValueSize?: number
  arrayValueSize?: number

  // Standard time to live in seconds. 0 = infinity
  stdTTL?: number

  // Time in seconds to check all data and delete expired keys
  checkperiod?: number

  // Whether to clone values when setting/getting
  useClones?: boolean

  // Whether values should be deleted automatically at expiration
  deleteOnExpire?: boolean

  // Enable legacy callbacks (deprecated)
  enableLegacyCallbacks?: boolean

  // Max amount of keys that are being stored. -1 = unlimited
  maxKeys?: number
}
```

## Default Values

ts-cache comes with sensible defaults for all options:

```typescript
{
  forceString: false,
  objectValueSize: 80,
  promiseValueSize: 80,
  arrayValueSize: 40,
  stdTTL: 0,
  checkperiod: 600,
  useClones: true,
  deleteOnExpire: true,
  enableLegacyCallbacks: false,
  maxKeys: -1
}
```

## Options in Detail

### Time-To-Live Settings

#### `stdTTL`

Standard Time-To-Live in seconds. Items that are set without an explicit TTL value will use this value.

- Type: `number`
- Default: `0` (infinity)
- Example:

```typescript
const cache = new Cache({
  stdTTL: 3600 // Items expire after 1 hour by default
})
```

#### `checkperiod`

The interval in seconds to check for expired items. A cleanup process runs at this interval to remove expired items.

- Type: `number`
- Default: `600` (10 minutes)
- Example:

```typescript
const cache = new Cache({
  checkperiod: 300 // Check for expired items every 5 minutes
})
```

### Memory Management

#### `maxKeys`

The maximum number of keys that can be stored in the cache. If this limit is reached, a `ECACHEFULL` error will be thrown when attempting to add new keys.

- Type: `number`
- Default: `-1` (unlimited)
- Example:

```typescript
const cache = new Cache({
  maxKeys: 1000 // Limit the cache to 1000 keys
})
```

#### Value Size Estimators

The cache keeps track of approximate memory usage through several size estimators:

- `objectValueSize`: Estimated size for each property in an object (default: `80`)
- `arrayValueSize`: Estimated size for each element in an array (default: `40`)
- `promiseValueSize`: Estimated size for a Promise (default: `80`)

Example:

```typescript
const cache = new Cache({
  objectValueSize: 100, // Custom object size estimator
  arrayValueSize: 50 // Custom array size estimator
})
```

### Data Handling Options

#### `forceString`

When enabled, all values are converted to strings using `JSON.stringify()` before storing.

- Type: `boolean`
- Default: `false`
- Example:

```typescript
const cache = new Cache({
  forceString: true // Convert all values to strings
})
```

#### `useClones`

When enabled, the cache returns clones of the stored values rather than references. This prevents unintended modifications to cached data but can impact performance.

- Type: `boolean`
- Default: `true`
- Example:

```typescript
const cache = new Cache({
  useClones: false // Return references to stored values for better performance
})
```

#### `deleteOnExpire`

Controls whether expired items are automatically removed from the cache when they are accessed or during the periodic cleanup.

- Type: `boolean`
- Default: `true`
- Example:

```typescript
const cache = new Cache({
  deleteOnExpire: false // Keep expired items in the cache
})
```

### Legacy Options

#### `enableLegacyCallbacks`

Enables support for old-style callback functions. This is deprecated and will be removed in future versions.

- Type: `boolean`
- Default: `false`
- Example:

```typescript
const cache = new Cache({
  enableLegacyCallbacks: true // Enable legacy callbacks (not recommended)
})
```

## Configuration Examples

### High-Performance Cache

```typescript
const cache = new Cache({
  useClones: false, // Don't clone values
  checkperiod: 0, // Disable periodic cleanup
  deleteOnExpire: false // Don't auto-delete expired items
})
```

### In-Memory Database

```typescript
const cache = new Cache({
  stdTTL: 0, // No expiration
  maxKeys: 10000, // Limit key count
  useClones: true, // Safe cloning
  forceString: false // Keep original data types
})
```

### Short-lived Cache

```typescript
const cache = new Cache({
  stdTTL: 60, // 1 minute default TTL
  checkperiod: 30, // Check every 30 seconds
  deleteOnExpire: true, // Auto-delete expired items
  maxKeys: 100 // Small cache size
})
```

### Memory-conscious Cache

```typescript
const cache = new Cache({
  maxKeys: 5000, // Limit key count
  objectValueSize: 40, // Smaller object size estimation
  arrayValueSize: 20, // Smaller array size estimation
  useClones: false // Performance optimization
})
```

For more information about using these configurations, check out the [Usage Guide](./usage.md) or the [API Documentation](./api.md).
