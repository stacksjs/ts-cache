import type { Buffer } from 'node:buffer'
import type { Key, Stats } from '../types'
import type { CacheDriver, RedisDriverOptions } from './types'
// Use Bun's native Redis client (available in Bun v1.2.9+)
// @ts-expect-error - Bun's redis is not yet in the types
import { RedisClient } from 'bun'

import process from 'node:process'

/**
 * Redis cache driver implementation using Bun's native Redis client
 */
export class RedisDriver implements CacheDriver {
  private client: typeof RedisClient.prototype
  private options: Required<Omit<RedisDriverOptions, 'compressor' | 'password'>> & {
    compressor?: RedisDriverOptions['compressor']
    password?: string
  }

  private stats: Stats = {
    hits: 0,
    misses: 0,
    keys: 0,
    ksize: 0,
    vsize: 0,
  }

  constructor(options: RedisDriverOptions = {}) {
    this.options = {
      stdTTL: options.stdTTL ?? 0,
      prefix: options.prefix ?? '',
      serializer: options.serializer ?? {
        serialize: (v: any) => JSON.stringify(v),
        deserialize: (v: string | Buffer) => JSON.parse(typeof v === 'string' ? v : v.toString()),
      },
      url: options.url ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
      host: options.host ?? 'localhost',
      port: options.port ?? 6379,
      password: options.password,
      database: options.database ?? 0,
      connectionTimeout: options.connectionTimeout ?? 10000,
      autoReconnect: options.autoReconnect ?? true,
      maxRetries: options.maxRetries ?? 10,
      tls: options.tls ?? false,
      compressor: options.compressor,
      enableCompression: options.enableCompression ?? false,
    }

    // Initialize connection
    this.client = this.createClient()
  }

  /**
   * Create Redis client instance
   */
  private createClient(): typeof RedisClient.prototype {
    const url = this.buildConnectionUrl()
    const client = new RedisClient(url, {
      connectionTimeout: this.options.connectionTimeout,
      autoReconnect: this.options.autoReconnect,
      maxRetries: this.options.maxRetries,
      tls: this.options.tls,
    })

    // Set up event handlers
    client.onconnect = () => {
      // Connection established
    }

    client.onclose = (error: Error | undefined) => {
      if (error) {
        console.error('Redis connection closed:', error)
      }
    }

    return client
  }

  /**
   * Build Redis connection URL
   */
  private buildConnectionUrl(): string {
    if (this.options.url) {
      return this.options.url
    }

    const protocol = this.options.tls ? 'rediss' : 'redis'
    const auth = this.options.password ? `:${this.options.password}@` : ''
    return `${protocol}://${auth}${this.options.host}:${this.options.port}/${this.options.database}`
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: Key): string {
    return this.options.prefix ? `${this.options.prefix}:${key}` : key.toString()
  }

  /**
   * Strip prefix from key
   */
  private stripPrefix(fullKey: string): string {
    if (this.options.prefix && fullKey.startsWith(`${this.options.prefix}:`)) {
      return fullKey.slice(this.options.prefix.length + 1)
    }
    return fullKey
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: Key): Promise<T | undefined> {
    try {
      const fullKey = this.getFullKey(key)
      const value = await this.client.get(fullKey)

      if (value === null) {
        this.stats.misses++
        return undefined
      }

      this.stats.hits++
      return this.options.serializer.deserialize(value) as T
    }
    catch (error) {
      console.error('Redis get error:', error)
      return undefined
    }
  }

  /**
   * Get multiple values from the cache
   */
  async mget<T>(keys: Key[]): Promise<Record<string, T>> {
    try {
      const fullKeys = keys.map(k => this.getFullKey(k))
      const values = await this.client.mget(...fullKeys)

      const result: Record<string, T> = {}
      for (let i = 0; i < keys.length; i++) {
        const value = values[i]
        if (value !== null) {
          this.stats.hits++
          result[keys[i].toString()] = this.options.serializer.deserialize(value) as T
        }
        else {
          this.stats.misses++
        }
      }

      return result
    }
    catch (error) {
      console.error('Redis mget error:', error)
      return {}
    }
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: Key, value: T, ttl?: number): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      const serialized = this.options.serializer.serialize(value)
      const ttlValue = ttl ?? this.options.stdTTL

      if (ttlValue > 0) {
        await this.client.setex(fullKey, ttlValue, serialized)
      }
      else {
        await this.client.set(fullKey, serialized)
      }

