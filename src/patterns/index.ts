import type { CacheManager } from '../manager'
import type { Key } from '../types'

/**
 * Cache-aside pattern (lazy loading)
 */
export class CacheAsidePattern<T> {
  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl?: number,
  ) {}

  async get(key: Key): Promise<T> {
    // Try to get from cache
    const cached = await this.cache.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Load from source
    const value = await this.loader(key)

    // Store in cache
    await this.cache.set(key, value, this.ttl)

    return value
  }

  async invalidate(key: Key): Promise<void> {
    await this.cache.del(key)
  }
}

/**
 * Read-through cache pattern
 */
export class ReadThroughPattern<T> {
  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl?: number,
  ) {}

  async get(key: Key): Promise<T> {
    return await this.cache.fetch(key, () => this.loader(key), this.ttl)
  }
}

/**
 * Write-through cache pattern
 */
export class WriteThroughPattern<T> {
  constructor(
    private cache: CacheManager,
    private writer: (key: Key, value: T) => Promise<void>,
    private ttl?: number,
  ) {}

  async set(key: Key, value: T): Promise<void> {
    // Write to both cache and storage
    await Promise.all([
      this.cache.set(key, value, this.ttl),
      this.writer(key, value),
    ])
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }
}

/**
 * Write-behind (write-back) cache pattern
 */
export class WriteBehindPattern<T> {
  private queue: Map<string, { key: Key, value: T }> = new Map()
  private flushInterval?: NodeJS.Timeout

  constructor(
    private cache: CacheManager,
    private writer: (entries: Array<{ key: Key, value: T }>) => Promise<void>,
    private ttl?: number,
    private flushIntervalMs = 5000,
  ) {
    this.startFlushInterval()
  }

  async set(key: Key, value: T): Promise<void> {
    // Write to cache immediately
    await this.cache.set(key, value, this.ttl)

    // Queue for background write
    this.queue.set(key.toString(), { key, value })
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }

  async flush(): Promise<void> {
    if (this.queue.size === 0) {
      return
    }

    const entries = Array.from(this.queue.values())
    this.queue.clear()

    await this.writer(entries)
  }

  close(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(async () => {
      await this.flush()
    }, this.flushIntervalMs) as NodeJS.Timeout

    if (this.flushInterval && typeof this.flushInterval.unref === 'function') {
      this.flushInterval.unref()
    }
  }
}

/**
 * Refresh-ahead cache pattern
 */
export class RefreshAheadPattern<T> {
  private refreshThreshold: number

  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl: number,
    thresholdPercentage = 0.8, // Refresh when 80% of TTL has passed
  ) {
    this.refreshThreshold = ttl * thresholdPercentage
  }

  async get(key: Key): Promise<T | undefined> {
    const value = await this.cache.get<T>(key)

    if (value !== undefined) {
      // Check if we should refresh
      const ttl = await this.cache.getTtl(key)

      if (ttl !== undefined) {
        const timeRemaining = (ttl - Date.now()) / 1000

        if (timeRemaining < this.refreshThreshold) {
          // Refresh in background
          this.refreshInBackground(key)
        }
      }

      return value
    }

    // Load if not in cache
    const freshValue = await this.loader(key)
    await this.cache.set(key, freshValue, this.ttl)
    return freshValue
  }

  private async refreshInBackground(key: Key): Promise<void> {
    try {
      const freshValue = await this.loader(key)
      await this.cache.set(key, freshValue, this.ttl)
    }
    catch (error) {
      // Ignore errors in background refresh
      console.error('Background refresh failed:', error)
    }
  }
}

/**
 * Multi-level cache pattern
 */
export class MultiLevelPattern<T> {
  constructor(
    private levels: CacheManager[],
    private ttls?: number[],
  ) {
    if (ttls && ttls.length !== levels.length) {
      throw new Error('TTLs array must match levels array length')
    }
  }

