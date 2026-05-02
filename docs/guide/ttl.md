# TTL Management

Time-to-live (TTL) determines how long cached items remain valid. ts-cache provides flexible TTL management with multiple strategies.

## Basic TTL

### Setting TTL on Store

```typescript
import { createCache } from '@stacksjs/ts-cache'

const cache = createCache({ stdTTL: 300 }) // Default: 5 minutes

// Use default TTL
await cache.set('key', 'value')

// Override with specific TTL (in seconds)
await cache.set('key', 'value', 60) // 1 minute
await cache.set('key', 'value', 3600) // 1 hour
await cache.set('key', 'value', 86400) // 1 day

// No expiration
await cache.set('key', 'value', 0)
```

### Getting TTL

```typescript
// Get expiration timestamp
const expiresAt = await cache.getTtl('key')
// Returns timestamp in ms, 0 for no expiration, undefined if not found

if (expiresAt) {
  const remainingMs = expiresAt - Date.now()
  console.log(`Expires in ${Math.ceil(remainingMs / 1000)} seconds`)
}
```

### Updating TTL

```typescript
// Reset to default TTL
await cache.ttl('key')

// Set new TTL
await cache.ttl('key', 3600) // 1 hour

// Delete by setting negative TTL
await cache.ttl('key', -1)
```

## TTL Strategies

### Fixed TTL (Default)

Items expire at a fixed time after creation:

```typescript
const cache = createCache({
  stdTTL: 3600, // 1 hour
  ttlStrategy: {
    mode: 'fixed'
  }
})

await cache.set('key', 'value')
// Expires in exactly 1 hour, regardless of access
```

### Sliding Window TTL

TTL resets on each access:

```typescript
const cache = createCache({
  stdTTL: 3600,
  ttlStrategy: {
    mode: 'sliding'
  }
})

await cache.set('session', sessionData)
// Expires 1 hour after last access

const session = await cache.get('session')
// TTL is now reset to 1 hour from now
```

### Probabilistic Early Expiration

Prevents thundering herd by randomly refreshing before expiration:

```typescript
const cache = createCache({
  stdTTL: 3600,
  ttlStrategy: {
    mode: 'probabilistic',
    beta: 1.0 // Probability factor
  }
})

// As TTL approaches, cache may report miss early
// to spread out recomputation across requests
```

## TTL Jitter

Add randomness to prevent cache stampede:

```typescript
const cache = createCache({
  stdTTL: 3600,
  ttlStrategy: {
    jitter: 0.1 // 10% random variation
  }
})

// TTL will be 3600 +/- 360 seconds (3240-3960)
```

## Expiration Checking

### Automatic Cleanup

```typescript
const cache = createCache({
  stdTTL: 3600,
  checkPeriod: 600, // Check every 10 minutes
  deleteOnExpire: true // Delete expired items
})
```

### Manual Cleanup

```typescript
// Clean expired items on demand
cache.cleanExpired?.()
```

### Lazy Expiration

Items are checked on access:

```typescript
const cache = createCache({
  checkPeriod: 0 // Disable background checks
})

// Expired items are detected on get()
const value = await cache.get('key')
// Returns undefined if expired, and item is deleted
```

## Common TTL Patterns

### Session Caching

```typescript
const sessionCache = createCache({
  stdTTL: 1800, // 30 minutes
  ttlStrategy: { mode: 'sliding' }, // Reset on access
  prefix: 'session'
})

// Session stays alive while user is active
await sessionCache.set(sessionId, sessionData)
```

### API Response Caching

```typescript
const apiCache = createCache({
  stdTTL: 300, // 5 minutes
  ttlStrategy: {
    mode: 'fixed',
    jitter: 0.1 // Prevent thundering herd
  }
})

async function fetchWithCache(url: string) {
  return apiCache.remember(url, 300, async () => {
    const response = await fetch(url)
    return response.json()
  })
}
```

### Rate Limit Windows

```typescript
const rateLimitCache = createCache({
  stdTTL: 60, // 1 minute window
  ttlStrategy: { mode: 'fixed' }
})

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`
  const count = (await rateLimitCache.get<number>(key)) ?? 0

  if (count >= 100) {
    return false // Rate limited
  }

  await rateLimitCache.set(key, count + 1)
  return true
}
```

### Stale-While-Revalidate

```typescript
interface CachedData<T> {
  data: T
  fetchedAt: number
}

