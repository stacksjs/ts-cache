import type { CacheManager } from '../manager'
import type { Key } from '../types'

/**
 * Rate limiter utility using cache
 */
export class RateLimiter {
  constructor(
    private cache: CacheManager,
    private maxAttempts: number,
    private windowSeconds: number,
  ) {}

  /**
   * Check if an action is rate limited
   * @returns Object with limited status and remaining attempts
   */
  async check(identifier: string): Promise<{
    limited: boolean
    remaining: number
    resetAt: number
  }> {
    const key = `ratelimit:${identifier}`
    const current = await this.cache.get<number>(key) ?? 0

    if (current >= this.maxAttempts) {
      const ttl = await this.cache.getTtl(key)
      return {
        limited: true,
        remaining: 0,
        resetAt: ttl ?? Date.now() + (this.windowSeconds * 1000),
      }
    }

    await this.cache.set(key, current + 1, this.windowSeconds)

    return {
      limited: false,
      remaining: this.maxAttempts - current - 1,
      resetAt: Date.now() + (this.windowSeconds * 1000),
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    await this.cache.del(`ratelimit:${identifier}`)
  }
}

/**
 * Cache lock utility for distributed locking
 */
export class CacheLock {
  constructor(
    private cache: CacheManager,
    private lockTimeout: number = 30,
  ) {}

  /**
   * Acquire a lock
   */
  async acquire(resource: string, ttl?: number): Promise<boolean> {
    const key = `lock:${resource}`
    const hasLock = await this.cache.has(key)

    if (hasLock) {
      return false
    }

    await this.cache.set(key, Date.now(), ttl ?? this.lockTimeout)
    return true
  }

  /**
   * Release a lock
   */
  async release(resource: string): Promise<void> {
    await this.cache.del(`lock:${resource}`)
  }

  /**
   * Execute a callback with a lock
   */
  async withLock<T>(
    resource: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T | null> {
    const acquired = await this.acquire(resource, ttl)

    if (!acquired) {
      return null
    }

    try {
      return await callback()
    }
    finally {
      await this.release(resource)
    }
  }
}

/**
 * Cache warmer utility for preloading cache
 */
export class CacheWarmer {
  constructor(private cache: CacheManager) {}

  /**
   * Warm cache with multiple entries
   */
  async warm<T>(entries: Array<{
    key: Key
    fetcher: () => T | Promise<T>
    ttl?: number
    tags?: string[]
  }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, ttl, tags }) => {
      const value = await fetcher()
      await this.cache.set(key, value, ttl)

      if (tags && tags.length > 0) {
        await this.cache.tag(key, tags)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Warm cache from an array of data
   */
  async warmFromArray<T>(
    data: T[],
    keyExtractor: (item: T) => Key,
    ttl?: number,
  ): Promise<void> {
    const entries = data.map(item => ({
      key: keyExtractor(item),
      value: item,
      ttl,
    }))

    await this.cache.mset(entries)
  }
}

/**
 * Cache middleware for automatic caching
 */
export function cacheMiddleware<TArgs extends any[], TReturn>(
  cache: CacheManager,
  keyGenerator: (...args: TArgs) => Key,
  ttl?: number,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: TArgs): Promise<TReturn> {
      const key = keyGenerator(...args)
      const cached = await cache.get<TReturn>(key)

      if (cached !== undefined) {
        return cached
      }

      const result = await originalMethod.apply(this, args)
      await cache.set(key, result, ttl)

      return result
    }

    return descriptor
  }
}

/**
 * Batch operations utility
 */
export class BatchOperations {
  constructor(
    private cache: CacheManager,
    private batchSize: number = 100,
  ) {}

  /**
   * Get values in batches
   */
  async* getBatch<T>(keys: Key[]): AsyncGenerator<Record<string, T>> {
    for (let i = 0; i < keys.length; i += this.batchSize) {
      const batch = keys.slice(i, i + this.batchSize)
      const result = await this.cache.mget<T>(batch)
      yield result
    }
  }

