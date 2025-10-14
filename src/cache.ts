import type { CacheError, Data, Cache as ICache, Key, Options, Stats, ValueSetItem, WrappedValue } from './types'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { DEFAULT_OPTIONS, ERROR_MESSAGES } from './config'

/**
 * Fast deep clone using structuredClone (fastest option in modern runtimes)
 * Falls back to JSON parse/stringify if structuredClone is not available
 */
function fastClone<T>(value: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(value)
  }
  // Fallback for older environments
  return JSON.parse(JSON.stringify(value))
}

/**
 * TypeScript port of node-cache
 * Simple and fast NodeJS internal caching
 */
export class Cache extends EventEmitter implements ICache {
  /** container for cached data - using Map for guaranteed O(1) lookups */
  data: Data = {}

  /** Fast Map-based storage (optional, used when maxPerformance is true) */
  private dataMap?: Map<string, WrappedValue<any>>

  /** module options */
  options: Options

  /** statistics container */
  stats: Stats = {
    hits: 0,
    misses: 0,
    keys: 0,
    ksize: 0,
    vsize: 0,
  }

  /** pre-allocate valid key types array */
  private validKeyTypes = ['string', 'number']

  /** timeout for checking data */
  private checkTimeout?: NodeJS.Timeout

  /** Performance flags cached at construction time */
  private readonly _useClones: boolean
  private readonly _enableStats: boolean
  private readonly _enableEvents: boolean
  private readonly _checkTTL: boolean

  /**
   * Creates a new Cache instance
   * @param options - Configuration options
   */
  constructor(options: Options = {}) {
    super()

    // merge provided options with defaults
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)

    // Cache performance flags for ultra-fast access
    this._useClones = this.options.useClones !== false
    this._enableStats = this.options.enableStats !== false
    this._enableEvents = this.options.enableEvents !== false
    this._checkTTL = this.options.stdTTL !== 0 || this.options.checkPeriod !== 0

    // Use Map for better performance if maxPerformance is enabled
    if (this.options.maxPerformance) {
      this.dataMap = new Map()
    }

