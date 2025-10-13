import type { CacheManager } from '../manager'
import type { Key } from '../types'

/**
 * Middleware context
 */
export interface MiddlewareContext<T = any> {
  key: Key
  value?: T
  ttl?: number
  operation: 'get' | 'set' | 'del' | 'has' | 'flush'
  result?: any
  metadata?: Record<string, any>
}

/**
 * Middleware function type
 */
export type Middleware = (
  context: MiddlewareContext,
  next: () => Promise<any>,
) => Promise<any>

/**
 * Cache middleware manager
 */
export class MiddlewareManager {
  private middlewares: Middleware[] = []

  /**
   * Add middleware to the stack
   */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * Execute middleware chain
   */
  async execute(
    context: MiddlewareContext,
    finalHandler: () => Promise<any>,
  ): Promise<any> {
    let index = 0

    const next = async (): Promise<any> => {
      if (index >= this.middlewares.length) {
        return await finalHandler()
      }

      const middleware = this.middlewares[index++]
      return await middleware(context, next)
    }

    return await next()
  }
}

/**
 * Logging middleware
 */
export function loggingMiddleware(logger: Console = console): Middleware {
  return async (context, next) => {
    const start = Date.now()
    logger.log(`[Cache] ${context.operation} ${context.key}`)

    try {
      const result = await next()
      const duration = Date.now() - start
      logger.log(`[Cache] ${context.operation} ${context.key} completed in ${duration}ms`)
      return result
    }
    catch (error) {
      const duration = Date.now() - start
      logger.error(`[Cache] ${context.operation} ${context.key} failed after ${duration}ms:`, error)
      throw error
    }
  }
}

/**
 * Timing/metrics middleware
 */
export function metricsMiddleware(
  onMetric: (operation: string, key: string, duration: number) => void,
): Middleware {
  return async (context, next) => {
    const start = Date.now()

    try {
      const result = await next()
      const duration = Date.now() - start
      onMetric(context.operation, context.key.toString(), duration)
      return result
    }
    catch (error) {
      const duration = Date.now() - start
      onMetric(`${context.operation}:error`, context.key.toString(), duration)
      throw error
    }
  }
}

/**
 * Validation middleware
 */
export function validationMiddleware(
  validator: (context: MiddlewareContext) => boolean | Promise<boolean>,
  errorMessage = 'Validation failed',
): Middleware {
  return async (context, next) => {
    const isValid = await validator(context)

    if (!isValid) {
      throw new Error(errorMessage)
    }

    return await next()
  }
}

/**
 * Transform middleware (modify values before set/after get)
 */
export function transformMiddleware(
  transformer: (value: any, operation: 'get' | 'set') => any | Promise<any>,
): Middleware {
  return async (context, next) => {
    // Transform before set
    if (context.operation === 'set' && context.value !== undefined) {
      context.value = await transformer(context.value, 'set')
    }

    const result = await next()

    // Transform after get
    if (context.operation === 'get' && result !== undefined) {
      return await transformer(result, 'get')
    }

    return result
  }
}

/**
 * Caching with fallback middleware
 */
export function fallbackMiddleware<T>(
  fallbackFn: (key: Key) => T | Promise<T>,
): Middleware {
  return async (context, next) => {
    if (context.operation === 'get') {
      const result = await next()

      if (result === undefined) {
        return await fallbackFn(context.key)
      }

      return result
    }

    return await next()
  }
}

/**
 * Retry middleware with exponential backoff
 */
export function retryMiddleware(
  maxRetries = 3,
  initialDelay = 100,
  maxDelay = 5000,
): Middleware {
  return async (context, next) => {
    let lastError: Error | undefined
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await next()
      }
      catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay = Math.min(delay * 2, maxDelay)
        }
      }
    }

    throw lastError
  }
}

/**
 * Cache key prefix middleware
 */
export function keyPrefixMiddleware(prefix: string): Middleware {
  return async (context, next) => {
    const originalKey = context.key
    context.key = `${prefix}:${originalKey}`

    try {
      return await next()
    }
    finally {
      context.key = originalKey
    }
  }
}

