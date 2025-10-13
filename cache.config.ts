import type { CacheConfig } from './src/types'

const config: CacheConfig = {
  // ============================================================
  // General Settings
  // ============================================================

  /**
   * Enable verbose logging for debugging
   */
  verbose: true,

  /**
   * Cache driver to use
   * Options: 'memory' | 'memory-lru' | 'redis'
   */
  // driver: 'memory',

  /**
   * Global cache key prefix for namespacing
   */
  // prefix: 'myapp',

  // ============================================================
  // Memory Driver Settings (Legacy Cache)
  // ============================================================

  /**
   * Force all values to be converted to strings
   */
  // forceString: false,

  /**
   * Size estimation for different value types (in bytes)
   */
  // objectValueSize: 80,
  // promiseValueSize: 80,
  // arrayValueSize: 40,

  /**
   * Enable legacy callback-based API
   */
  // enableLegacyCallbacks: false,

  // ============================================================
  // Common Cache Settings (All Drivers)
  // ============================================================

  /**
   * Standard time to live in seconds
   * 0 = infinity (no expiration)
   */
  // stdTTL: 0,

  /**
   * Time in seconds to check for and delete expired keys
   * Set to 0 to disable periodic checks
   */
  // checkPeriod: 600,

  /**
   * Enable cloning of cached values
   * true = returns a copy (safer)
   * false = returns reference (faster but mutable)
   */
  // useClones: true,

  /**
   * Automatically delete keys when they expire
   */
  // deleteOnExpire: true,

  /**
   * Maximum number of keys to store
   * -1 = unlimited (for memory driver)
   * 1000 = default for memory-lru driver
   */
  // maxKeys: -1,

  // ============================================================
  // Redis Driver Settings
  // ============================================================

  /**
   * Redis configuration (only used when driver is 'redis')
   */
  // redis: {
  //   /**
  //    * Full Redis connection URL (overrides host/port)
  //    * @example 'redis://localhost:6379'
  //    * @example 'redis://:password@localhost:6379/0'
  //    */
  //   url: process.env.REDIS_URL,
  //
  //   /**
  //    * Redis host (used if url is not provided)
  //    */
  //   host: 'localhost',
  //
  //   /**
  //    * Redis port
  //    */
  //   port: 6379,
  //
  //   /**
  //    * Redis password for authentication
  //    */
  //   password: process.env.REDIS_PASSWORD,
  //
  //   /**
  //    * Redis database number (0-15)
  //    */
  //   database: 0,
  //
  //   /**
  //    * Connection timeout in milliseconds
  //    */
  //   connectionTimeout: 10000,
  //
  //   /**
  //    * Enable automatic reconnection on connection loss
  //    */
  //   autoReconnect: true,
  //
  //   /**
  //    * Maximum number of retry attempts
  //    */
  //   maxRetries: 10,
  //
  //   /**
  //    * Enable TLS/SSL encryption
  //    */
  //   tls: false,
  // },

  // ============================================================
  // Serialization & Compression
  // ============================================================

  /**
   * Serialization format for cache values
   * Options: 'json' | 'msgpack' | 'none'
   * - 'json': Human-readable, widely compatible
   * - 'msgpack': Binary, more efficient
   * - 'none': No serialization (for simple values)
   */
  // serializer: 'json',

  /**
   * Compression configuration
   */
  // compression: {
  //   /**
  //    * Compression algorithm
  //    * Options: 'gzip' | 'brotli' | 'smart' | 'none'
  //    * - 'gzip': Fast, good compression (level 0-9)
  //    * - 'brotli': Better compression, slower (quality 0-11)
  //    * - 'smart': Only compress if beneficial
  //    * - 'none': No compression
  //    */
  //   algorithm: 'gzip',
  //
  //   /**
  //    * Compression level/quality
  //    * gzip: 0-9, brotli: 0-11
  //    */
  //   level: 6,
  //
  //   /**
  //    * Minimum size in bytes to trigger compression
  //    * Only applies to 'smart' algorithm
  //    */
  //   threshold: 1024,
  //
  //   /**
  //    * Enable compression
  //    */
  //   enabled: false,
  // },

  // ============================================================
  // Middleware Configuration
  // ============================================================

  /**
   * Middleware system for intercepting cache operations
   */
  // middleware: {
  //   /**
  //    * Enable middleware system
  //    */
  //   enabled: true,
  //
  //   /**
  //    * Enable logging middleware
  //    */
  //   logging: true,
  //   // OR with custom logger:
  //   // logging: {
  //   //   logger: console, // or custom logger instance
  //   // },
  //
  //   /**
  //    * Enable metrics/timing middleware
  //    */
  //   metrics: true,
  //   // OR with custom metric handler:
  //   // metrics: {
  //   //   onMetric: (operation, key, duration) => {
  //   //     console.log(`${operation} on ${key} took ${duration}ms`)
  //   //   },
  //   // },
  //
  //   /**
  //    * Retry middleware with exponential backoff
  //    */
  //   retry: {
  //     enabled: true,
  //     maxRetries: 3,
  //     initialDelay: 100,
  //     maxDelay: 5000,
  //   },
  //
  //   /**
  //    * Encryption middleware for sensitive data
  //    */
  //   encryption: {
  //     enabled: false,
  //     encrypt: async (data) => {
  //       // Your encryption logic here
  //       return data
  //     },
  //     decrypt: async (data) => {
  //       // Your decryption logic here
  //       return data
  //     },
  //   },
  // },

  // ============================================================
  // Caching Patterns Configuration
  // ============================================================

  /**
   * Default configuration for caching patterns
   */
  // patterns: {
  //   /**
  //    * Cache-aside (lazy loading) defaults
  //    */
  //   cacheAside: {
  //     ttl: 3600, // 1 hour
  //   },
  //
  //   /**
  //    * Read-through cache defaults
  //    */
  //   readThrough: {
  //     ttl: 3600,
  //   },
  //
  //   /**
  //    * Write-through cache defaults
  //    */
  //   writeThrough: {
  //     ttl: 3600,
  //   },
  //
  //   /**
  //    * Write-behind (write-back) defaults
  //    */
  //   writeBehind: {
  //     ttl: 3600,
  //     flushInterval: 5000, // Flush every 5 seconds
  //   },
  //
  //   /**
  //    * Refresh-ahead pattern defaults
  //    */
  //   refreshAhead: {
  //     ttl: 3600,
  //     thresholdPercentage: 0.8, // Refresh when 80% of TTL has passed
  //   },
  //
  //   /**
  //    * Sliding window pattern defaults
  //    */
  //   slidingWindow: {
  //     ttl: 3600, // Reset TTL on each access
  //   },
  // },

  // ============================================================
  // Event/Hook Configuration
  // ============================================================

  /**
   * Event hooks for cache operations
   */
  // events: {
  //   /**
  //    * Called when a value is set
  //    */
  //   onSet: (key, value, ttl) => {
  //     console.log(`Set ${key}`, { ttl })
  //   },
  //
  //   /**
  //    * Called when a value is retrieved
  //    */
  //   onGet: (key, value) => {
  //     console.log(`Get ${key}`)
  //   },
  //
  //   /**
  //    * Called on cache miss
  //    */
  //   onMiss: (key) => {
  //     console.log(`Miss ${key}`)
  //   },
  //
  //   /**
  //    * Called on cache hit
  //    */
  //   onHit: (key, value) => {
  //     console.log(`Hit ${key}`)
  //   },
  //
  //   /**
  //    * Called when a key is deleted
  //    */
  //   onDelete: (key) => {
  //     console.log(`Deleted ${key}`)
  //   },
  //
  //   /**
  //    * Called when cache is flushed
  //    */
  //   onFlush: () => {
  //     console.log('Cache flushed')
  //   },
  //
  //   /**
  //    * Called when an error occurs
  //    */
  //   onError: (error, operation, key) => {
  //     console.error(`Error during ${operation}`, { key, error })
  //   },
  //
  //   /**
  //    * Called when a key expires
  //    */
  //   onExpire: (key, value) => {
  //     console.log(`Expired ${key}`)
  //   },
  // },

  // ============================================================
  // Performance Tuning
  // ============================================================

  /**
   * Performance optimization settings
   */
  // performance: {
  //   /**
  //    * Enable statistics tracking
  //    */
  //   enableStats: true,
  //
  //   /**
  //    * Metrics update interval in milliseconds
  //    */
  //   metricsInterval: 60000, // 1 minute
  //
  //   /**
  //    * Cache warming (pre-populate cache on startup)
  //    */
  //   warmup: {
  //     enabled: true,
  //     keys: ['popular:item:1', 'popular:item:2'],
  //     loader: async (keys) => {
  //       // Your data loading logic
  //       const data = new Map()
  //       // ... load data for keys
  //       return data
  //     },
  //   },
  //
  //   /**
  //    * Batch size for bulk operations
  //    */
  //   batchSize: 100,
  //
  //   /**
  //    * Batch window in milliseconds (for bulk loading pattern)
  //    */
  //   batchWindow: 10,
  // },

  // ============================================================
  // Multi-Level Cache
  // ============================================================

  /**
   * Multi-level caching (L1, L2, L3, etc.)
   * Fast local cache with slower remote cache
   */
  // multiLevel: {
  //   enabled: true,
  //   levels: [
  //     {
  //       // L1: Fast in-memory cache
  //       driver: 'memory',
  //       ttl: 300, // 5 minutes
  //       maxKeys: 1000,
  //       prefix: 'l1',
  //     },
  //     {
  //       // L2: Redis for shared cache across instances
  //       driver: 'redis',
  //       ttl: 3600, // 1 hour
  //       prefix: 'l2',
  //     },
  //   ],
  // },

  // ============================================================
  // Key Transformation
  // ============================================================

  /**
   * Transform cache keys before storage
   */
  // keyTransform: {
  //   /**
  //    * Normalize keys (lowercase, trim whitespace)
  //    */
  //   normalize: true,
  //
  //   /**
  //    * Hash long keys to prevent size issues
  //    */
  //   hash: true,
  //
  //   /**
  //    * Sanitize keys (remove special characters)
  //    */
  //   sanitize: true,
  //
  //   /**
  //    * Maximum key length before hashing
  //    */
  //   maxLength: 250,
  //
  //   /**
  //    * Custom key transformer function
  //    */
  //   transform: (key) => {
  //     // Your custom transformation logic
  //     return key.toString().toLowerCase()
  //   },
  // },

  // ============================================================
  // Namespace/Tenant Support
  // ============================================================

  /**
   * Multi-tenancy support
   */
  // namespace: {
  //   /**
  //    * Enable namespace support
  //    */
  //   enabled: true,
  //
  //   /**
  //    * Namespace separator character
  //    */
  //   separator: ':',
  //
  //   /**
  //    * Default namespace for all keys
  //    */
  //   default: 'tenant1',
  //
  //   /**
  //    * Allow dynamic namespace creation
  //    */
  //   allowDynamic: true,
  // },

  // ============================================================
  // TTL Strategies
  // ============================================================

  /**
   * Advanced TTL strategies
   */
  // ttlStrategy: {
  //   /**
  //    * TTL mode
  //    * - 'fixed': Standard TTL (default)
  //    * - 'sliding': Reset TTL on every access
  //    * - 'probabilistic': Probabilistic early expiration
  //    */
  //   mode: 'sliding',
  //
  //   /**
  //    * Beta parameter for probabilistic expiration
  //    * Higher values = more aggressive early expiration
  //    */
  //   beta: 1.0,
  //
  //   /**
  //    * Add random jitter to TTL (prevents thundering herd)
  //    * 0 = no jitter, 1 = up to 100% jitter
  //    * Example: ttl=100, jitter=0.1 => actual ttl between 100-110
  //    */
  //   jitter: 0.1,
  // },

  // ============================================================
  // Error Handling
  // ============================================================

  /**
   * Error handling configuration
   */
  // errorHandling: {
  //   /**
  //    * Throw errors or fail silently
  //    */
  //   throwOnError: false,
  //
  //   /**
  //    * Fallback value when operation fails
  //    */
  //   fallbackValue: null,
  //
  //   /**
  //    * Automatically retry failed operations
  //    */
  //   retryOnError: true,
  //
  //   /**
  //    * Circuit breaker to prevent cascade failures
  //    */
  //   circuitBreaker: {
  //     enabled: true,
  //     threshold: 5, // Open circuit after 5 failures
  //     timeout: 60000, // Keep circuit open for 60s
  //     resetTimeout: 30000, // Try to close after 30s
  //   },
  // },

  // ============================================================
  // Development/Debug Options
  // ============================================================

  /**
   * Debug and development settings
   */
  // debug: {
  //   /**
  //    * Enable debug mode
  //    */
  //   enabled: true,
  //
  //   /**
  //    * Log level
  //    */
  //   logLevel: 'debug',
  //
  //   /**
  //    * Track which keys are accessed (for optimization)
  //    */
  //   trackAccess: true,
  //
  //   /**
  //    * Validate keys are valid types
  //    */
  //   validateKeys: true,
  //
  //   /**
  //    * Validate values before caching
  //    */
  //   validateValues: true,
  //
  //   /**
  //    * Log all cache operations
  //    */
  //   logOperations: true,
  // },
}

export default config