  async get(key: Key): Promise<T | undefined> {
    for (let i = 0; i < this.levels.length; i++) {
      const value = await this.levels[i].get<T>(key)

      if (value !== undefined) {
        // Populate higher levels
        for (let j = 0; j < i; j++) {
          const ttl = this.ttls?.[j]
          await this.levels[j].set(key, value, ttl)
        }

        return value
      }
    }

    return undefined
  }

  async set(key: Key, value: T): Promise<void> {
    // Write to all levels
    const promises = this.levels.map((level, i) => {
      const ttl = this.ttls?.[i]
      return level.set(key, value, ttl)
    })

    await Promise.all(promises)
  }

  async del(key: Key): Promise<void> {
    // Delete from all levels
    await Promise.all(
      this.levels.map(level => level.del(key)),
    )
  }
}

/**
 * Cache warming pattern
 */
export class CacheWarmingPattern<T> {
  constructor(
    private cache: CacheManager,
    private loader: (keys: Key[]) => Promise<Map<Key, T>>,
    private ttl?: number,
  ) {}

  async warmUp(keys: Key[]): Promise<void> {
    const data = await this.loader(keys)

    const entries = Array.from(data.entries()).map(([key, value]) => ({
      key,
      value,
      ttl: this.ttl,
    }))

    await this.cache.mset(entries)
  }

  async warmUpSingle(key: Key, loader?: (key: Key) => Promise<T>): Promise<void> {
    const value = loader
      ? await loader(key)
      : (await this.loader([key])).get(key)

    if (value !== undefined) {
      await this.cache.set(key, value, this.ttl)
    }
  }
}

/**
 * Sliding window cache pattern
 */
export class SlidingWindowPattern<T> {
  constructor(
    private cache: CacheManager,
    private ttl: number,
  ) {}

  async get(key: Key): Promise<T | undefined> {
    const value = await this.cache.get<T>(key)

    if (value !== undefined) {
      // Reset TTL on access (sliding window)
      await this.cache.ttl(key, this.ttl)
    }

    return value
  }

  async set(key: Key, value: T): Promise<void> {
    await this.cache.set(key, value, this.ttl)
  }
}

/**
 * Probabilistic early expiration pattern
 */
export class ProbabilisticExpirationPattern<T> {
  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl: number,
    private beta = 1.0, // Controls aggressiveness of early expiration
  ) {}

  async get(key: Key): Promise<T> {
    const value = await this.cache.get<T>(key)

    if (value !== undefined) {
      const currentTtl = await this.cache.getTtl(key)

      if (currentTtl !== undefined) {
        const timeRemaining = (currentTtl - Date.now()) / 1000
        const delta = this.ttl - timeRemaining

        // Probabilistic early expiration
        const xfetch = delta * this.beta * Math.log(Math.random())

        if (timeRemaining <= xfetch) {
          // Refresh early
          const freshValue = await this.loader(key)
          await this.cache.set(key, freshValue, this.ttl)
          return freshValue
        }
      }

      return value
    }

    // Load if not in cache
    const freshValue = await this.loader(key)
    await this.cache.set(key, freshValue, this.ttl)
    return freshValue
  }
}

/**
 * Bulk loading pattern
 */
export class BulkLoadingPattern<T> {
  private pendingKeys: Set<Key> = new Set()
  private batchTimeout?: NodeJS.Timeout

  constructor(
    private cache: CacheManager,
    private loader: (keys: Key[]) => Promise<Map<Key, T>>,
    private ttl?: number,
    private maxBatchSize = 100,
    private batchWindowMs = 10,
  ) {}

  async get(key: Key): Promise<T | undefined> {
    // Check cache first
    const cached = await this.cache.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Add to pending batch
    this.pendingKeys.add(key)

    // Schedule batch load
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.executeBatch()
      }, this.batchWindowMs) as NodeJS.Timeout
    }

    // Force load if batch is full
    if (this.pendingKeys.size >= this.maxBatchSize) {
      await this.executeBatch()
    }

    // Return from cache after batch load
    return await this.cache.get<T>(key)
  }

  private async executeBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = undefined
    }

    if (this.pendingKeys.size === 0) {
      return
    }

    const keys = Array.from(this.pendingKeys)
    this.pendingKeys.clear()

    try {
      const data = await this.loader(keys)

      const entries = Array.from(data.entries()).map(([key, value]) => ({
        key,
        value,
        ttl: this.ttl,
      }))

      await this.cache.mset(entries)
    }
    catch (error) {
      console.error('Bulk load failed:', error)
    }
  }
}

