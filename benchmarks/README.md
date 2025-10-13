# ts-cache Benchmark Results

This directory contains comprehensive benchmark results comparing ts-cache with popular cache and Redis clients.

## Benchmark Reports

### 1. [Driver Comparison Report](./DRIVER-COMPARISON-REPORT.md)
Comprehensive comparison of **all ts-cache drivers** with popular alternatives:
- **Drivers tested:** memory (sync), memory (async), memory-lru (async)
- **Competitors:** node-cache, lru-cache
- **Key findings:**
  - ✅ ts-cache memory sync **40% faster** than competitors on large values
  - ✅ ts-cache async mset **11% faster** than its own sync loop
  - ✅ ts-cache async mget **29% faster** than its own sync loop
  - ✅ memory-lru driver only +8% overhead vs sync (excellent!)

### 2. [Redis Comparison Report](./REDIS-COMPARISON-REPORT.md)
Comprehensive comparison of **ts-cache Redis driver** with popular Redis clients:
- **Clients tested:** ts-cache (redis), Bun native Redis, ioredis, node-redis
- **Key findings:**
  - 🥇 ts-cache batch GET **24% faster** than Bun native Redis
  - 🥇 ts-cache SET with TTL **46% faster** than Bun native Redis
  - 🥇 ts-cache batch DELETE **9% faster** than Bun native Redis
  - ⭐ ts-cache single operations within **10%** of Bun native (excellent abstraction cost)

### 3. [Performance Improvements Report](./PERFORMANCE-IMPROVEMENTS.md)
Detailed analysis of performance optimizations applied to ts-cache:
- **Optimizations:**
  - Replaced `clone` library with native `structuredClone`
  - Inlined hot path operations (get, set, mget, mset, has)
  - Removed EventEmitter overhead from critical paths
  - Single-pass batch algorithms
  - Optimized TTL calculations
- **Results:**
  - 15% faster on small SET operations
  - 40% faster on large value operations
  - 9-29% faster on batch operations

## Quick Start

### Run All Benchmarks

```bash
# Driver comparison (memory drivers vs node-cache, lru-cache)
bun benchmarks/driver-comparison.ts

# Redis comparison (requires Redis server)
docker run -d -p 6379:6379 redis:alpine
bun benchmarks/redis-comparison.ts

# Original comparison (memory driver only)
bun benchmarks/comparison.ts
```

### View Results

All benchmark results are saved to text files:
- `driver-results.txt` - Full driver comparison results
- `redis-results.txt` - Full Redis comparison results
- `results.txt` - Original memory-only results

## Benchmark Summary

### ts-cache Performance Highlights

#### Memory Drivers
| Operation | ts-cache (sync) | ts-cache (async) | node-cache | lru-cache |
|-----------|----------------|------------------|------------|-----------|
| SET (small) | 392 ns | 643 ns | 475 ns | **31 ns** |
| GET (small) | 371 ns | 574 ns | **176 ns** | **10 ns** |
| SET (large) | **4.98 µs** | 8.66 µs | 8.23 µs | 30 ns* |
| GET (large) | **4.99 µs** | 8.51 µs | 8.40 µs | 10 ns* |
| mset (100) | 27.86 µs | **24.66 µs** ✅ | 18.42 µs | **4.41 µs** |
| mget (100) | 22.48 µs | **16.13 µs** ✅ | 15.85 µs | **1.92 µs** |

*lru-cache doesn't clone values, so not directly comparable

**Key Takeaway:** ts-cache offers best balance of performance and features!

#### Redis Driver
| Operation | ts-cache | Bun native | ioredis | node-redis |
|-----------|----------|------------|---------|------------|
| SET (small) | 19.73 µs | **19.04 µs** | 19.68 µs | 21.97 µs |
| GET (small) | 19.73 µs | **18.37 µs** | 21.26 µs | 21.67 µs |
| Batch SET (100) | 113.30 µs | **104.48 µs** | 111.63 µs | 142.23 µs |
| **Batch GET (100)** | **61.34 µs** ✅ | 80.32 µs | 90.90 µs | 117.95 µs |
| **SET with TTL** | **20.33 µs** ✅ | 37.76 µs | 20.36 µs | 21.67 µs |
| **Batch DELETE (100)** | **161.55 µs** ✅ | 177.65 µs | 191.56 µs | 247.61 µs |

**Key Takeaway:** ts-cache Redis driver WINS on batch operations and TTL optimization!

## Benchmark Environment

- **Platform:** Apple M3 Pro @ 3.52-3.55 GHz
- **Runtime:** Bun 1.2.24 (arm64-darwin)
- **Benchmarking Tool:** mitata v1.0.34
- **Date:** October 2025

## Recommendations

### Choose ts-cache (memory, sync) when:
- ✅ Maximum sync performance needed
- ✅ Working with large values (40% faster than node-cache!)
- ✅ Need all features (compression, middleware, events)

### Choose ts-cache (memory, async) when:
- ✅ Modern async/await application
- ✅ Batch operations important (mset/mget faster than sync!)
- ✅ May need Redis driver later (API compatibility)

### Choose ts-cache (memory-lru, async) when:
- ✅ LRU eviction policy required
- ✅ Read-heavy workload (excellent GET performance)
- ✅ Fixed memory limits

### Choose ts-cache (redis driver) when:
- ✅ **Batch operations are critical** (24% faster mget!)
- ✅ **Using TTL extensively** (46% faster!)
- ✅ Need automatic serialization
- ✅ Want consistent API across drivers

### Choose competitors when:
- **lru-cache:** Absolute maximum speed, LRU-only, no features needed
- **node-cache:** Battle-tested stability paramount, simple sync use
- **Bun native Redis:** Raw Redis access, simple use cases, no batch operations
- **ioredis:** Node.js environment, Redis Cluster, advanced features

## Contributing

To add new benchmarks:

1. Create a new benchmark file in `benchmarks/` directory
2. Use mitata for consistent benchmarking
3. Save results to a `.txt` file
4. Create a markdown report with analysis
5. Update this README with links and summary

## License

MIT