    // initialize checking period
    this._checkData()
  }

  /**
   * Get a cached key and change the stats
   * @param key - Cache key
   * @returns The value stored in the key or undefined if not found
   */
  get<T>(key: Key): T | undefined {
    // Ultra-fast path: convert key to string once (avoid .toString() call when possible)
    const keyStr = typeof key === 'string' ? key : key.toString()

    // Use Map or object based on maxPerformance flag
    const data = this.dataMap ? this.dataMap.get(keyStr) : this.data[keyStr]

    // Fast existence check - early exit for cache miss (most common after hits)
    if (data === undefined) {
      if (this._enableStats)
        this.stats.misses++
      return undefined
    }

    // Fast path: check expiration with minimal branches
    // Most items won't be expired, so optimize for the common case
    if (this._checkTTL) {
      const ttl = data.t
      if (ttl !== 0) {
        if (ttl < Date.now()) {
          // Expired - handle inline for performance
          if (this._enableStats) {
            // Use local reference to stats for faster access
            const stats = this.stats
            stats.misses++
            stats.vsize -= this._getValLength(data.v)
            stats.ksize -= keyStr.length
            stats.keys--
          }

          if (this.options.deleteOnExpire) {
            if (this.dataMap) {
              this.dataMap.delete(keyStr)
            }
            else {
              delete this.data[keyStr]
            }
          }

          if (this._enableEvents) {
            this.emit('expired', keyStr, data.v)
          }

          return undefined
        }
      }
    }

    // Cache hit - most common path (optimize for this)
    if (this._enableStats)
      this.stats.hits++

    // Inline unwrap - avoid function call overhead
    return this._useClones ? fastClone(data.v) : data.v
  }

  /**
   * Get multiple cached keys at once and change the stats
   * @param keys - An array of keys
   * @returns An object containing the values stored in the matching keys
   */
  mget<T>(keys: Key[]): { [key: string]: T } {
    // Pre-allocate result object
    const result: { [key: string]: T } = {}
    const now = Date.now()
    const useClones = this.options.useClones

    // Optimized loop - avoid repeated method calls
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const keyStr = typeof key === 'string' ? key : key.toString()
      const data = this.data[keyStr]

      if (data !== undefined) {
        // Inline TTL check
        if (data.t === 0 || data.t >= now) {
          this.stats.hits++
          result[keyStr] = useClones ? fastClone(data.v) : data.v
        }
        else {
          this.stats.misses++
          if (this.options.deleteOnExpire) {
            this.del(key)
          }
        }
      }
      else {
        this.stats.misses++
      }
    }

    return result
  }

  /**
   * Set a cached key and change the stats
   * @param key - Cache key
   * @param value - A element to cache. If the option `option.forceString` is `true` the module tries to translate it to a serialized JSON
   * @param ttl - The time to live in seconds (optional)
   * @returns Boolean indicating if the operation was successful
   */
  set<T>(key: Key, value: T, ttl?: number | string): boolean {
    // Ultra-fast path: convert key to string once
    const keyStr = typeof key === 'string' ? key : key.toString()

    // Use Map or object based on maxPerformance flag
    const existent = this.dataMap ? this.dataMap.has(keyStr) : this.data[keyStr] !== undefined

    // Check max keys only for new keys
    if (!existent && this.options.maxKeys && this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) {
      const err = this._error('ECACHEFULL')
      throw err
    }

    // Force string if configured (cached check)
    const valueToStore = this.options.forceString && typeof value !== 'string'
      ? JSON.stringify(value)
      : value

    // Calculate TTL timestamp - skip if not needed
    let livetime = 0
    if (this._checkTTL) {
      // Parse TTL if string
      const ttlValue = typeof ttl === 'string' ? Number.parseInt(ttl, 10) : ttl

      const now = Date.now()

      if (ttlValue === 0) {
        livetime = 0
      }
      else if (ttlValue) {
        livetime = now + (ttlValue * 1000)
      }
      else if (this.options.stdTTL === 0) {
        livetime = 0
      }
      else if (this.options.stdTTL) {
        livetime = now + (this.options.stdTTL * 1000)
      }
    }

    // Update stats for existing keys
    if (this._enableStats && existent) {
      const oldData = this.dataMap ? this.dataMap.get(keyStr) : this.data[keyStr]
      if (oldData) {
        this.stats.vsize -= this._getValLength(oldData.v)
      }
    }

    // Wrap and store value (inline for performance) - use cached flag
    const wrappedValue = {
      t: livetime,
      v: this._useClones ? fastClone(valueToStore) : valueToStore,
    }

    // Store in Map or object
    if (this.dataMap) {
      this.dataMap.set(keyStr, wrappedValue)
    }
    else {
      this.data[keyStr] = wrappedValue
    }

    // Update stats for new keys
    if (this._enableStats) {
      this.stats.vsize += this._getValLength(valueToStore)

      if (!existent) {
        this.stats.ksize += keyStr.length
        this.stats.keys++
      }
    }

    return true
  }

  /**
   * In the event of a cache miss, value will be written to cache and returned
   * In case of cache hit, cached value will be returned without executing given value
   * If the given value is type of `Function`, it will be executed and returned result will be fetched
   *
   * @param key - Cache key
   * @param ttlOrValue - TTL in seconds or the value/function to fetch
   * @param value - Value or function to fetch (if ttl is provided)
   * @returns The fetched or cached value
   */
  fetch<T>(key: Key, ttlOrValue: number | string | (() => T) | T, value?: (() => T) | T): T {
    // Inline cache hit check to avoid double lookup
    const keyStr = typeof key === 'string' ? key : key.toString()
    const data = this.data[keyStr]

    if (data !== undefined && (data.t === 0 || data.t >= Date.now())) {
      this.stats.hits++
      return this.options.useClones ? fastClone(data.v) : data.v
    }

    this.stats.misses++

    let ttl: number | string | undefined
    let valueToFetch: (() => T) | T

    if (typeof value === 'undefined') {
      valueToFetch = ttlOrValue as (() => T) | T
      ttl = undefined
    }
    else {
      ttl = ttlOrValue as number | string
      valueToFetch = value
    }

    const resultValue = typeof valueToFetch === 'function'
      ? (valueToFetch as () => T)()
      : valueToFetch

    this.set(key, resultValue, ttl)
    return resultValue
  }

  /**
   * Set multiple keys at once
   * @param keyValueSet - An array of objects which include key, value, and ttl
   * @returns Boolean indicating if the operation was successful
   */
  mset<T>(keyValueSet: ValueSetItem<T>[]): boolean {
    // Pre-calculate values for performance
    const now = Date.now()
    const useClones = this.options.useClones
    const stdTTL = this.options.stdTTL
    const forceString = this.options.forceString

    // Count new keys for maxKeys check
    let newKeysCount = 0
    for (let i = 0, len = keyValueSet.length; i < len; i++) {
      const keyStr = typeof keyValueSet[i].key === 'string'
        ? keyValueSet[i].key as string
        : keyValueSet[i].key.toString()

      if (this.data[keyStr] === undefined) {
        newKeysCount++
      }
    }

    // Check max keys
    if (this.options.maxKeys && this.options.maxKeys > -1
      && this.stats.keys + newKeysCount > this.options.maxKeys) {
      const err = this._error('ECACHEFULL')
      throw err
    }

    // Optimized batch set
    for (let i = 0, len = keyValueSet.length; i < len; i++) {
      const { key, val, ttl } = keyValueSet[i]
      const keyStr = typeof key === 'string' ? key : key.toString()
      const existent = this.data[keyStr] !== undefined

      // Force string if configured
      const valueToStore = forceString && typeof val !== 'string'
        ? JSON.stringify(val)
        : val

      // Calculate TTL
      let livetime = 0
      if (ttl === 0) {
        livetime = 0
      }
      else if (ttl) {
        livetime = now + (ttl * 1000)
      }
      else if (stdTTL === 0) {
        livetime = 0
      }
      else if (stdTTL) {
        livetime = now + (stdTTL * 1000)
      }

      // Update stats for existing keys
      if (existent) {
        this.stats.vsize -= this._getValLength(this.data[keyStr].v)
      }

      // Store value
      this.data[keyStr] = {
        t: livetime,
        v: useClones ? fastClone(valueToStore) : valueToStore,
      }

      this.stats.vsize += this._getValLength(valueToStore)

      // Update stats for new keys
      if (!existent) {
        this.stats.ksize += keyStr.length
        this.stats.keys++
      }
    }

    return true
  }

  /**
   * Remove keys
   * @param keys - Cache key to delete or an array of cache keys
   * @returns Number of deleted keys
   */
  del(keys: Key | Key[]): number {
    // convert keys to an array if it's not already
    const keysArray = Array.isArray(keys) ? keys : [keys]

    let delCount = 0
    for (let i = 0, len = keysArray.length; i < len; i++) {
      const key = keysArray[i]

      // handle invalid key types
      const err = this._isInvalidKey(key)
      if (err)
        throw err

      const keyStr = typeof key === 'string' ? key : key.toString()
      // only delete if existent
      const data = this.data[keyStr]
      if (data) {
        // calc the stats - inline for performance
        this.stats.vsize -= this._getValLength(data.v)
        this.stats.ksize -= keyStr.length
        this.stats.keys--
        delCount++

        // delete the value
        delete this.data[keyStr]

        // emit delete event
        this.emit('del', key, data.v)
      }
    }

    return delCount
  }

  /**
   * Get the cached value and remove the key from the cache
   * Equivalent to calling `get(key)` + `del(key)`
   * Useful for implementing `single use` mechanism such as OTP
   *
   * @param key - Cache key
   * @returns The value stored in the key or undefined if not found
   */
  take<T>(key: Key): T | undefined {
    const value = this.get<T>(key)
    if (value !== undefined) {
      this.del(key)
    }
    return value
  }

  /**
   * Reset or redefine the ttl of a key. `ttl` = 0 means infinite lifetime
   * If `ttl` is not passed the default ttl is used
   * If `ttl` < 0 the key will be deleted
   *
   * @param key - Cache key to reset the ttl value
   * @param ttl - The time to live in seconds (optional)
   * @returns Boolean indicating if the key was found and ttl set
   */
  ttl(key: Key, ttl?: number): boolean {
    const ttlValue = ttl ?? this.options.stdTTL

    if (!key) {
      return false
    }

    // handle invalid key types
    const err = this._isInvalidKey(key)
    if (err)
      throw err

    const keyStr = key.toString()
    // check for existent data and update the ttl value
    if (this.data[keyStr] && this._check(keyStr, this.data[keyStr])) {
      // if ttl < 0 delete the key, otherwise reset the value
      if (ttlValue && ttlValue >= 0) {
        this.data[keyStr] = this._wrap(this.data[keyStr].v, ttlValue, false)
      }
      else {
        this.del(key)
      }
      return true
    }
    else {
      // return false if key has not been found
      return false
    }
  }

  /**
   * Receive the ttl of a key
   * @param key - Cache key to check the ttl value
   * @returns The timestamp in ms when the key will expire, 0 if it will never expire or undefined if it does not exist
   */
  getTtl(key: Key): number | undefined {
    if (!key) {
      return undefined
    }

    // handle invalid key types
    const err = this._isInvalidKey(key)
    if (err)
      throw err

    const keyStr = key.toString()
    // check for existent data and return the ttl value
    if (this.data[keyStr] && this._check(keyStr, this.data[keyStr])) {
      return this.data[keyStr].t
    }
    else {
      // return undefined if key has not been found
      return undefined
    }
  }

  /**
   * List all keys within this cache
   * @returns An array of all keys
   */
  keys(): string[] {
    return Object.keys(this.data)
  }

  /**
   * Check if a key is cached
   * @param key - Cache key to check
   * @returns Boolean indicating if the key is cached
   */
  has(key: Key): boolean {
    const keyStr = typeof key === 'string' ? key : key.toString()
    const data = this.dataMap ? this.dataMap.get(keyStr) : this.data[keyStr]

    // Fast existence check
    if (data !== undefined) {
      // Skip TTL check if not needed
      if (!this._checkTTL)
        return true
      return data.t === 0 || data.t >= Date.now()
    }

    return false
  }

  /**
   * Get the cache statistics
   * @returns Stats object
   */
  getStats(): Stats {
    return this.stats
  }

  /**
   * Flush the whole data and reset the stats
   */
  flushAll(startPeriod = true): void {
    // parameter just for testing

    // set data empty
    this.data = {}

    // reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0,
    }

    // reset check period
    this._killCheckPeriod()
    this._checkData(startPeriod)

    this.emit('flush')
  }

  /**
   * Flush the stats and reset all counters to 0
   */
  flushStats(): void {
    // reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0,
    }

    this.emit('flush_stats')
  }

  /**
   * Clear the interval timeout which is set on checkPeriod option
   */
  close(): void {
    this._killCheckPeriod()
  }

  /**
   * Internal housekeeping method
   * Check all the cached data and delete the invalid values
   */
  private _checkData(startPeriod = true): void {
    // run the housekeeping method
    for (const key in this.data) {
      this._check(key, this.data[key])
    }

    if (startPeriod && this.options.checkPeriod && this.options.checkPeriod > 0) {
      this.checkTimeout = setTimeout(() => {
        this._checkData(startPeriod)
      }, this.options.checkPeriod * 1000) as NodeJS.Timeout

      if (this.checkTimeout && typeof this.checkTimeout.unref === 'function') {
        this.checkTimeout.unref()
      }
    }
  }

  /**
   * Stop the checkdata period
   * Only needed to abort the script in testing mode
   */
  private _killCheckPeriod(): void {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout)
    }
  }

  /**
   * Internal method to check the value
   * If it's not valid anymore, delete it
   */
  private _check(key: string, data: WrappedValue<any>): boolean {
    let result = true
    // data is invalid if the ttl is too old and is not 0
    if (data.t !== 0 && data.t < Date.now()) {
      if (this.options.deleteOnExpire) {
        result = false
        this.del(key)
      }
      this.emit('expired', key, this._unwrap(data))
    }

    return result
  }

  /**
   * Internal method to check if the type of a key is either `number` or `string`
   */
  private _isInvalidKey(key: any): CacheError | undefined {
    if (!this.validKeyTypes.includes(typeof key)) {
      return this._error('EKEYTYPE', { type: typeof key })
    }
    return undefined
  }

  /**
   * Internal method to wrap a value in an object with some metadata
   */
  private _wrap<T>(value: T, ttl?: number, asClone = true): WrappedValue<T> {
    if (!this.options.useClones) {
      asClone = false
    }

    // define the time to live
    const now = Date.now()
    let livetime = 0

    // use given ttl
    if (ttl === 0) {
      livetime = 0
    }
    else if (ttl) {
      livetime = now + (ttl * 1000)
    }
    else {
      // use standard ttl
      if (this.options.stdTTL === 0) {
        livetime = this.options.stdTTL as number
      }
      else {
        livetime = now + ((this.options.stdTTL as number) * 1000)
      }
    }

    // return the wrapped value
    return {
      t: livetime,
      v: asClone ? fastClone(value) : value,
    }
  }

  /**
   * Internal method to extract the value out of the wrapped value
   */
  private _unwrap<T>(value: WrappedValue<any>, asClone = true): T {
    if (!this.options.useClones) {
      asClone = false
    }

    if (value.v !== undefined) {
      return asClone ? fastClone(value.v) : value.v
    }

    return null as any
  }

  /**
   * Internal method the calculate the key length
   */
  private _getKeyLength(key: Key): number {
    return key.toString().length
  }

  /**
   * Internal method to calculate the value length
   */
  private _getValLength(value: any): number {
    if (typeof value === 'string') {
      // if the value is a String get the real length
      return value.length
    }
    else if (this.options.forceString) {
      // force string if it's defined and not passed
      return JSON.stringify(value).length
    }
    else if (Array.isArray(value)) {
      // if the data is an Array multiply each element with a defined default length
      return (this.options.arrayValueSize as number) * value.length
    }
    else if (typeof value === 'number') {
      return 8
    }
    else if (typeof value?.then === 'function') {
      // if the data is a Promise, use defined default
      // (can't calculate actual/resolved value size synchronously)
      return this.options.promiseValueSize as number
    }
    else if (Buffer && Buffer.isBuffer(value)) {
      return value.length
    }
    else if (value && typeof value === 'object') {
      // if the data is an Object multiply each element with a defined default length
      return (this.options.objectValueSize as number) * Object.keys(value).length
    }
    else if (typeof value === 'boolean') {
      return 8
    }
    else {
      // default fallback
      return 0
    }
  }

  /**
   * Internal method to handle an error message
   */
  private _error(type: string, data: any = {}): CacheError {
    // generate the error object
    const error = new Error(`Cache error: ${type}`) as CacheError
    error.name = type
    error.errorcode = type
    error.message = this._createErrorMessage(ERROR_MESSAGES[type as keyof typeof ERROR_MESSAGES])(data)
    error.data = data

    // return the error object
    return error
  }

  /**
   * Create error message from template
   */
  private _createErrorMessage(errMsg: string): (args: any) => string {
    return (args: any) => errMsg.replace('__key', args?.type)
  }
}

// Export a default instance for easy usage
export const cache: Cache = new Cache()
