import type { EventEmitter } from 'node:events'

export interface CacheConfig {
  // ============================================================
  // General Settings
  // ============================================================

  /**
   * Enable verbose logging
   */
  verbose?: boolean

  /**
   * Cache driver to use
   * @default 'memory'
   */
  driver?: 'memory' | 'memory-lru' | 'redis'

  /**
   * Cache key prefix for namespacing
   */
  prefix?: string

  // ============================================================
  // Memory Driver Settings (Legacy Cache)
  // ============================================================

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
   * Enable legacy callbacks
   */
  enableLegacyCallbacks?: boolean

  // ============================================================
  // Common Cache Settings (All Drivers)
  // ============================================================

  /**
   * Standard time to live in seconds. 0 = infinity
   * @default 0
   */
  stdTTL?: number

  /**
   * Time in seconds to check all data and delete expired keys
   * @default 600
   */
  checkPeriod?: number

  /**
   * En/disable cloning of variables.
   * If `true` you'll get a copy of the cached variable.
   * If `false` you'll save and get just the reference
   * @default true
   */
  useClones?: boolean

  /**
   * Whether values should be deleted automatically at expiration
   * @default true
   */
  deleteOnExpire?: boolean

  /**
   * Max amount of keys that are being stored
   * @default -1 (unlimited for memory, 1000 for memory-lru)
   */
  maxKeys?: number

  // ============================================================
  // Redis Driver Settings
  // ============================================================

  /**
   * Redis connection URL
   * @example 'redis://localhost:6379'
   */
  redis?: {
    /**
     * Redis connection URL (overrides host/port)
     */
    url?: string

    /**
     * Redis host
     * @default 'localhost'
     */
    host?: string

    /**
     * Redis port
     * @default 6379
     */
    port?: number

    /**
     * Redis password
     */
    password?: string

    /**
     * Redis database number
     * @default 0
     */
    database?: number

    /**
     * Connection timeout in milliseconds
     * @default 10000
     */
    connectionTimeout?: number

    /**
     * Enable auto-reconnect
     * @default true
     */
    autoReconnect?: boolean

    /**
     * Maximum retry attempts
     * @default 10
     */
    maxRetries?: number

    /**
     * Enable TLS
     * @default false
     */
    tls?: boolean
  }

  // ============================================================
  // Serialization & Compression
  // ============================================================

  /**
   * Serializer name or custom serializer
   * Built-in: 'json' | 'msgpack' | 'none'
   * @default 'json' for Redis, 'none' for memory
   */
  serializer?: 'json' | 'msgpack' | 'none'

  /**
   * Compression configuration
   */
  compression?: {
    /**
     * Compression algorithm
     * @default 'none'
     */
    algorithm?: 'gzip' | 'brotli' | 'smart' | 'none'

    /**
     * Compression level
     * - gzip: 0-9 (6 is default)
     * - brotli: 0-11 (6 is default)
     */
    level?: number

    /**
     * Minimum size in bytes to trigger compression
     * @default 1024
     */
    threshold?: number

    /**
     * Enable compression
     * @default false
     */
    enabled?: boolean
  }

  /**
   * Enable compression (legacy, use compression.enabled instead)
   * @deprecated Use compression.enabled
   * @default false
   */
  enableCompression?: boolean

  // ============================================================
  // Middleware Configuration
  // ============================================================

  middleware?: {
    /**
     * Enable middleware system
     * @default false
     */
    enabled?: boolean

    /**
     * Enable logging middleware
     */
    logging?: boolean | {
      logger?: 'console' | Console
    }

    /**
     * Enable metrics middleware
     */
    metrics?: boolean | {
      onMetric?: (operation: string, key: string, duration: number) => void
    }

    /**
     * Retry middleware configuration
     */
    retry?: {
      enabled?: boolean
      maxRetries?: number
      initialDelay?: number
      maxDelay?: number
    }

    /**
     * Encryption middleware configuration
     */
    encryption?: {
      enabled?: boolean
      encrypt?: (data: string) => string | Promise<string>
      decrypt?: (data: string) => string | Promise<string>
    }
  }

  // ============================================================
  // Caching Patterns Configuration
  // ============================================================

  patterns?: {
    /**
     * Cache-aside pattern defaults
     */
    cacheAside?: {
      ttl?: number
    }

    /**
     * Read-through pattern defaults
     */
    readThrough?: {
      ttl?: number
    }

    /**
     * Write-through pattern defaults
     */
    writeThrough?: {
      ttl?: number
    }

    /**
     * Write-behind pattern defaults
     */
    writeBehind?: {
      ttl?: number
      flushInterval?: number
    }

    /**
     * Refresh-ahead pattern defaults
     */
    refreshAhead?: {
      ttl?: number
      thresholdPercentage?: number
    }

    /**
     * Sliding window pattern defaults
     */
    slidingWindow?: {
      ttl?: number
    }
  }