/**
 * TTL override middleware
 */
export function ttlMiddleware(defaultTTL: number): Middleware {
  return async (context, next) => {
    if (context.operation === 'set' && context.ttl === undefined) {
      context.ttl = defaultTTL
    }

    return await next()
  }
}

/**
 * Conditional caching middleware
 */
export function conditionalMiddleware(
  condition: (context: MiddlewareContext) => boolean | Promise<boolean>,
): Middleware {
  return async (context, next) => {
    const shouldCache = await condition(context)

    if (!shouldCache && context.operation === 'set') {
      // Skip caching
      return true
    }

    return await next()
  }
}

/**
 * Stale-while-revalidate middleware
 */
export function staleWhileRevalidateMiddleware<T>(
  cache: CacheManager,
  revalidate: (key: Key) => Promise<T>,
  staleTime: number = 60,
): Middleware {
  return async (context, next) => {
    if (context.operation === 'get') {
      const result = await next()

      if (result !== undefined) {
        // Check if stale
        const ttl = await cache.getTtl(context.key)

        if (ttl !== undefined) {
          const timeUntilExpiry = ttl - Date.now()
          const isStale = timeUntilExpiry < (staleTime * 1000)

          if (isStale) {
            // Revalidate in background
            revalidate(context.key)
              .then(newValue => cache.set(context.key, newValue, context.ttl))
              .catch(() => {
                // Ignore revalidation errors
              })
          }
        }
      }

      return result
    }

    return await next()
  }
}

/**
 * Cache stamped middleware (prevent cache stampede)
 */
export function cacheStampedMiddleware<T>(
  cache: CacheManager,
  fetchFn: (key: Key) => Promise<T>,
  _lockTTL: number = 30,
): Middleware {
  const locks = new Set<string>()

  return async (context, next) => {
    if (context.operation === 'get') {
      const result = await next()

      if (result !== undefined) {
        return result
      }

      const lockKey = `lock:${context.key}`

      // Check if someone else is fetching
      if (locks.has(lockKey.toString())) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100))
        return await cache.get(context.key)
      }

      // Acquire lock
      locks.add(lockKey.toString())

      try {
        // Double-check cache
        const cached = await cache.get<T>(context.key)
        if (cached !== undefined) {
          return cached
        }

        // Fetch fresh data
        const freshData = await fetchFn(context.key)
        await cache.set(context.key, freshData, context.ttl)

        return freshData
      }
      finally {
        // Release lock
        locks.delete(lockKey.toString())
      }
    }

    return await next()
  }
}

/**
 * Encryption middleware
 */
export function encryptionMiddleware(
  encrypt: (data: string) => string | Promise<string>,
  decrypt: (data: string) => string | Promise<string>,
): Middleware {
  return async (context, next) => {
    // Encrypt before set
    if (context.operation === 'set' && typeof context.value === 'string') {
      context.value = await encrypt(context.value)
    }

    const result = await next()

    // Decrypt after get
    if (context.operation === 'get' && typeof result === 'string') {
      return await decrypt(result)
    }

    return result
  }
}

/**
 * Create a middleware-enabled cache wrapper
 */
export function createMiddlewareCache(cache: CacheManager): CacheManager & { middleware: MiddlewareManager } {
  const middleware = new MiddlewareManager()

  const wrappedCache = new Proxy(cache, {
    get(target, prop) {
      if (prop === 'middleware') {
        return middleware
      }

      const original = target[prop as keyof CacheManager]

      if (typeof original !== 'function') {
        return original
      }

      // Wrap cache methods with middleware
      if (['get', 'set', 'del', 'has', 'flush'].includes(prop as string)) {
        return async function (this: CacheManager, ...args: any[]) {
          const context: MiddlewareContext = {
            key: args[0],
            value: args[1],
            ttl: args[2],
            operation: prop as any,
          }

          return await middleware.execute(context, async () => {
            return await (original as any).apply(target, args)
          })
        }
      }

      return original
    },
  }) as CacheManager & { middleware: MiddlewareManager }

  return wrappedCache
}
