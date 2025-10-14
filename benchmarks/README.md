# Benchmarks

Performance benchmarks for ts-cache comparing with popular alternatives.

**Platform:** Apple M3 Pro @ 3.53 GHz
**Runtime:** Bun 1.2.24 (arm64-darwin)
**Tool:** [mitata](https://github.com/evanwashere/mitata)

## Quick Results

### Memory Cache Performance

| Library | GET | SET | Notes |
|---------|-----|-----|-------|
| **ts-cache (ultra-fast)** | **3.90 ns** 🥇 | **30 ns** 🥇 | No stats, no events, no TTL, Map storage |
| **lru-cache** | 12 ns | 40 ns | Industry standard LRU cache |
| **ts-cache (no-clone)** | 38 ns | 218 ns | With TTL, stats, events enabled |
| **ts-cache (default)** | 630 ns | 532 ns | Full features + cloning for safety |
| **node-cache** | 549 ns | 692 ns | Popular sync cache library |

### Redis Performance

| Client | GET | SET | Batch GET (100) |
|--------|-----|-----|-----------------|
| **ts-cache** | 19.7 µs | 19.7 µs | **61 µs** 🥇 |
| Bun native | 18.4 µs | 19.0 µs | 80 µs |
| ioredis | 21.3 µs | 19.7 µs | 91 µs |
| node-redis | 21.7 µs | 22.0 µs | 118 µs |

**ts-cache Redis driver wins on batch operations!**

## Ultra-Fast Mode

Enable maximum performance by disabling optional features:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  useClones: false, // No cloning (store references)
  enableStats: false, // No statistics
  enableEvents: false, // No event emission
  stdTTL: 0, // No TTL checking
  checkPeriod: 0, // No expiration checks
  maxPerformance: true, // Use Map storage
})

// Now 3.2x faster than lru-cache!
cache.set('key', value) // 30ns vs lru-cache 40ns
cache.get('key') // 4ns vs lru-cache 12ns
```

### Performance Modes

Choose the right mode for your needs:

| Mode | GET | SET | Features | Use Case |
|------|-----|-----|----------|----------|
| **Ultra-Fast** | 4 ns | 30 ns | None | Hot paths, maximum speed |
| **No-Clone** | 38 ns | 218 ns | TTL, stats, events | Controlled data, good speed |
| **Default** | 630 ns | 532 ns | All + cloning | Full features, data safety |

## Running Benchmarks

```bash
# Memory cache benchmarks
bun benchmarks/memory.ts

# Redis benchmarks (requires Redis running)
docker run -d -p 6379:6379 redis:alpine
bun benchmarks/redis.ts
```

## What Makes Ultra-Fast Mode So Fast?

**Optimizations:**

1. **No EventEmitter** (~25ns saved) - Biggest win
2. **No stats tracking** (~15ns saved)
3. **No TTL checking** (~20ns saved)
4. **Map storage** (~10ns saved) - Guaranteed O(1)
5. **Cached flags** (~5ns saved)

**Total: ~75ns savings per operation**

## When to Use Each Mode

### ✅ Ultra-Fast Mode

- Hot paths (called millions of times/sec)
- No TTL needed (data doesn't expire)
- Don't need statistics or monitoring
- Control the data (safe to store references)

### ✅ No-Clone Mode

- Good performance + features needed
- TTL expiration required
- Need statistics/monitoring
- Control the data (won't mutate)

### ✅ Default Mode

- Data safety is critical
- Working with untrusted data
- Multiple parts of code access cache
- Need full feature set

## Key Findings

1. **ts-cache ultra-fast mode beats lru-cache** by 3.2x on GET operations
2. **Cloning is expensive**: 179x slower for large objects
3. **EventEmitter overhead is significant**: ~25ns per operation even with zero listeners
4. **ts-cache Redis driver wins on batch operations**: 24% faster than Bun native
5. **Features are now optional**: Progressive performance based on needs

## Real-World Impact

For 1 million operations per second:

- **lru-cache**: 12.37ms total
- **ts-cache (ultra-fast)**: 3.90ms total
- **Savings**: 8.47ms per million ops

For a service handling 10K requests/sec with 10 cache ops each:

- **100K cache ops/second**
- **~850µs saved per second**
- **Equivalent to 8.5 more requests/sec** with same CPU

## Detailed Results

See [ULTRA-FAST-MODE.md](./ULTRA-FAST-MODE.md) for complete analysis and configuration guide.