  // ============================================================
  // Event/Hook Configuration
  // ============================================================

  events?: {
    /**
     * Called when a value is set
     */
    onSet?: (key: Key, value: any, ttl?: number) => void

    /**
     * Called when a value is retrieved
     */
    onGet?: (key: Key, value: any) => void

    /**
     * Called on cache miss
     */
    onMiss?: (key: Key) => void

    /**
     * Called on cache hit
     */
    onHit?: (key: Key, value: any) => void

    /**
     * Called when a key is deleted
     */
    onDelete?: (key: Key) => void

    /**
     * Called when cache is flushed
     */
    onFlush?: () => void

    /**
     * Called when an error occurs
     */
    onError?: (error: Error, operation: string, key?: Key) => void

    /**
     * Called when a key expires
     */
    onExpire?: (key: Key, value: any) => void
  }

  // ============================================================
  // Performance Tuning
  // ============================================================

  performance?: {
    /**
     * Enable statistics tracking
     * @default true
     */
    enableStats?: boolean

    /**
     * Interval for updating metrics (ms)
     * @default 60000
     */
    metricsInterval?: number

    /**
     * Cache warming configuration
     */
    warmup?: {
      enabled?: boolean
      keys?: Key[]
      loader?: (keys: Key[]) => Promise<Map<Key, any>>
    }

    /**
     * Batch size for bulk operations
     * @default 100
     */
    batchSize?: number

    /**
     * Batch window in milliseconds
     * @default 10
     */
    batchWindow?: number
  }

  // ============================================================
  // Multi-Level Cache
  // ============================================================

  multiLevel?: {
    /**
     * Enable multi-level caching
     * @default false
     */
    enabled?: boolean

    /**
     * Cache levels (L1, L2, L3, etc.)
     */
    levels?: Array<{
      driver: 'memory' | 'memory-lru' | 'redis'
      ttl?: number
      maxKeys?: number
      prefix?: string
    }>
  }

  // ============================================================
  // Key Transformation
  // ============================================================

  keyTransform?: {
    /**
     * Normalize keys (lowercase, trim)
     * @default false
     */
    normalize?: boolean

    /**
     * Hash long keys to prevent key size issues
     * @default false
     */
    hash?: boolean

    /**
     * Sanitize keys (remove special chars)
     * @default false
     */
    sanitize?: boolean

    /**
     * Maximum key length before hashing
     * @default 250
     */
    maxLength?: number

    /**
     * Custom key transformer function
     */
    transform?: (key: Key) => Key
  }

  // ============================================================
  // Namespace/Tenant Support
  // ============================================================

  namespace?: {
    /**
     * Enable namespace support
     * @default false
     */
    enabled?: boolean

    /**
     * Namespace separator
     * @default ':'
     */
    separator?: string

    /**
     * Default namespace
     */
    default?: string

    /**
     * Allow dynamic namespace creation
     * @default true
     */
    allowDynamic?: boolean
  }

  // ============================================================
  // TTL Strategies
  // ============================================================

  ttlStrategy?: {
    /**
     * TTL mode
     * - fixed: Standard TTL
     * - sliding: Reset TTL on access
     * - probabilistic: Probabilistic early expiration
     * @default 'fixed'
     */
    mode?: 'fixed' | 'sliding' | 'probabilistic'

    /**
     * Beta parameter for probabilistic expiration
     * @default 1.0
     */
    beta?: number

    /**
     * Add random jitter to TTL (prevents thundering herd)
     * Value between 0-1 (0 = no jitter, 1 = up to 100% jitter)
     * @default 0
     */
    jitter?: number
  }

  // ============================================================
  // Error Handling
  // ============================================================

  errorHandling?: {
    /**
     * Throw errors or return undefined
     * @default false
     */
    throwOnError?: boolean

    /**
     * Fallback value on error
     */
    fallbackValue?: any

    /**
     * Retry on error
     * @default false
     */
    retryOnError?: boolean

    /**
     * Circuit breaker configuration
     */
    circuitBreaker?: {
      enabled?: boolean
      threshold?: number
      timeout?: number
      resetTimeout?: number
    }
  }

  // ============================================================
  // Development/Debug Options
  // ============================================================

  debug?: {
    /**
     * Enable debug mode
     * @default false
     */
    enabled?: boolean

    /**
     * Log level
     * @default 'info'
     */
    logLevel?: 'debug' | 'info' | 'warn' | 'error'

    /**
     * Track key access patterns
     * @default false
     */
    trackAccess?: boolean

    /**
     * Validate keys
     * @default false
     */
    validateKeys?: boolean

    /**
     * Validate values
     * @default false
     */
    validateValues?: boolean

    /**
     * Log operations to console
     * @default false
     */
    logOperations?: boolean
  }
}

export type CacheOptions = Partial<CacheConfig>

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
  checkPeriod?: number

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
export interface Cache extends EventEmitter {
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
