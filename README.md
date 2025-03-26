<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# ts-cache

Simple and fast TypeScript in-memory caching. A modern TypeScript port of the popular [node-cache](https://github.com/node-cache/node-cache) library.

## Features

- Simple cache API
- Time to live (TTL) support
- Key expiration events
- Memory usage estimation
- Automatic cache cleaning
- Type safety with TypeScript
- ESM support

## Installation

```bash
# npm
npm install ts-cache

# yarn
yarn add ts-cache

# pnpm
pnpm add ts-cache

# bun
bun add ts-cache
```

## Usage

### Basic Example

```typescript
import { cache } from 'ts-cache'

// Set a value in the cache (simple string)
cache.set('myKey', 'Hello World')

// Set a value with a TTL of 10 seconds
cache.set('myTtlKey', { hello: 'world' }, 10)

// Get values
const value = cache.get('myKey') // returns 'Hello World'
const ttlValue = cache.get('myTtlKey') // returns { hello: 'world' }

// After 10 seconds, ttlValue will expire
setTimeout(() => {
  const expiredValue = cache.get('myTtlKey') // returns undefined
  console.log(expiredValue) // undefined
}, 11000)
```

### Type Safety

```typescript
import { cache } from 'ts-cache'

interface User {
  id: number
  name: string
  email: string
}

// Set a typed value
cache.set<User>('user1', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
})

// Get with the correct type
const user = cache.get<User>('user1')

// TypeScript knows the type
console.log(user?.name) // 'John Doe'
```

### Custom Cache Instance

```typescript
import { Cache } from 'ts-cache'

// Create a custom cache instance with specific options
const myCache = new Cache({
  stdTTL: 100, // Standard TTL in seconds
  checkperiod: 120, // Cleanup interval in seconds
  maxKeys: 1000, // Maximum number of keys
  useClones: false, // Don't clone values (for performance)
})

// Use the custom instance
myCache.set('key', 'value')
```

### Handling Multiple Items

```typescript
import { cache } from 'ts-cache'

// Get multiple items at once
cache.set('key1', 'value1')
cache.set('key2', 'value2')
cache.set('key3', 'value3')

const multiValues = cache.mget(['key1', 'key2', 'key3'])
console.log(multiValues) // { key1: 'value1', key2: 'value2', key3: 'value3' }

// Set multiple items at once
cache.mset([
  { key: 'key4', val: 'value4' },
  { key: 'key5', val: 'value5', ttl: 100 },
])
```

### Delete and Check Keys

```typescript
import { cache } from 'ts-cache'

// Check if a key exists
const hasKey = cache.has('myKey') // true or false

// Delete a key
cache.del('myKey')

// Delete multiple keys
cache.del(['key1', 'key2'])

// One-time use - get a key and remove it
const value = cache.take('myKey')
```

### Resetting TTL

```typescript
import { cache } from 'ts-cache'

// Get the remaining TTL of a key
const ttl = cache.getTtl('myKey') // timestamp or undefined

// Reset or change the TTL
cache.ttl('myKey', 300) // Set TTL to 300 seconds
```

### Statistics and Maintenance

```typescript
import { cache } from 'ts-cache'

// Get cache statistics
const stats = cache.getStats()
/*
{
  hits: 0,
  misses: 0,
  keys: 0,
  ksize: 0,
  vsize: 0
}
*/

// Flush the cache
cache.flushAll()

// Reset stats
cache.flushStats()

// Properly close the cache (stops the cleaning interval)
cache.close()
```

### Events

```typescript
import { cache } from 'ts-cache'

// Listen for expired items
cache.on('expired', (key, value) => {
  console.log(`Key ${key} expired with value:`, value)
})

// Listen for deleted items
cache.on('del', (key, value) => {
  console.log(`Key ${key} was deleted with value:`, value)
})

// Listen for set operations
cache.on('set', (key, value) => {
  console.log(`Key ${key} was set with value:`, value)
})

// Listen for flush
cache.on('flush', () => {
  console.log('Cache was flushed')
})

// Listen for stats flush
cache.on('flush_stats', () => {
  console.log('Cache stats were reset')
})
```

## API Reference

### Cache Options

| Option | Default | Description |
|--------|---------|-------------|
| `stdTTL` | 0 | Standard TTL in seconds. 0 = unlimited |
| `checkperiod` | 600 | Interval to check for expired keys in seconds |
| `useClones` | true | Whether to clone values on get/set operations |
| `deleteOnExpire` | true | Delete expired items automatically |
| `maxKeys` | -1 | Maximum number of keys (-1 = unlimited) |
| `forceString` | false | Force values to be stored as strings |
| `objectValueSize` | 80 | Estimator for object values |
| `arrayValueSize` | 40 | Estimator for array values |
| `promiseValueSize` | 80 | Estimator for promise values |

### Methods

| Method | Description |
|--------|-------------|
| `get<T>(key)` | Get a cached key |
| `mget<T>(keys)` | Get multiple cached keys |
| `set<T>(key, value, [ttl])` | Set a cached key |
| `mset<T>(items)` | Set multiple keys at once |
| `fetch<T>(key, ttl?, valueOrFn)` | Get from cache or compute if missing |
| `del(keys)` | Delete one or more keys |
| `take<T>(key)` | Get and delete a key |
| `ttl(key, ttl)` | Reset or redefine TTL |
| `getTtl(key)` | Get remaining TTL |
| `keys()` | Get all keys |
| `has(key)` | Check if a key exists |
| `getStats()` | Get cache statistics |
| `flushAll()` | Clear all data |
| `flushStats()` | Reset statistics |
| `close()` | Stop the check timer |

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/ts-cache/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/ts-cache/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Stacks OSS will always stay open-sourced, and we will always love to receive postcards from wherever Stacks is used! _And we also publish them on our website. Thank you, Spatie._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/ts-cache/contributors)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/ts-cache?style=flat-square
[npm-version-href]: https://npmjs.com/package/ts-cache
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/ts-cache/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/ts-cache/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/ts-cache/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/ts-cache -->
