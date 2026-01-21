# Parallel Mutation Testing Setup

## Overview

Cosmic Ray has been configured for parallel execution using the HTTP distributor with 8 workers. This will significantly speed up mutation testing by running mutations concurrently across multiple CPU cores.

## Quick Start

### Option 1: Using cr-http-workers (Recommended)

This is the easiest method - it automatically manages worker processes:

```bash
# 1. Start workers (in one terminal)
cr-http-workers cosmic-ray.toml .

# 2. In another terminal, run mutation testing
cosmic-ray exec cosmic-ray.toml session.sqlite

# 3. When done, stop workers with Ctrl+C in the first terminal
```

### Option 2: Manual Worker Management

If `cr-http-workers` doesn't work or you want more control:

```bash
# 1. Start workers using the helper script
./start_mutation_workers.sh

# 2. Run mutation testing
cosmic-ray exec cosmic-ray.toml session.sqlite

# 3. Stop workers when done
./stop_mutation_workers.sh
```

## Configuration

- **Workers**: 8 parallel workers
- **Ports**: 9876-9883
- **Distributor**: HTTP (allows parallel execution)
- **Expected Speedup**: ~8x faster than single-threaded execution

## Monitoring Progress

While mutation testing is running, you can check progress:

```bash
# See current progress
cr-report session.sqlite --show-pending

# See summary
cr-report session.sqlite | tail -5
```

## Troubleshooting

### Workers won't start
- Make sure ports 9876-9883 are not in use
- Check that git repository is initialized
- Verify Python 3 is available as `python3`

### Workers start but mutations don't run
- Ensure workers are running before executing `cosmic-ray exec`
- Check worker logs in `worker_*.log` files
- Verify test command works: `python3 -m pytest backend/tests/ ...`

### Performance issues
- Reduce number of workers if system becomes unresponsive
- Check CPU/memory usage
- Consider testing smaller modules first

## Expected Performance

With 8 workers and ~6,906 mutations:
- **Single-threaded**: ~19+ hours (assuming 10s per mutation)
- **8 workers**: ~2.5-3 hours (8x speedup, accounting for overhead)

## Next Steps

1. Start workers: `cr-http-workers cosmic-ray.toml .`
2. Run mutations: `cosmic-ray exec cosmic-ray.toml session.sqlite`
3. Monitor progress: `cr-report session.sqlite --show-pending`
4. Generate report: `cr-html session.sqlite > report.html`