/**
 * Write-around cache pattern
 */
export class WriteAroundPattern<T> {
  constructor(
    private cache: CacheManager,
    private writer: (key: Key, value: T) => Promise<void>,
  ) {}

  async set(key: Key, value: T): Promise<void> {
    // Write to storage first
    await this.writer(key, value)

    // Invalidate cache to prevent stale reads
    await this.cache.del(key)
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }
}

// Simplified aliases for common patterns
export class CacheAside<T = any> {
  constructor(
    private cache: CacheManager,
  ) {}

  async get(key: Key, loader: (key: Key) => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.cache.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await loader(key)
    await this.cache.set(key, value, ttl)
    return value
  }

  async invalidate(key: Key): Promise<void> {
    await this.cache.del(key)
  }
}

export class ReadThrough<T = any> {
  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl?: number,
  ) {}

  async get(key: Key): Promise<T> {
    return await this.cache.fetch(key, () => this.loader(key), this.ttl)
  }
}

export class WriteThrough<T = any> {
  constructor(
    private cache: CacheManager,
    private writer: (key: Key, value: T) => Promise<void>,
  ) {}

  async set(key: Key, value: T, ttl?: number): Promise<void> {
    await Promise.all([
      this.cache.set(key, value, ttl),
      this.writer(key, value),
    ])
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }
}

export class WriteAround<T = any> {
  constructor(
    private cache: CacheManager,
    private writer: (key: Key, value: T) => Promise<void>,
  ) {}

  async set(key: Key, value: T): Promise<void> {
    await this.writer(key, value)
    await this.cache.del(key)
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }
}

export class WriteBack<T = any> {
  private pending: Map<string, T> = new Map()
  private timeout?: NodeJS.Timeout

  constructor(
    private cache: CacheManager,
    private writer: (key: Key, value: T) => Promise<void>,
    private delay: number = 1000,
  ) {}

  async set(key: Key, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl)
    this.pending.set(key.toString(), value)

    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(async () => {
      await this.flush()
    }, this.delay) as NodeJS.Timeout
  }

  async get(key: Key): Promise<T | undefined> {
    return await this.cache.get<T>(key)
  }

  async flush(): Promise<void> {
    const entries = Array.from(this.pending.entries())
    this.pending.clear()

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = undefined
    }

    for (const [key, value] of entries) {
      await this.writer(key, value)
    }
  }
}

export class RefreshAhead<T = any> {
  private refreshThreshold: number
  private refreshing: Set<string> = new Set()

  constructor(
    private cache: CacheManager,
    private loader: (key: Key) => Promise<T>,
    private ttl: number,
    thresholdPercentage = 0.8,
  ) {
    this.refreshThreshold = ttl * thresholdPercentage
  }

  async get(key: Key): Promise<T | undefined> {
    const value = await this.cache.get<T>(key)

    if (value !== undefined) {
      const currentTtl = await this.cache.getTtl(key)

      if (currentTtl !== undefined) {
        const timeRemaining = (currentTtl - Date.now()) / 1000

        if (timeRemaining < this.refreshThreshold && !this.refreshing.has(key.toString())) {
          this.refreshing.add(key.toString())
          // Refresh in background
          this.refreshInBackground(key).finally(() => {
            this.refreshing.delete(key.toString())
          })
        }
      }

      return value
    }

    // Load if not in cache
    const freshValue = await this.loader(key)
    await this.cache.set(key, freshValue, this.ttl)
    return freshValue
  }

  private async refreshInBackground(key: Key): Promise<void> {
    try {
      const freshValue = await this.loader(key)
      await this.cache.set(key, freshValue, this.ttl)
    }
    catch (error) {
      console.error('Background refresh failed:', error)
    }
  }
}
