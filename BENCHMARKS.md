# Benchmarks

Performance benchmarks comparing ts-cache with popular alternatives.

**Platform:** Apple M3 Pro @ 3.55 GHz
**Runtime:** Bun 1.2.24 (arm64-darwin)
**Benchmarking Tool:** [mitata](https://github.com/evanwashere/mitata)

## Memory Drivers

Comparison of ts-cache memory drivers with node-cache and lru-cache.

### Single Operations (Small Values)

| Driver | SET | GET | HAS | DELETE |
|--------|-----|-----|-----|--------|
| ts-cache (memory, sync) | 395 ns | 371 ns | 26 ns | 1.34 µs |
| ts-cache (memory, async) | 643 ns | 574 ns | 204 ns | 1.32 µs |
| ts-cache (memory-lru, async) | 638 ns | 402 ns | 202 ns | 1.31 µs |
| node-cache | 475 ns | 176 ns | 30 ns | 1.03 µs |
| lru-cache | 31 ns | 10 ns | 10 ns | 361 ns |

### Single Operations (Large Values)

| Driver | SET | GET |
|--------|-----|-----|
| ts-cache (memory, sync) | 5.21 µs | 4.99 µs |
| ts-cache (memory, async) | 8.66 µs | 8.51 µs |
| ts-cache (memory-lru, async) | 8.45 µs | 8.50 µs |
| node-cache | 8.23 µs | 8.40 µs |
| lru-cache | 30 ns* | 10 ns* |

\* lru-cache does not clone values by default

### Batch Operations (100 Items)

| Driver | SET (mset) | GET (mget) | FLUSH |
|--------|------------|------------|-------|
| ts-cache (memory, sync) | 27.86 µs | 22.48 µs | 83.83 µs |
| ts-cache (memory, async) | 24.66 µs | 16.13 µs | 63.38 µs |
| ts-cache (memory-lru, async) | 24.93 µs | 15.95 µs | 63.62 µs |
| node-cache | 18.42 µs | 15.85 µs | 52.37 µs |
| lru-cache | 4.41 µs | 1.92 µs | 14.42 µs |

### Other Operations

| Driver | KEYS (100 items) |
|--------|------------------|
| ts-cache (memory, sync) | 1.10 µs |
| ts-cache (memory, async) | 4.60 µs |
| ts-cache (memory-lru, async) | 4.60 µs |
| node-cache | 1.09 µs |
| lru-cache | 2.54 µs |

## Redis Drivers

Comparison of ts-cache Redis driver with Bun native Redis, ioredis, and node-redis.

### Single Operations (Small Values)

| Client | SET | GET | EXISTS | DELETE | SET (TTL) | GET TTL |
|--------|-----|-----|--------|--------|-----------|---------|
| ts-cache (redis) | 19.73 µs | 19.73 µs | 19.25 µs | 40.12 µs | 20.33 µs | 19.88 µs |
| Bun native Redis | 19.04 µs | 18.37 µs | 18.19 µs | 38.61 µs | 37.76 µs | 18.25 µs |
| ioredis | 19.68 µs | 21.26 µs | 18.70 µs | 39.10 µs | 20.36 µs | 18.84 µs |
| node-redis | 21.97 µs | 21.67 µs | 20.08 µs | 42.43 µs | 21.67 µs | 20.04 µs |

### Single Operations (Large Values)

| Client | SET | GET |
|--------|-----|-----|
| ts-cache (redis) | 23.28 µs | 31.98 µs |
| Bun native Redis | 18.96 µs | 20.54 µs |
| ioredis | 20.27 µs | 21.18 µs |
| node-redis | 23.06 µs | 22.22 µs |

### Batch Operations (100 Items)

| Client | SET | GET | DELETE |
|--------|-----|-----|--------|
| ts-cache (redis) | 113.30 µs | 61.34 µs | 161.55 µs |
| Bun native Redis | 104.48 µs | 80.32 µs | 177.65 µs |
| ioredis | 111.63 µs | 90.90 µs | 191.56 µs |
| node-redis | 142.23 µs | 117.95 µs | 247.61 µs |

### Other Operations

| Client | KEYS (pattern) | HSET | HGET |
|--------|----------------|------|------|
| ts-cache (redis) | 32.43 µs | - | - |
| Bun native Redis | 29.41 µs | 19.29 µs | 18.93 µs |
| ioredis | 38.13 µs | 20.32 µs | 19.86 µs |
| node-redis | 37.68 µs | 21.00 µs | 21.70 µs |

## Running Benchmarks

```bash
# Memory driver benchmarks
bun benchmarks/driver-comparison.ts

# Redis driver benchmarks (requires Redis server)
docker run -d -p 6379:6379 redis:alpine
bun benchmarks/redis-comparison.ts
```

## Notes

- All values are averages across multiple iterations
- Memory benchmarks test with and without value cloning enabled
- Redis benchmarks include network latency (localhost)
- Large values are ~2.5KB objects with nested arrays
- Small values are ~100 byte objects