  /**
   * Set values in batches
   */
  async setBatch<T>(
    entries: Array<{ key: Key, value: T, ttl?: number }>,
  ): Promise<void> {
    for (let i = 0; i < entries.length; i += this.batchSize) {
      const batch = entries.slice(i, i + this.batchSize)
      await this.cache.mset(batch)
    }
  }

  /**
   * Delete keys in batches
   */
  async deleteBatch(keys: Key[]): Promise<number> {
    let total = 0

    for (let i = 0; i < keys.length; i += this.batchSize) {
      const batch = keys.slice(i, i + this.batchSize)
      total += await this.cache.del(batch)
    }

    return total
  }
}

/**
 * Time-based cache invalidation
 */
export class CacheInvalidation {
  constructor(private cache: CacheManager) {}

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const keys = await this.cache.keys(pattern)
    if (keys.length === 0)
      return 0

    return await this.cache.del(keys)
  }

  /**
   * Invalidate cache by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    return await this.invalidateByPattern(`${prefix}*`)
  }

  /**
   * Invalidate multiple patterns
   */
  async invalidateByPatterns(patterns: string[]): Promise<number> {
    let total = 0

    for (const pattern of patterns) {
      total += await this.invalidateByPattern(pattern)
    }

    return total
  }
}

/**
 * Create a memoized function using cache
 */
export function memoize<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  cache: CacheManager,
  options: {
    keyGenerator?: (...args: TArgs) => Key
    ttl?: number
    tags?: string[]
  } = {},
): (...args: TArgs) => Promise<TReturn> {
  const keyGenerator = options.keyGenerator ?? ((...args: TArgs) => {
    return `memoized:${fn.name}:${JSON.stringify(args)}`
  })

  return async (...args: TArgs): Promise<TReturn> => {
    const key = keyGenerator(...args)
    const cached = await cache.get<TReturn>(key)

    if (cached !== undefined) {
      return cached
    }

    const result = await fn(...args)
    await cache.set(key, result, options.ttl)

    if (options.tags && options.tags.length > 0) {
      await cache.tag(key, options.tags)
    }

    return result
  }
}

/**
 * Debounced cache setter
 */
export class DebouncedCache {
  private timeouts = new Map<string, NodeJS.Timeout>()

  constructor(
    private cache: CacheManager,
    private delay: number = 1000,
  ) {}

  /**
   * Set a value with debouncing
   */
  set<T>(key: Key, value: T, ttl?: number): void {
    const keyStr = key.toString()

    // Clear existing timeout
    if (this.timeouts.has(keyStr)) {
      clearTimeout(this.timeouts.get(keyStr)!)
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.cache.set(key, value, ttl)
      this.timeouts.delete(keyStr)
    }, this.delay) as NodeJS.Timeout

    this.timeouts.set(keyStr, timeout)
  }

  /**
   * Flush pending writes immediately
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout)
    }

    this.timeouts.clear()
    await Promise.all(promises)
  }
}

/**
 * Circuit breaker pattern using cache
 */
export class CircuitBreaker {
  private failureKey: (resource: string) => string = resource => `circuit:failures:${resource}`
  private stateKey: (resource: string) => string = resource => `circuit:state:${resource}`

  constructor(
    private cache: CacheManager,
    private threshold: number = 5,
    private timeout: number = 60,
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    resource: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    // Check if circuit is open
    const state = await this.cache.get<string>(this.stateKey(resource))

    if (state === 'open') {
      throw new Error(`Circuit breaker is open for resource: ${resource}`)
    }

    try {
      const result = await fn()

      // Reset failure count on success
      await this.cache.del(this.failureKey(resource))

      return result
    }
    catch (error) {
      // Increment failure count
      const failures = (await this.cache.get<number>(this.failureKey(resource)) ?? 0) + 1
      await this.cache.set(this.failureKey(resource), failures, this.timeout)

      // Open circuit if threshold exceeded
      if (failures >= this.threshold) {
        await this.cache.set(this.stateKey(resource), 'open', this.timeout)
      }

      throw error
    }
  }

  /**
   * Reset circuit breaker for a resource
   */
  async reset(resource: string): Promise<void> {
    await this.cache.del([this.failureKey(resource), this.stateKey(resource)])
  }
}
