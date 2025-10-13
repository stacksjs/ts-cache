import type { CacheDriver, DriverOptions, MemoryDriverOptions, RedisDriverOptions } from './drivers/types'
import type { Key, Stats } from './types'
import { EventEmitter } from 'node:events'
import { MemoryDriver } from './drivers/memory'
import { RedisDriver } from './drivers/redis'

/**
 * Cache Manager Options
 */
export interface CacheManagerOptions extends DriverOptions, Partial<Omit<MemoryDriverOptions, keyof DriverOptions>>, Partial<Omit<RedisDriverOptions, keyof DriverOptions>> {
  /**
   * Cache driver to use ('memory' or 'redis')
   */
  driver?: 'memory' | 'redis'

  /**
   * Custom driver instance
   */
  customDriver?: CacheDriver
}

/**
 * Cache Manager with driver abstraction
 */
export class CacheManager extends EventEmitter {
  private driver: CacheDriver

  constructor(options: CacheManagerOptions = {}) {
    super()

    if (options.customDriver) {
      this.driver = options.customDriver
    }
    else {
      const driverType = options.driver ?? 'memory'

      if (driverType === 'redis') {
        this.driver = new RedisDriver(options)
      }
      else {
        this.driver = new MemoryDriver(options)
      }
    }
  }

  /**
   * Get a cached value
   */
  async get<T>(key: Key): Promise<T | undefined> {
    const value = await this.driver.get<T>(key)

    if (value !== undefined) {
      this.emit('hit', key, value)
    }
    else {
      this.emit('miss', key)
    }

    return value
  }

  /**
   * Get multiple cached values
   */
  async mget<T>(keys: Key[]): Promise<Record<string, T>> {
    const result = await this.driver.mget<T>(keys)
    this.emit('mget', keys, result)
    return result
  }

  /**
   * Set a cached value
   */
  async set<T>(key: Key, value: T, ttl?: number): Promise<boolean> {
    const result = await this.driver.set(key, value, ttl)

    if (result) {
      this.emit('set', key, value, ttl)
    }

    return result
  }

  /**
   * Set multiple cached values
   */
  async mset<T>(entries: Array<{ key: Key, value: T, ttl?: number }>): Promise<boolean> {
    const result = await this.driver.mset(entries)

    if (result) {
      this.emit('mset', entries)
    }

    return result
  }

  /**
   * Delete one or more keys
   */
  async del(keys: Key | Key[]): Promise<number> {
    const count = await this.driver.del(keys)

    if (count > 0) {
      this.emit('del', keys, count)
    }

    return count
  }

  /**
   * Check if a key exists
   */
  async has(key: Key): Promise<boolean> {
    return await this.driver.has(key)
  }

  /**
   * Get all keys
   */
  async keys(pattern?: string): Promise<string[]> {
    return await this.driver.keys(pattern)
  }

  /**
   * Get the TTL of a key
   */
  async getTtl(key: Key): Promise<number | undefined> {
    return await this.driver.getTtl(key)
  }

  /**
   * Set/update the TTL of a key
   */
  async ttl(key: Key, ttl: number): Promise<boolean> {
    const result = await this.driver.ttl(key, ttl)

    if (result) {
      this.emit('ttl', key, ttl)
    }

    return result
  }

  /**
   * Get a value and delete it atomically
   */
  async take<T>(key: Key): Promise<T | undefined> {
    const value = await this.driver.get<T>(key)

    if (value !== undefined) {
      await this.driver.del(key)
      this.emit('take', key, value)
    }

    return value
  }

