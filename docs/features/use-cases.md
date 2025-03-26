# Use Case Examples

ts-cache can be used in a variety of scenarios. Here are some common use cases with implementation examples.

## API Response Caching

Perfect for caching API responses:

```typescript
async function fetchUserData(userId) {
  // Check cache first
  const cachedData = cache.get(`user:${userId}`)
  if (cachedData) {
    return cachedData
  }

  // Fetch from API if not cached
  const userData = await api.getUser(userId)

  // Cache for 5 minutes
  cache.set(`user:${userId}`, userData, 300)

  return userData
}
```

## Function Memoization

Easily implement function memoization:

```typescript
function memoize(fn, ttl = 0) {
  return function (...args) {
    const key = `memo:${fn.name}:${JSON.stringify(args)}`

    return cache.fetch(key, ttl, () => {
      return fn(...args)
    })
  }
}

// Usage
const expensiveCalculation = memoize((x, y) => {
  // Expensive operation
  return x * y
}, 3600) // Cache for 1 hour
```

## Authentication Token Management

Secure handling of authentication tokens:

```typescript
// Store token with expiration
function storeAuthToken(userId, token, expiresIn) {
  cache.set(`auth:${userId}`, token, expiresIn)
}

// Verify token exists and is valid
function verifyToken(userId, token) {
  const storedToken = cache.get(`auth:${userId}`)
  return storedToken === token
}

// Logout (remove token)
function logout(userId) {
  cache.del(`auth:${userId}`)
}
```

## Rate Limiting

Implement a simple rate limiter:

```typescript
function isRateLimited(ip, limit = 100, period = 3600) {
  const key = `ratelimit:${ip}`
  let attempts = cache.get<number>(key) || 0

  if (attempts >= limit) {
    return true // Rate limited
  }

  // Increment attempts
  cache.set(key, attempts + 1, period)
  return false
}
```
