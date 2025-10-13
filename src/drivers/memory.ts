import type { Key, Stats, WrappedValue } from '../types'
import type { CacheDriver, MemoryDriverOptions } from './types'
import clone from 'clone'

/**
 * In-memory cache driver implementation
 */
export class MemoryDriver implements CacheDriver {
  private data: Record<string, WrappedValue<any>> = {}
  private stats: Stats = {
    hits: 0,
    misses: 0,
    keys: 0,
    ksize: 0,
    vsize: 0,
  }

  private options: Required<Omit<MemoryDriverOptions, 'compressor'>> & { compressor?: MemoryDriverOptions['compressor'] }
  private checkTimeout?: NodeJS.Timeout
  private tags: Map<string, Set<string>> = new Map()

  constructor(options: MemoryDriverOptions = {}) {
    this.options = {
      stdTTL: options.stdTTL ?? 0,
      prefix: options.prefix ?? '',
      serializer: options.serializer ?? { serialize: v => v, deserialize: v => v },
      checkPeriod: options.checkPeriod ?? 600,
      deleteOnExpire: options.deleteOnExpire ?? true,
      maxKeys: options.maxKeys ?? -1,
      useClones: options.useClones ?? true,
      compressor: options.compressor,
      enableCompression: options.enableCompression ?? false,
    }

    this.startCheckPeriod()
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: Key): Promise<T | undefined> {
    const fullKey = this.getFullKey(key)

    if (this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey])) {
      this.stats.hits++
      return this.unwrap<T>(this.data[fullKey])
    }

    this.stats.misses++
    return undefined
  }

  /**
   * Get multiple values from the cache
   */
  async mget<T>(keys: Key[]): Promise<Record<string, T>> {
    const result: Record<string, T> = {}

    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      if (this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey])) {
        this.stats.hits++
        result[key.toString()] = this.unwrap<T>(this.data[fullKey])
      }
      else {
        this.stats.misses++
      }
    }

    return result
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: Key, value: T, ttl?: number): Promise<boolean> {
    if (this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) {
      throw new Error('Cache max keys amount exceeded')
    }

    const fullKey = this.getFullKey(key)
    const existed = !!this.data[fullKey]

    if (existed) {
      this.stats.vsize -= this.getValueSize(this.unwrap(this.data[fullKey], false))
    }

    this.data[fullKey] = this.wrap(value, ttl)
    this.stats.vsize += this.getValueSize(value)

    if (!existed) {
      this.stats.ksize += this.getKeySize(key)
      this.stats.keys++
    }

    return true
  }

  /**
   * Set multiple values in the cache
   */
  async mset<T>(entries: Array<{ key: Key, value: T, ttl?: number }>): Promise<boolean> {
    if (this.options.maxKeys > -1 && this.stats.keys + entries.length >= this.options.maxKeys) {
      throw new Error('Cache max keys amount exceeded')
    }

    for (const { key, value, ttl } of entries) {
      await this.set(key, value, ttl)
    }

    return true
  }

  /**
   * Delete one or more keys from the cache
   */
  async del(keys: Key | Key[]): Promise<number> {
    const keysArray = Array.isArray(keys) ? keys : [keys]
    let deletedCount = 0

    for (const key of keysArray) {
      const fullKey = this.getFullKey(key)
      if (this.data[fullKey]) {
        this.stats.vsize -= this.getValueSize(this.unwrap(this.data[fullKey], false))
        this.stats.ksize -= this.getKeySize(key)
        this.stats.keys--
        delete this.data[fullKey]
        deletedCount++

        // Clean up tags
        this.tags.forEach((keySet) => {
          keySet.delete(fullKey)
        })
      }
    }

    return deletedCount
  }

  /**
   * Check if a key exists in the cache
   */
  async has(key: Key): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    return !!(this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey]))
  }

  /**
   * Get all keys in the cache
   */
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Object.keys(this.data)
      .filter(fullKey => this.checkExpiry(fullKey, this.data[fullKey]))
      .map(fullKey => this.stripPrefix(fullKey))

    if (pattern) {
      const regex = this.patternToRegex(pattern)
      return allKeys.filter(key => regex.test(key))
    }

    return allKeys
  }

  /**
   * Get the TTL of a key in milliseconds
   */
  async getTtl(key: Key): Promise<number | undefined> {
    const fullKey = this.getFullKey(key)
    if (this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey])) {
      return this.data[fullKey].t
    }
    return undefined
  }

  /**
   * Set/update the TTL of a key
   */
  async ttl(key: Key, ttl: number): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    if (this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey])) {
      this.data[fullKey] = this.wrap(this.data[fullKey].v, ttl, false)
      return true
    }
    return false
  }

  /**
   * Clear all keys in the cache
   */
  async flush(): Promise<void> {
    this.data = {}
    this.tags.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0,
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Stats> {
    return { ...this.stats }
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    this.stopCheckPeriod()
  }

  /**
   * Get keys by tag
   */
  async getKeysByTag(tag: string): Promise<string[]> {
    const keySet = this.tags.get(tag)
    if (!keySet)
      return []

    return Array.from(keySet)
      .filter(fullKey => this.data[fullKey] && this.checkExpiry(fullKey, this.data[fullKey]))
      .map(fullKey => this.stripPrefix(fullKey))
  }

  /**
   * Tag a key
   */
  async tag(key: Key, tags: string[]): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    if (!this.data[fullKey])
      return false

    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set())
      }
      this.tags.get(tag)!.add(fullKey)
    }

    return true
  }

  /**
   * Delete keys by tag
   */
  async deleteByTag(tag: string): Promise<number> {
    const keys = await this.getKeysByTag(tag)
    if (keys.length === 0)
      return 0

    const result = await this.del(keys)
    this.tags.delete(tag)
    return result
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
   * Wrap a value with metadata
   */
  private wrap<T>(value: T, ttl?: number, asClone = true): WrappedValue<T> {
    const now = Date.now()
    let expiry = 0

    if (ttl === 0) {
      expiry = 0
    }
    else if (ttl !== undefined) {
      expiry = now + (ttl * 1000)
    }
    else if (this.options.stdTTL === 0) {
      expiry = 0
    }
    else {
      expiry = now + (this.options.stdTTL * 1000)
    }

    return {
      t: expiry,
      v: (asClone && this.options.useClones) ? clone(value) : value,
    }
  }

  /**
   * Unwrap a value from its metadata
   */
  private unwrap<T>(wrapped: WrappedValue<any>, asClone = true): T {
    if (wrapped.v !== undefined) {
      return (asClone && this.options.useClones) ? clone(wrapped.v) : wrapped.v
    }
    return null as any
  }

  /**
   * Check if a key has expired
   */
  private checkExpiry(key: string, data: WrappedValue<any>): boolean {
    if (data.t !== 0 && data.t < Date.now()) {
      if (this.options.deleteOnExpire) {
        delete this.data[key]
        this.stats.keys--
        return false
      }
    }
    return true
  }

  /**
   * Start periodic check for expired keys
   */
  private startCheckPeriod(): void {
    if (this.options.checkPeriod > 0) {
      this.checkTimeout = setTimeout(() => {
        this.checkAllData()
        this.startCheckPeriod()
      }, this.options.checkPeriod * 1000) as NodeJS.Timeout

      if (this.checkTimeout && typeof this.checkTimeout.unref === 'function') {
        this.checkTimeout.unref()
      }
    }
  }

  /**
   * Stop periodic check
   */
  private stopCheckPeriod(): void {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout)
    }
  }

  /**
   * Check all data for expiry
   */
  private checkAllData(): void {
    for (const key in this.data) {
      this.checkExpiry(key, this.data[key])
    }
  }

  /**
   * Get key size in bytes
   */
  private getKeySize(key: Key): number {
    return key.toString().length
  }

  /**
   * Get value size estimation
   */
  private getValueSize(value: any): number {
    if (typeof value === 'string') {
      return value.length
    }
    else if (typeof value === 'number' || typeof value === 'boolean') {
      return 8
    }
    else if (Array.isArray(value)) {
      return 40 * value.length
    }
    else if (value && typeof value === 'object') {
      return 80 * Object.keys(value).length
    }
    return 0
  }

  /**
   * Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    return new RegExp(`^${escaped}$`)
  }
}