      return true
    }
    catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  /**
   * Set multiple values in the cache
   */
  async mset<T>(entries: Array<{ key: Key, value: T, ttl?: number }>): Promise<boolean> {
    try {
      // For entries with TTL, we need to use pipeline
      const pipeline: Array<Promise<any>> = []

      for (const { key, value, ttl } of entries) {
        pipeline.push(this.set(key, value, ttl))
      }

      await Promise.all(pipeline)
      return true
    }
    catch (error) {
      console.error('Redis mset error:', error)
      return false
    }
  }

  /**
   * Delete one or more keys from the cache
   */
  async del(keys: Key | Key[]): Promise<number> {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys]
      const fullKeys = keysArray.map(k => this.getFullKey(k))

      const result = await this.client.del(...fullKeys)
      return result
    }
    catch (error) {
      console.error('Redis del error:', error)
      return 0
    }
  }

  /**
   * Check if a key exists in the cache
   */
  async has(key: Key): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      const exists = await this.client.exists(fullKey)
      return exists === 1
    }
    catch (error) {
      console.error('Redis has error:', error)
      return false
    }
  }

  /**
   * Get all keys in the cache
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern
        ? this.getFullKey(pattern)
        : this.getFullKey('*')

      const keys = await this.client.keys(searchPattern)
      return keys.map((k: string) => this.stripPrefix(k))
    }
    catch (error) {
      console.error('Redis keys error:', error)
      return []
    }
  }

  /**
   * Get the TTL of a key in milliseconds
   */
  async getTtl(key: Key): Promise<number | undefined> {
    try {
      const fullKey = this.getFullKey(key)
      const ttl = await this.client.ttl(fullKey)

      if (ttl === -2) {
        // Key doesn't exist
        return undefined
      }
      if (ttl === -1) {
        // Key has no expiry
        return 0
      }

      // Convert seconds to milliseconds
      return Date.now() + (ttl * 1000)
    }
    catch (error) {
      console.error('Redis getTtl error:', error)
      return undefined
    }
  }

  /**
   * Set/update the TTL of a key
   */
  async ttl(key: Key, ttl: number): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      const result = await this.client.expire(fullKey, ttl)
      return result === 1
    }
    catch (error) {
      console.error('Redis ttl error:', error)
      return false
    }
  }

  /**
   * Clear all keys in the cache
   */
  async flush(): Promise<void> {
    try {
      if (this.options.prefix) {
        // Delete only keys with the prefix
        const keys = await this.keys('*')
        if (keys.length > 0) {
          await this.del(keys)
        }
      }
      else {
        // Flush the entire database
        await this.client.flushdb()
      }

      this.stats = {
        hits: 0,
        misses: 0,
        keys: 0,
        ksize: 0,
        vsize: 0,
      }
    }
    catch (error) {
      console.error('Redis flush error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Stats> {
    try {
      const keys = await this.keys('*')
      return {
        ...this.stats,
        keys: keys.length,
      }
    }
    catch (error) {
      console.error('Redis getStats error:', error)
      return this.stats
    }
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    try {
      this.client.close()
    }
    catch (error) {
      console.error('Redis close error:', error)
    }
  }

  /**
   * Get keys by tag
   */
  async getKeysByTag(tag: string): Promise<string[]> {
    try {
      const tagKey = this.getFullKey(`tag:${tag}`)
      const keys = await this.client.smembers(tagKey)
      return keys.map((k: string) => this.stripPrefix(k))
    }
    catch (error) {
      console.error('Redis getKeysByTag error:', error)
      return []
    }
  }

  /**
   * Tag a key
   */
  async tag(key: Key, tags: string[]): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)

      // Add the key to each tag set
      const promises = tags.map((tag) => {
        const tagKey = this.getFullKey(`tag:${tag}`)
        return this.client.sadd(tagKey, fullKey)
      })

      await Promise.all(promises)
      return true
    }
    catch (error) {
      console.error('Redis tag error:', error)
      return false
    }
  }

  /**
   * Delete keys by tag
   */
  async deleteByTag(tag: string): Promise<number> {
    try {
      const keys = await this.getKeysByTag(tag)
      if (keys.length === 0)
        return 0

      const result = await this.del(keys)

      // Remove the tag set
      const tagKey = this.getFullKey(`tag:${tag}`)
      await this.client.del(tagKey)

      return result
    }
    catch (error) {
      console.error('Redis deleteByTag error:', error)
      return 0
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: Key, amount = 1): Promise<number> {
    try {
      const fullKey = this.getFullKey(key)
      const result = await this.client.incrby(fullKey, amount)
      return result
    }
    catch (error) {
      console.error('Redis increment error:', error)
      throw error
    }
  }

  /**
   * Decrement a numeric value
   */
  async decrement(key: Key, amount = 1): Promise<number> {
    try {
      const fullKey = this.getFullKey(key)
      const result = await this.client.decrby(fullKey, amount)
      return result
    }
    catch (error) {
      console.error('Redis decrement error:', error)
      throw error
    }
  }

  /**
   * Get and delete a key atomically (pop)
   */
  async take<T>(key: Key): Promise<T | undefined> {
    try {
      const fullKey = this.getFullKey(key)

      // Use GETDEL command (Redis 6.2+) or fallback to GET + DEL
      try {
        const value = await this.client.send('GETDEL', [fullKey])
        if (value === null) {
          return undefined
        }
        return this.options.serializer.deserialize(value) as T
      }
      catch {
        // Fallback for older Redis versions
        const value = await this.get<T>(key)
        if (value !== undefined) {
          await this.del(key)
        }
        return value
      }
    }
    catch (error) {
      console.error('Redis take error:', error)
      return undefined
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.client.connected
  }

  /**
   * Manually connect to Redis
   */
  async connect(): Promise<void> {
    await this.client.connect()
  }
}