async function staleWhileRevalidate<T>(
  key: string,
  ttl: number,
  staleTime: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cache.get<CachedData<T>>(key)

  if (cached) {
    const age = Date.now() - cached.fetchedAt

    if (age < staleTime) {
      // Fresh - return immediately
      return cached.data
    }

    // Stale - return but refresh in background
    if (age < ttl * 1000) {
      // Don't await - fire and forget
      fetcher().then(async (data) => {
        await cache.set(key, { data, fetchedAt: Date.now() }, ttl)
      })
      return cached.data
    }
  }

  // Missing or expired - fetch and cache
  const data = await fetcher()
  await cache.set(key, { data, fetchedAt: Date.now() }, ttl)
  return data
}

// Usage
const user = await staleWhileRevalidate(
  'user:123',
  3600, // Cache for 1 hour
  60,   // Stale after 1 minute
  () => fetchUser(123)
)
```

### Graceful Degradation

```typescript
interface CachedWithFallback<T> {
  data: T
  timestamp: number
}

async function getWithFallback<T>(
  key: string,
  ttl: number,
  maxStaleAge: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get fresh data
  try {
    const data = await fetcher()
    await cache.set(key, {
      data,
      timestamp: Date.now()
    }, ttl + maxStaleAge) // Store longer for fallback
    return data
  } catch (error) {
    // Fetcher failed - try stale cache
    const cached = await cache.get<CachedWithFallback<T>>(key)

    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < maxStaleAge * 1000) {
        console.warn(`Using stale cache (${Math.floor(age / 1000)}s old)`)
        return cached.data
      }
    }

    throw error
  }
}

// Usage
const data = await getWithFallback(
  'api-data',
  60,      // Normal TTL: 1 minute
  3600,    // Max stale age: 1 hour
  () => fetchFromApi()
)
```

### Tiered TTL

```typescript
const tierConfig = {
  hot: 60,      // 1 minute
  warm: 300,    // 5 minutes
  cold: 3600,   // 1 hour
}

async function setWithTier(
  key: string,
  value: unknown,
  tier: keyof typeof tierConfig
) {
  return cache.set(key, value, tierConfig[tier])
}

// Hot data - frequently accessed, short TTL
await setWithTier('live-scores', scores, 'hot')

// Warm data - moderate access
await setWithTier('user-profile', profile, 'warm')

// Cold data - rarely changes
await setWithTier('site-config', config, 'cold')
```

## Handling Expiration

### Expiration Events

```typescript
cache.on('expired', (key, value) => {
  console.log(`Key ${key} expired`)

  // Optionally refresh
  if (key.startsWith('important:')) {
    refreshKey(key)
  }
})
```

### Preemptive Refresh

```typescript
async function refreshBeforeExpiry(
  key: string,
  ttl: number,
  refreshThreshold: number,
  fetcher: () => Promise<unknown>
) {
  const expiresAt = await cache.getTtl(key)

  if (expiresAt) {
    const remaining = expiresAt - Date.now()
    const threshold = refreshThreshold * 1000

    if (remaining < threshold && remaining > 0) {
      // Refresh in background
      fetcher().then(async (data) => {
        await cache.set(key, data, ttl)
      })
    }
  }
}

// Check and refresh if within 30 seconds of expiry
await refreshBeforeExpiry('key', 300, 30, () => fetchData())
```

## Best Practices

### 1. Choose Appropriate TTL

```typescript
// Too short - high miss rate, lots of fetching
cache.set('key', value, 1) // 1 second

// Too long - stale data, memory pressure
cache.set('key', value, 86400 * 30) // 30 days

// Just right - balance freshness and efficiency
cache.set('api-response', data, 300) // 5 minutes
cache.set('user-session', session, 3600) // 1 hour
```

### 2. Use Jitter for Popular Keys

```typescript
// Without jitter - all keys expire at once
const users = await Promise.all(userIds.map(id =>
  cache.set(`user:${id}`, userData, 3600)
))

// With jitter - staggered expiration
const jitter = () => Math.floor(Math.random() * 600) - 300 // +/- 5 minutes
const users = await Promise.all(userIds.map(id =>
  cache.set(`user:${id}`, userData, 3600 + jitter())
))
```

### 3. Consider Access Patterns

```typescript
// Rarely accessed - use longer TTL
cache.set('config', config, 86400)

// Frequently accessed - sliding window
const sessionCache = createCache({
  ttlStrategy: { mode: 'sliding' },
  stdTTL: 1800
})

// Write-heavy - shorter TTL
cache.set('counters', counts, 60)
```

### 4. Monitor TTL Behavior

```typescript
// Track cache effectiveness
cache.on('hit', () => metrics.increment('cache.hit'))
cache.on('miss', () => metrics.increment('cache.miss'))
cache.on('expired', () => metrics.increment('cache.expired'))

// Periodically log stats
setInterval(() => {
  const stats = cache.getStats()
  const hitRate = stats.hits / (stats.hits + stats.misses)
  console.log(`Cache hit rate: ${(hitRate * 100).toFixed(1)}%`)
}, 60000)
```
