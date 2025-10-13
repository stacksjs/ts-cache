import type { Key, Stats, WrappedValue } from '../types'
import type { CacheDriver, MemoryDriverOptions } from './types'
import clone from 'clone'

/**
 * LRU Node for doubly linked list
 */
interface LRUNode<T> {
  key: string
  value: WrappedValue<T>
  prev: LRUNode<T> | null
  next: LRUNode<T> | null
}

/**
 * In-memory cache driver with LRU (Least Recently Used) eviction policy
 */
export class MemoryLRUDriver implements CacheDriver {
  private data: Map<string, LRUNode<any>> = new Map()
  private head: LRUNode<any> | null = null
  private tail: LRUNode<any> | null = null

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
      compressor: options.compressor,
      enableCompression: options.enableCompression ?? false,
      checkPeriod: options.checkPeriod ?? 600,
      deleteOnExpire: options.deleteOnExpire ?? true,
      maxKeys: options.maxKeys ?? 1000, // Default LRU limit
      useClones: options.useClones ?? true,
    }

    this.startCheckPeriod()
  }

  /**
   * Move node to head (most recently used)
   */
  private moveToHead(node: LRUNode<any>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * Add node to head
   */
  private addToHead(node: LRUNode<any>): void {
    node.next = this.head
    node.prev = null

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * Remove node from list
   */
  private removeNode(node: LRUNode<any>): void {
    if (node.prev) {
      node.prev.next = node.next
    }
    else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    }
    else {
      this.tail = node.prev
    }
  }

  /**
   * Remove tail (least recently used)
   */
  private removeTail(): LRUNode<any> | null {
    if (!this.tail) {
      return null
    }

    const node = this.tail
    this.removeNode(node)
    return node
  }

  /**
   * Evict LRU item when cache is full
   */
  private evictLRU(): void {
    const removed = this.removeTail()
    if (removed) {
      this.data.delete(removed.key)
      this.stats.vsize -= this.getValueSize(this.unwrap(removed.value, false))
      this.stats.ksize -= this.getKeySize(removed.key)
      this.stats.keys--
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: Key): Promise<T | undefined> {
    const fullKey = this.getFullKey(key)
    const node = this.data.get(fullKey)

    if (node && this.checkExpiry(fullKey, node.value)) {
      this.stats.hits++
      // Move to head (mark as recently used)
      this.moveToHead(node)
      return this.unwrap<T>(node.value)
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
      const node = this.data.get(fullKey)

      if (node && this.checkExpiry(fullKey, node.value)) {
        this.stats.hits++
        this.moveToHead(node)
        result[key.toString()] = this.unwrap<T>(node.value)
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
    const fullKey = this.getFullKey(key)
    const existingNode = this.data.get(fullKey)

    // Remove old value from stats
    if (existingNode) {
      this.stats.vsize -= this.getValueSize(this.unwrap(existingNode.value, false))
      this.removeNode(existingNode)
    }
    else {
      // Check if we need to evict
      if (this.options.maxKeys > 0 && this.stats.keys >= this.options.maxKeys) {
        this.evictLRU()
      }
    }

    // Create new node
    const wrapped = this.wrap(value, ttl)
    const node: LRUNode<T> = {
      key: fullKey,
      value: wrapped,
      prev: null,
      next: null,
    }

    // Add to head (most recently used)
    this.addToHead(node)
    this.data.set(fullKey, node)

    // Update stats
    this.stats.vsize += this.getValueSize(value)
    if (!existingNode) {
      this.stats.ksize += this.getKeySize(key)
      this.stats.keys++
    }

    return true
  }

  /**
   * Set multiple values in the cache
   */
  async mset<T>(entries: Array<{ key: Key, value: T, ttl?: number }>): Promise<boolean> {
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
      const node = this.data.get(fullKey)

      if (node) {
        this.stats.vsize -= this.getValueSize(this.unwrap(node.value, false))
        this.stats.ksize -= this.getKeySize(key)
        this.stats.keys--
        this.removeNode(node)
        this.data.delete(fullKey)
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
    const node = this.data.get(fullKey)
    return !!(node && this.checkExpiry(fullKey, node.value))
  }

  /**
   * Get all keys in the cache
   */
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.data.values())
      .filter(node => this.checkExpiry(node.key, node.value))
      .map(node => this.stripPrefix(node.key))

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
    const node = this.data.get(fullKey)

    if (node && this.checkExpiry(fullKey, node.value)) {
      return node.value.t
    }
    return undefined
  }

  /**
   * Set/update the TTL of a key
   */
  async ttl(key: Key, ttl: number): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    const node = this.data.get(fullKey)

    if (node && this.checkExpiry(fullKey, node.value)) {
      node.value = this.wrap(node.value.v, ttl, false)
      this.moveToHead(node) // Mark as recently used
      return true
    }
    return false
  }

  /**
   * Clear all keys in the cache
   */
  async flush(): Promise<void> {
    this.data.clear()
    this.head = null
    this.tail = null
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
      .map((fullKey) => {
        const node = this.data.get(fullKey)
        return node && this.checkExpiry(fullKey, node.value) ? this.stripPrefix(fullKey) : null
      })
      .filter((key): key is string => key !== null)
  }

  /**
   * Tag a key
   */
  async tag(key: Key, tags: string[]): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    if (!this.data.has(fullKey))
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
        const node = this.data.get(key)
        if (node) {
          this.removeNode(node)
          this.data.delete(key)
          this.stats.keys--
        }
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
    for (const [key, node] of this.data.entries()) {
      this.checkExpiry(key, node.value)
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
