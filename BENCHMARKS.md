# Benchmarks

Performance benchmarks comparing ts-cache with popular alternatives.

**Platform:** Apple M3 Pro @ 3.55 GHz
**Runtime:** Bun 1.2.24 (arm64-darwin)
**Tool:** [mitata](https://github.com/evanwashere/mitata)

## Summary

### Memory Drivers

| Driver | GET | SET | Use Case |
|--------|-----|-----|----------|
| **ts-cache (ultra-fast)** | **3.90 ns** 🥇 | **30 ns** 🥇 | Maximum speed |
| lru-cache | 12 ns | 40 ns | Standard LRU |
| ts-cache (no-clone) | 38 ns | 218 ns | Features + speed |
| ts-cache (default) | 630 ns | 532 ns | Full features |
| node-cache | 549 ns | 692 ns | Sync API |

**ts-cache ultra-fast mode is 3.2x faster than lru-cache on GET operations!**

### Redis Drivers

| Client | GET | SET | Batch GET (100) |
|--------|-----|-----|-----------------|
| **ts-cache** | 19.7 µs | 19.7 µs | **61 µs** 🥇 |
| Bun native | 18.4 µs | 19.0 µs | 80 µs |
| ioredis | 21.3 µs | 19.7 µs | 91 µs |
| node-redis | 21.7 µs | 22.0 µs | 118 µs |

**ts-cache wins on batch operations (24% faster)!**

## Ultra-Fast Mode

Enable maximum performance:

```typescript
import { Cache } from 'ts-cache'

const cache = new Cache({
  useClones: false, // Store references
  enableStats: false, // No statistics
  enableEvents: false, // No events
  stdTTL: 0, // No TTL
  checkPeriod: 0, // No expiration checks
  maxPerformance: true, // Use Map storage
})

// Now 3.2x faster than lru-cache!
cache.set('key', value) // 30ns
cache.get('key') // 4ns
```

## Performance Modes

| Mode | GET | Features |
|------|-----|----------|
| Ultra-Fast | 4 ns | None (maximum speed) |
| No-Clone | 38 ns | TTL, stats, events |
| Default | 630 ns | All + cloning |

## Running Benchmarks

```bash
# Memory benchmarks
bun benchmarks/memory.ts

# Redis benchmarks (requires Redis)
docker run -d -p 6379:6379 redis:alpine
bun benchmarks/redis.ts
```

## Details

See [benchmarks/README.md](./benchmarks/README.md) for complete results and [benchmarks/ULTRA-FAST-MODE.md](./benchmarks/ULTRA-FAST-MODE.md) for configuration guide.
