import type { CacheConfig, Options } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: CacheConfig = {
  // ============================================================
  // General Settings
  // ============================================================
  verbose: false,
  driver: 'memory',
  prefix: '',

  // ============================================================
  // Memory Driver Settings (Legacy Cache)
  // ============================================================
  forceString: false,
  objectValueSize: 80,
  promiseValueSize: 80,
  arrayValueSize: 40,
  enableLegacyCallbacks: false,

  // ============================================================
  // Common Cache Settings (All Drivers)
  // ============================================================
  stdTTL: 0, // 0 = infinity
  checkPeriod: 600, // check every 10 minutes
  useClones: true,
  deleteOnExpire: true,
  maxKeys: -1, // -1 = unlimited for memory, 1000 for memory-lru

  // ============================================================
  // Redis Driver Settings
  // ============================================================
  redis: {
    url: undefined,
    host: 'localhost',
    port: 6379,
    password: undefined,
    database: 0,
    connectionTimeout: 10000,
    autoReconnect: true,
    maxRetries: 10,
    tls: false,
  },

  // ============================================================
  // Serialization & Compression
  // ============================================================
  serializer: 'json',
  compression: {
    algorithm: 'none',
    level: 6,
    threshold: 1024,
    enabled: false,
  },
  enableCompression: false, // Legacy

  // ============================================================
  // Middleware Configuration
  // ============================================================
  middleware: {
    enabled: false,
    logging: false,
    metrics: false,
    retry: {
      enabled: false,
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 5000,
    },
    encryption: {
      enabled: false,
    },
  },

  // ============================================================
  // Caching Patterns Configuration
  // ============================================================
  patterns: {
    cacheAside: {
      ttl: undefined,
    },
    readThrough: {
      ttl: undefined,
    },
    writeThrough: {
      ttl: undefined,
    },
    writeBehind: {
      ttl: undefined,
      flushInterval: 5000,
    },
    refreshAhead: {
      ttl: 3600,
      thresholdPercentage: 0.8,
    },
    slidingWindow: {
      ttl: 3600,
    },
  },

  // ============================================================
  // Event/Hook Configuration
  // ============================================================
  events: {
    onSet: undefined,
    onGet: undefined,
    onMiss: undefined,
    onHit: undefined,
    onDelete: undefined,
    onFlush: undefined,
    onError: undefined,
    onExpire: undefined,
  },

  // ============================================================
  // Performance Tuning
  // ============================================================
  performance: {
    enableStats: true,
    metricsInterval: 60000,
    warmup: {
      enabled: false,
      keys: undefined,
      loader: undefined,
    },
    batchSize: 100,
    batchWindow: 10,
  },

  // ============================================================
  // Multi-Level Cache
  // ============================================================
  multiLevel: {
    enabled: false,
    levels: undefined,
  },

  // ============================================================
  // Key Transformation
  // ============================================================
  keyTransform: {
    normalize: false,
    hash: false,
    sanitize: false,
    maxLength: 250,
    transform: undefined,
  },

  // ============================================================
  // Namespace/Tenant Support
  // ============================================================
  namespace: {
    enabled: false,
    separator: ':',
    default: undefined,
    allowDynamic: true,
  },

  // ============================================================
  // TTL Strategies
  // ============================================================
  ttlStrategy: {
    mode: 'fixed',
    beta: 1.0,
    jitter: 0,
  },

  // ============================================================
  // Error Handling
  // ============================================================
  errorHandling: {
    throwOnError: false,
    fallbackValue: undefined,
    retryOnError: false,
    circuitBreaker: {
      enabled: false,
      threshold: 5,
      timeout: 60000,
      resetTimeout: 30000,
    },
  },

  // ============================================================
  // Development/Debug Options
  // ============================================================
  debug: {
    enabled: false,
    logLevel: 'info',
    trackAccess: false,
    validateKeys: false,
    validateValues: false,
    logOperations: false,
  },
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: CacheConfig = await loadConfig({
  name: 'cache',
  defaultConfig,
})

/**
 * Default options for the cache
 */
export const DEFAULT_OPTIONS: Options = {
  // convert all elements to string
  forceString: false,
  // used standard size for calculating value size
  objectValueSize: 80,
  promiseValueSize: 80,
  arrayValueSize: 40,
  // standard time to live in seconds. 0 = infinity;
  stdTTL: 0,
  // time in seconds to check all data and delete expired keys
  checkPeriod: 600,
  // en/disable cloning of variables. If `true` you'll get a copy of the cached variable.
  // If `false` you'll save and get just the reference
  useClones: true,
  // whether values should be deleted automatically at expiration
  deleteOnExpire: true,
  // enable legacy callbacks
  enableLegacyCallbacks: false,
  // max amount of keys that are being stored
  maxKeys: -1,
}

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  ENOTFOUND: 'Key `__key` not found',
  ECACHEFULL: 'Cache max keys amount exceeded',
  EKEYTYPE: 'The key argument has to be of type `string` or `number`. Found: `__key`',
  EKEYSTYPE: 'The keys argument has to be an array.',
  ETTLTYPE: 'The ttl argument has to be a number.',
}