  /**
   * Fetch a value or compute it if not cached
   */
  async fetch<T>(
    key: Key,
    fetcher: () => T | Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== undefined) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, ttl)

    this.emit('fetch', key, value, ttl)

    return value
  }

  /**
   * Remember a value (alias for fetch)
   */
  async remember<T>(
    key: Key,
    ttl: number | undefined,
    fetcher: () => T | Promise<T>,
  ): Promise<T> {
    return await this.fetch(key, fetcher, ttl)
  }

  /**
   * Remember a value forever (no TTL)
   */
  async rememberForever<T>(
    key: Key,
    fetcher: () => T | Promise<T>,
  ): Promise<T> {
    return await this.fetch(key, fetcher, 0)
  }

  /**
   * Clear all cached data
   */
  async flush(): Promise<void> {
    await this.driver.flush()
    this.emit('flush')
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Stats> {
    return await this.driver.getStats()
  }

  /**
   * Close the cache driver
   */
  async close(): Promise<void> {
    await this.driver.close()
    this.emit('close')
  }

  /**
   * Tag operations (if supported by driver)
   */
  async tag(key: Key, tags: string[]): Promise<boolean> {
    if (this.driver.tag) {
      const result = await this.driver.tag(key, tags)

      if (result) {
        this.emit('tag', key, tags)
      }

      return result
    }

    return false
  }

  /**
   * Get keys by tag (if supported by driver)
   */
  async getKeysByTag(tag: string): Promise<string[]> {
    if (this.driver.getKeysByTag) {
      return await this.driver.getKeysByTag(tag)
    }

    return []
  }

  /**
   * Delete keys by tag (if supported by driver)
   */
  async deleteByTag(tag: string): Promise<number> {
    if (this.driver.deleteByTag) {
      const count = await this.driver.deleteByTag(tag)

      if (count > 0) {
        this.emit('deleteByTag', tag, count)
      }

      return count
    }

    return 0
  }

  /**
   * Create a namespaced cache instance
   */
  namespace(prefix: string): CacheManager {
    const driver = this.driver

    // Create a wrapper driver with the namespace
    const namespacedDriver: CacheDriver = {
      get: async <T>(key: Key) => driver.get<T>(`${prefix}:${key}`),
      mget: async <T>(keys: Key[]) => {
        const result = await driver.mget<T>(keys.map(k => `${prefix}:${k}`))
        // Strip prefix from result keys
        const stripped: Record<string, T> = {}
        for (const [k, v] of Object.entries(result)) {
          const originalKey = k.replace(`${prefix}:`, '')
          stripped[originalKey] = v
        }
        return stripped
      },
      set: async <T>(key: Key, value: T, ttl?: number) =>
        driver.set(`${prefix}:${key}`, value, ttl),
      mset: async <T>(entries: Array<{ key: Key, value: T, ttl?: number }>) =>
        driver.mset(entries.map(e => ({ ...e, key: `${prefix}:${e.key}` }))),
      del: async (keys: Key | Key[]) => {
        const keysArray = Array.isArray(keys) ? keys : [keys]
        return driver.del(keysArray.map(k => `${prefix}:${k}`))
      },
      has: async (key: Key) => driver.has(`${prefix}:${key}`),
      keys: async (pattern?: string) => {
        const allKeys = await driver.keys(pattern ? `${prefix}:${pattern}` : `${prefix}:*`)
        return allKeys.map(k => k.replace(`${prefix}:`, ''))
      },
      getTtl: async (key: Key) => driver.getTtl(`${prefix}:${key}`),
      ttl: async (key: Key, ttl: number) => driver.ttl(`${prefix}:${key}`, ttl),
      flush: async () => {
        const keys = await driver.keys(`${prefix}:*`)
        if (keys.length > 0) {
          await driver.del(keys)
        }
      },
      getStats: async () => driver.getStats(),
      close: async () => driver.close(),
      getKeysByTag: driver.getKeysByTag
        ? async (tag: string) => {
          const keys = await driver.getKeysByTag!(tag)
          return keys.map(k => k.replace(`${prefix}:`, ''))
        }
        : undefined,
      tag: driver.tag
        ? async (key: Key, tags: string[]) =>
          driver.tag!(`${prefix}:${key}`, tags)
        : undefined,
      deleteByTag: driver.deleteByTag,
    }

    return new CacheManager({ customDriver: namespacedDriver })
  }

  /**
   * Get the underlying driver instance
   */
  getDriver(): CacheDriver {
    return this.driver
  }
}

/**
 * Create a cache manager instance
 */
export function createCache(options: CacheManagerOptions = {}): CacheManager {
  return new CacheManager(options)
}

/**
 * Default cache instance (memory-based)
 */
export const cache: CacheManager = createCache()
