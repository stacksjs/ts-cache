<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version](https://img.shields.io/npm/v/@stacksjs/ts-cache.svg)](https://www.npmjs.com/package/ts-cache)
[![License](https://img.shields.io/npm/l/@stacksjs/ts-cache.svg)](https://github.com/stacksjs/ts-cache/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@stacksjs/ts-cache)](https://bundlephobia.com/package/@stacksjs/ts-cache)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue)](https://www.typescriptlang.org/)

# ts-cache

A high-performance, type-safe in-memory caching library for TypeScript and JavaScript applications.

## Features

- 🚀 **High Performance** _Optimized for speed and minimal memory footprint_
- ⏱️ **TTL Support** _Flexible time-to-live settings for cache entries_
- 🔄 **Batch Operations** _Efficient multi-get, multi-set, and batch delete_
- 📊 **Built-in Monitoring** _Statistics tracking and event system_
- 🛡️ **Type Safety** _Full TypeScript support with generics for type-safe caching_
- 🔧 **Configurable** _Extensive options for fine-tuning behavior_

## Installation

```bash
# Using npm
npm install ts-cache

# Using yarn
yarn add ts-cache

# Using pnpm
pnpm add ts-cache

# Using bun
bun add ts-cache
```

## Quick Start

```typescript
import cache from 'ts-cache'

// Store a value (with 5 minute TTL)
cache.set('user:123', { name: 'John', role: 'admin' }, 300)

// Retrieve a value with type safety
const user = cache.get<{ name: string, role: string }>('user:123')
if (user) {
  console.log(user.name) // TypeScript knows this is a string
}

// Check if a key exists
if (cache.has('user:123')) {
  // Key exists and is not expired
}

// Delete a key
cache.del('user:123')

// Get and remove in one operation
const token = cache.take('one-time-token')

// Fetch (get if exists, set if doesn't)
const apiData = cache.fetch('api:users', 300, async () => {
  // Only called if 'api:users' doesn't exist
  return await fetchFromApi('/users')
})
```

## Custom Cache Instance

```typescript
import { Cache } from 'ts-cache'

// Create a custom cache with specific settings
const myCache = new Cache({
  stdTTL: 3600, // Default TTL: 1 hour
  checkPeriod: 600, // Check for expired items every 10 minutes
  maxKeys: 1000, // Maximum 1000 items
  useClones: true, // Clone values on get/set operations
  deleteOnExpire: true // Remove items when they expire
})

// Use the custom cache instance
myCache.set('key', 'value')
```

## Batch Operations

```typescript
// Set multiple values at once
cache.mset([
  { key: 'key1', val: 'value1' },
  { key: 'key2', val: 'value2' },
  { key: 'key3', val: 'value3', ttl: 300 }
])

// Get multiple values at once
const values = cache.mget(['key1', 'key2', 'key3'])

// Delete multiple keys
cache.del(['key1', 'key2'])
```

## Events

```typescript
// Listen for expired items
cache.on('expired', (key, value) => {
  console.log(`Item expired: ${key}`)
  // Take action, like recomputing the value
})

// Other events: 'set', 'del', 'flush', 'flush-stats'
cache.on('set', (key, value) => {
  console.log(`Cache set: ${key}`)
})
```

## Statistics

```typescript
// Get cache statistics
const stats = cache.getStats()
console.log(stats)
// {
//   hits: 127,
//   misses: 9,
//   keys: 42,
//   ksize: 840,
//   vsize: 2390
// }

// Reset statistics counters
cache.flushStats()
```

## Use Cases

- **API Response Caching**: Reduce API calls by caching responses
- **Computed Values**: Store results of expensive calculations
- **Session Data**: Temporary user session storage
- **Rate Limiting**: Implement counters with automatic expiration
- **Function Memoization**: Cache function results for repeated calls

## Documentation

For detailed documentation, see:

- [Introduction](https://github.com/stacksjs/ts-cache/blob/main/docs/intro.md)
- [Installation Guide](https://github.com/stacksjs/ts-cache/blob/main/docs/install.md)
- [Usage Guide](https://github.com/stacksjs/ts-cache/blob/main/docs/usage.md)
- [API Reference](https://github.com/stacksjs/ts-cache/blob/main/docs/api.md)
- [Configuration Options](https://github.com/stacksjs/ts-cache/blob/main/docs/config.md)
- [Features](https://github.com/stacksjs/ts-cache/blob/main/docs/features.md)

## Contributing

Please see the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [`node-cache`](https://github.com/node-cache/node-cache) _for the original Node.js implementation_
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/ts-cache/contributors)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙
