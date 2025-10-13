import type { Buffer } from 'node:buffer'
import type { Key, Stats } from '../types'

/**
 * Compressor interface
 */
export interface Compressor {
  compress: (data: string | Buffer) => Buffer
  decompress: (data: Buffer) => string | Buffer
}

/**
 * Driver configuration options
 */
export interface DriverOptions {
  /**
   * Standard time to live in seconds. 0 = infinity
   */
  stdTTL?: number

  /**
   * Cache key prefix for namespacing
   */
  prefix?: string

  /**
   * Serializer for values
   */
  serializer?: Serializer

  /**
   * Compressor for values (optional)
   */
  compressor?: Compressor

  /**
   * Enable compression (requires compressor to be set)
   */
  enableCompression?: boolean
}

/**
 * Redis driver specific options
 */
export interface RedisDriverOptions extends DriverOptions {
  /**
   * Redis connection URL
   */
  url?: string

  /**
   * Redis host
   */
  host?: string

  /**
   * Redis port
   */
  port?: number

  /**
   * Redis password
   */
  password?: string

  /**
   * Redis database number
   */
  database?: number

  /**
   * Connection timeout in milliseconds
   */
  connectionTimeout?: number

  /**
   * Enable auto-reconnect
   */
  autoReconnect?: boolean

  /**
   * Maximum retry attempts
   */
  maxRetries?: number

  /**
   * Enable TLS
   */
  tls?: boolean
}

/**
 * Memory driver specific options
 */
export interface MemoryDriverOptions extends DriverOptions {
  /**
   * Time in seconds to check all data and delete expired keys
   */
  checkPeriod?: number

  /**
   * Whether values should be deleted automatically at expiration
   */
  deleteOnExpire?: boolean

  /**
   * Max amount of keys that are being stored
   */
  maxKeys?: number

  /**
   * Enable cloning of values
   */
  useClones?: boolean
}

/**
 * Serializer interface for value transformation
 */
export interface Serializer {
  /**
   * Serialize a value for storage
   */
  serialize: (value: any) => string | Buffer

  /**
   * Deserialize a value from storage
   */
  deserialize: (data: string | Buffer) => any
}

/**
 * Cache driver interface
 */
export interface CacheDriver {
  /**
   * Get a value from the cache
   */
  get: <T>(key: Key) => Promise<T | undefined>

  /**
   * Get multiple values from the cache
   */
  mget: <T>(keys: Key[]) => Promise<Record<string, T>>

  /**
   * Set a value in the cache
   */
  set: <T>(key: Key, value: T, ttl?: number) => Promise<boolean>

  /**
   * Set multiple values in the cache
   */
  mset: <T>(entries: Array<{ key: Key, value: T, ttl?: number }>) => Promise<boolean>

  /**
   * Delete one or more keys from the cache
   */
  del: (keys: Key | Key[]) => Promise<number>

  /**
   * Check if a key exists in the cache
   */
  has: (key: Key) => Promise<boolean>

  /**
   * Get all keys in the cache
   */
  getTtl: (key: Key) => Promise<number | undefined>

  /**
   * Set/update the TTL of a key
   */
  ttl: (key: Key, ttl: number) => Promise<boolean>

  /**
   * Clear all keys in the cache
   */
  flush: () => Promise<void>

  /**
   * Get cache statistics
   */
  getStats: () => Promise<Stats>

  /**
   * Close the driver connection
   */
  close: () => Promise<void>

  /**
   * Get keys by pattern (optional, driver-specific)
   */
  keys: (() => Promise<string[]>) & ((pattern?: string) => Promise<string[]>)

  /**
   * Get keys by tag (optional, driver-specific)
   */
  getKeysByTag?: (tag: string) => Promise<string[]>

  /**
   * Tag a key (optional, driver-specific)
   */
  tag?: (key: Key, tags: string[]) => Promise<boolean>

  /**
   * Delete keys by tag (optional, driver-specific)
   */
  deleteByTag?: (tag: string) => Promise<number>
}

/**
 * Driver type enumeration
 */
export enum DriverType {
  Memory = 'memory',
  Redis = 'redis',
}
