# Cache Tags

Organize and invalidate cached data using tags.

## Overview

Cache tags allow you to group related cache entries together and invalidate them all at once.

## Basic Tagging

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({ store: 'redis' })

// Set with tags
await cache.tags(['users', 'active']).set('user:123', userData)
await cache.tags(['users', 'inactive']).set('user:456', userData2)
await cache.tags(['posts', 'featured']).set('post:1', postData)
```

## Retrieving Tagged Items

```typescript
// Get specific tagged item
const user = await cache.tags(['users']).get('user:123')

// Get all keys with a tag
const userKeys = await cache.tags(['users']).keys()
```

## Invalidating by Tag

```typescript
// Clear all items with 'users' tag
await cache.tags(['users']).flush()

// Clear items with multiple tags (AND logic)
await cache.tags(['users', 'inactive']).flush()
```

## Real-World Example

```typescript
class UserService {
  private cache: Cache

  async getUser(id: string) {
    const key = `user:${id}`

    return cache.tags(['users', `user:${id}`]).remember(
      key,
      3600,
      () => db.users.findById(id)
    )
  }

  async updateUser(id: string, data: UserUpdate) {
    await db.users.update(id, data)

    // Invalidate this user's cache
    await cache.tags([`user:${id}`]).flush()
  }

  async deleteUser(id: string) {
    await db.users.delete(id)

    // Invalidate user and related data
    await cache.tags([`user:${id}`, `user:${id}:posts`]).flush()
  }

  async clearAllUserCache() {
    // Invalidate all user-related cache
    await cache.tags(['users']).flush()
  }
}
```

## Hierarchical Tags

Organize cache with hierarchical tags:

```typescript
// Product cache with multiple tag levels
await cache.tags([
  'products',
  `category:${product.categoryId}`,
  `brand:${product.brandId}`,
]).set(`product:${product.id}`, product)

// Invalidate all products in a category
await cache.tags([`category:${categoryId}`]).flush()

// Invalidate all products from a brand
await cache.tags([`brand:${brandId}`]).flush()
```

## Tag Best Practices

1. Use descriptive, consistent tag names
2. Don't over-tag - each tag adds overhead
3. Use hierarchical tags for complex relationships
4. Document your tagging strategy
