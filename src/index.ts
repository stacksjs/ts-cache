// Export legacy cache implementation for backwards compatibility
export { Cache, cache as legacyCache } from './cache'
// Export compression
export * from './compression'

// Export config
export * from './config'

// Export drivers
export { MemoryDriver } from './drivers/memory'
export { MemoryLRUDriver } from './drivers/memory-lru'
export { RedisDriver } from './drivers/redis'

// Export driver types except Compressor (already exported from compression)
export type {
  CacheDriver,
  DriverOptions,
  DriverType,
  MemoryDriverOptions,
  RedisDriverOptions,
  Serializer,
} from './drivers/types'

// Export new cache manager
export { cache, CacheManager, createCache } from './manager'

export { cache as default } from './manager'

// Export middleware
export * from './middleware'

// Export patterns
export * from './patterns'

// Export serializers
export * from './serializers'
// Export types
export * from './types'

// Export utilities
export * from './utils'
