<p align="center"><img src="https://github.com/stacksjs/ts-cache/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of ts-cache"></p>

# Introduction

ts-cache is a powerful TypeScript in-memory caching library designed to improve application performance by storing frequently accessed data in memory. This modern TypeScript port of the popular [node-cache](https://github.com/node-cache/node-cache) library provides a clean, type-safe API with enhanced features optimized for modern JavaScript/TypeScript applications.

## Features

### 🚀 High Performance

- Optimized for speed with minimal overhead
- Smart memory management with adjustable limits
- Configurable time-to-live (TTL) for cached items
- Automatic cleanup of expired items

### 🛡️ Type Safety

- Full TypeScript support with comprehensive type definitions
- Generic methods for type-safe value retrieval
- IDE autocompletion for better developer experience
- Compile-time checking

### 🔄 Flexible API

- Simple get/set API for basic caching needs
- Fetch API for compute-if-absent pattern
- Multiple key operations (mget/mset/del)
- TTL management for fine-grained expiration control

### 📊 Monitoring & Events

- Built-in statistics for cache performance monitoring
- Event emitter for cache operations (set, del, expired, etc.)
- Memory usage estimation
- Comprehensive error handling

### 🔧 Configurable

- Customizable TTL for each cached item
- Memory limits with max keys setting
- Clone behavior configuration
- Automatic cleanup interval adjustment

### Key Considerations

- The library uses ES modules for tree shaking
- TypeScript declarations enable great IDE integration
- Event-based architecture for reactive applications
- Minimal dependencies (only requires `ts-clone` package)

## Performance Optimization

ts-cache is optimized for:

1. **Memory Efficiency**: Customizable size estimators for different data types
2. **Speed**: Minimal overhead for cache operations
3. **Configurability**: Adjust settings based on your specific use case
4. **Monitoring**: Track hits, misses, and other stats to optimize usage

## Use Cases

ts-cache is perfect for:

- API response caching
- Expensive computation results caching
- Database query result caching
- Session data storage
- Application configuration caching
- Rate limiting implementation
- Memoization of function results

## Real-World Example

Here's a quick example of using ts-cache to improve API response times:

```typescript
import { cache } from 'ts-cache'
import { fetchUserData } from './api'

// Function that uses cache for API responses
async function getUserData(userId: string) {
  // Check if data is already in cache
  const cachedData = cache.get<UserData>(userId)
  if (cachedData) {
    return cachedData
  }

  // If not in cache, fetch from API
  const userData = await fetchUserData(userId)

  // Store in cache for 5 minutes
  cache.set(userId, userData, 300)

  return userData
}

// Or using the built-in fetch method
async function getUserDataWithFetch(userId: string) {
  return cache.fetch(userId, 300, async () => {
    return await fetchUserData(userId)
  })
}
```

## Why ts-cache?

1. **Modern**: Built with TypeScript for modern applications
2. **Type-Safe**: Full type safety with generics for better developer experience
3. **Lightweight**: Minimal dependencies and small footprint
4. **Flexible**: Works in Node.js, Bun, and browser environments
5. **Performant**: Optimized for speed and memory efficiency
6. **Maintained**: Regular updates and improvements

Ready to get started? Check out our [Installation Guide](./install.md) or dive into the [Usage Documentation](./usage.md).

## Changelog

Please see our [releases](https://github.com/stacksjs/stacks/releases) page for more information on what has changed recently.

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Stargazers

[![Stargazers](https://starchart.cc/stacksjs/ts-cache.svg?variant=adaptive)](https://starchart.cc/stacksjs/ts-cache)

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Two things are true: Stacks OSS will always stay open-source, and we do love to receive postcards from wherever Stacks is used! 🌍 _We also publish them on our website. And thank you, Spatie_

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [node-cache](https://github.com/node-cache/node-cache)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](https://github.com/stacksjs/qrx/graphs/contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/ts-starter/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/qrx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/qrx -->
