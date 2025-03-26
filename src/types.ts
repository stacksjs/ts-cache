import type { EventEmitter } from 'node:events'

/**
 * Since 4.1.0: Key-validation: The keys can be given as either string or number,
 * but are casted to a string internally anyway.
 */
export type Key = string | number

/**
 * ValueSetItem for the mset method
 */
export interface ValueSetItem<T = any> {
  key: Key
  val: T
  ttl?: number
}

/**
 * Container for internal cached data
 */
export interface Data {
  [key: string]: WrappedValue<any>
}

/**
 * Options for cache configuration
 */
export interface Options {
  /**
   * Convert all elements to string
   */
  forceString?: boolean

  /**
   * Used standard size for calculating value size
   */
  objectValueSize?: number
  promiseValueSize?: number
  arrayValueSize?: number

  /**
   * Standard time to live in seconds. 0 = infinity
   */
  stdTTL?: number

  /**
   * Time in seconds to check all data and delete expired keys
   */
  checkperiod?: number

  /**
   * En/disable cloning of variables.
   * If `true` you'll get a copy of the cached variable.
   * If `false` you'll save and get just the reference
   */
  useClones?: boolean

  /**
   * Whether values should be deleted automatically at expiration
   */
  deleteOnExpire?: boolean

  /**
   * Enable legacy callbacks
   */
  enableLegacyCallbacks?: boolean

  /**
   * Max amount of keys that are being stored
   */
  maxKeys?: number
}

/**
 * Statistics for the cache
 */
export interface Stats {
  hits: number
  misses: number
  keys: number
  ksize: number
  vsize: number
}

/**
 * Internal value wrapper
 */
export interface WrappedValue<T> {
  // ttl timestamp
  t: number
  // value
  v: T
}

/**
 * Error structure
 */
export interface CacheError extends Error {
  name: string
  errorcode: string
  message: string
  data: any
}

/**
 * Cache class interface
 */
export interface ICache extends EventEmitter {
  data: Data
  options: Options
  stats: Stats

  get: <T>(key: Key) => T | undefined
  mget: <T>(keys: Key[]) => { [key: string]: T }
  set: <T>(key: Key, value: T, ttl?: number | string) => boolean
  fetch: (<T>(key: Key, value: (() => T) | T) => T) & (<T>(key: Key, ttl: number | string, value: (() => T) | T) => T)
  mset: <T>(keyValueSet: ValueSetItem<T>[]) => boolean
  del: (keys: Key | Key[]) => number
  take: <T>(key: Key) => T | undefined
  ttl: (key: Key, ttl?: number) => boolean
  getTtl: (key: Key) => number | undefined
  keys: () => string[]
  getStats: () => Stats
  has: (key: Key) => boolean
  flushAll: () => void
  flushStats: () => void
  close: () => void
}
