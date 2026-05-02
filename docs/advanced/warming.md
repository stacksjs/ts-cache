# Cache Warming

Pre-populate cache for optimal performance.

## Overview

Cache warming loads data into cache before it's needed, reducing cold-start latency.

## Startup Warming

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({ store: 'memory' })

async function warmCache() {
  console.log('Warming cache...')

  // Load frequently accessed data
  const [config, features, popularItems] = await Promise.all([
    db.config.getAll(),
    db.features.getEnabled(),
    db.items.getPopular(100),
  ])

  await Promise.all([
    cache.set('config', config, 86400),
    cache.set('features', features, 3600),
    ...popularItems.map((item) =>
      cache.set(`item:${item.id}`, item, 3600)
    ),
  ])

  console.log('Cache warmed')
}

// Call on startup
await warmCache()
```

## Scheduled Warming

```typescript
import { CronJob } from 'cron'

// Warm cache every hour
new CronJob('0 * * * *', async () => {
  await warmCache()
}).start()

// Warm specific data at specific times
new CronJob('0 8 * * *', async () => {
  // Morning: warm daily reports
  const reports = await generateDailyReports()
  await cache.set('reports:daily', reports, 86400)
}).start()
```

## Lazy Warming

Warm cache on first access:

```typescript
async function getWithWarm<T>(
  key: string,
  warmFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  let value = await cache.get<T>(key)

  if (!value) {
    value = await warmFn()
    await cache.set(key, value, ttl)
  }

  return value
}

// Usage
const config = await getWithWarm(
  'app:config',
  () => db.config.getAll(),
  3600
)
```

## Background Warming

Refresh cache in background before expiry:

```typescript
class BackgroundWarmer {
  private refreshing = new Set<string>()

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    refreshAt: number = 0.8 // Refresh at 80% of TTL
  ): Promise<T | undefined> {
    const item = await cache.getWithMeta<T>(key)

    if (item) {
      const age = Date.now() - item.createdAt
      const shouldRefresh = age > ttl * refreshAt * 1000

      if (shouldRefresh && !this.refreshing.has(key)) {
        // Refresh in background
        this.refreshing.add(key)
        fetchFn()
          .then((value) => cache.set(key, value, ttl))
          .finally(() => this.refreshing.delete(key))
      }

      return item.value
    }

    // Cold miss - fetch synchronously
    const value = await fetchFn()
    await cache.set(key, value, ttl)
    return value
  }
}
```

## Selective Warming

Warm only necessary data:

```typescript
async function warmForUser(userId: string) {
  const user = await db.users.findById(userId)

  await Promise.all([
    cache.set(`user:${userId}`, user),
    cache.set(`user:${userId}:preferences`, user.preferences),
    warmUserPermissions(userId),
  ])
}

async function warmForRoute(route: string) {
  const routeData = routeWarmers[route]
  if (routeData) {
    await routeData.warm()
  }
}
```
