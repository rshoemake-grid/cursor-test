# Mutation Test Resource Monitoring

## Overview

The `monitor-mutation-resources.sh` script provides comprehensive resource monitoring during mutation testing to help identify if resource limits are being hit.

## Usage

```bash
# Basic usage (monitors default log file)
./monitor-mutation-resources.sh

# Specify log file and monitoring interval
./monitor-mutation-resources.sh /tmp/mutation.log 60 40

# Parameters:
#  1. Log file path (default: /tmp/mutation-with-resources.log)
#  2. Monitor interval in seconds (default: 60)
#  3. Max iterations (default: 60)
```

## What It Monitors

### 1. Memory Usage
- **Stryker process memory**: Memory used by the main Stryker process
- **Jest processes memory**: Memory used by all Jest test runner processes
- **Total test memory**: Combined memory usage
- **System memory**: Total system memory usage and percentage
- **Warnings**: 
  - ⚠️ CAUTION at >80% system memory
  - ⚠️ WARNING at >90% system memory
  - 🚨 CRITICAL at >95% system memory

### 2. CPU Usage
- **System CPU**: Overall system CPU usage
- **Stryker CPU**: CPU used by Stryker process
- **Jest CPU**: CPU used by Jest processes
- **Total test CPU**: Combined CPU usage
- **Warnings**:
  - ⚠️ CAUTION at >80% CPU
  - ⚠️ WARNING at >90% CPU
  - 🚨 CRITICAL at >95% CPU

### 3. Process Counts
- **Stryker processes**: Number of Stryker-related processes
- **Jest processes**: Number of Jest test runner processes
- **Node processes**: Total Node.js processes
- **Total processes**: All system processes
- **Process limits**: Checks against `ulimit -u`
- **Warnings**:
  - ⚠️ WARNING at >80% of process limit
  - 🚨 CRITICAL at >95% of process limit

### 4. Disk Space
- **Disk usage**: Percentage of disk used
- **Disk available**: Free disk space
- **Stryker temp size**: Size of `.stryker-tmp` directory
- **Warnings**:
  - ⚠️ CAUTION at >80% disk usage
  - ⚠️ WARNING at >90% disk usage
  - 🚨 CRITICAL at >95% disk usage

### 5. File Descriptors
- **Open files**: Current number of open file descriptors
- **File limit**: System file descriptor limit (`ulimit -n`)
- **Warnings**: ⚠️ WARNING at >80% of file limit

### 6. Node.js Limits
- **Max heap size**: Node.js V8 heap size limit
- **Warning**: ⚠️ CAUTION when approaching heap limit

### 7. Error Detection
- **Recent crashes**: Count of `ChildProcessCrashedError` events
- **Recent errors**: Count of `ERROR Stryker` messages
- **OOM kills**: Detects out-of-memory kills from system logs

## Resource Limit Indicators

The script will flag potential resource limit issues:

### Memory Issues
- **High memory usage** (>80%): May cause slowdowns
- **Very high memory** (>90%): Risk of OOM kills
- **Critical memory** (>95%): OOM kills likely

### CPU Issues
- **High CPU** (>80%): May cause test slowdowns
- **Very high CPU** (>90%): Significant performance impact
- **Critical CPU** (>95%): System may become unresponsive

### Process Limit Issues
- **High process count** (>80% of limit): Approaching limit
- **Critical process count** (>95%): May hit limit and fail

### Disk Space Issues
- **High disk usage** (>80%): May cause write failures
- **Very high disk** (>90%): Risk of write failures
- **Critical disk** (>95%): Write failures likely

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[11:15:30] ✅ Update #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MUTATION TEST PROGRESS:
   Progress:        15%
   Tested:          735/4903
   Survived:        120
   Timeout:         2
   Elapsed:         ~3m
   Remaining:       ~12m

💾 MEMORY USAGE:
   Stryker process:  245.32 MB
   Jest processes:   5120.45 MB
   Total test mem:   5365.77 MB (max: 5365.77 MB)
   System total:     24 GB
   System used:      12.45 GB (51.9%)
   System free:      11.55 GB

⚡ CPU USAGE:
   System CPU:       65.3% (max: 65.3%)
   Stryker CPU:      2.5%
   Jest processes:   45.2%
   Total test CPU:   47.7%

🔢 PROCESS COUNTS:
   Stryker procs:    1
   Jest procs:       8
   Node procs:       25
   Total processes:  485
   Process limit:    4000
   Process usage:    12.1%

💿 DISK SPACE:
   Disk usage:       45%
   Disk available:   250 GB
   Stryker tmp size: 1.2 GB
```

## Interpreting Results

### If Tests Stop Early

1. **Check memory warnings**: If memory usage is >90%, tests may be killed by OOM
2. **Check CPU warnings**: If CPU is >90%, tests may timeout
3. **Check process warnings**: If process count is >80% of limit, new processes may fail
4. **Check OOM kills**: Look for "OOM kills" in the output
5. **Check disk space**: If disk is >90%, writes may fail

### If Tests Complete Successfully

- Review peak resource usage in final summary
- Check if any warnings were triggered
- Compare peak vs. final resource usage to detect leaks

## Troubleshooting Resource Issues

### High Memory Usage
- Reduce `concurrency` in `stryker.conf.json` (default: 8)
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=8192"`
- Check for memory leaks in test code

### High CPU Usage
- Reduce `concurrency` in `stryker.conf.json`
- Increase `timeoutMS` to allow slower tests
- Check for CPU-intensive operations in tests

### Process Limit Issues
- Reduce `concurrency` in `stryker.conf.json`
- Increase process limit: `ulimit -u 8000`
- Check for process leaks

### Disk Space Issues
- Clean up `.stryker-tmp` directory: `rm -rf .stryker-tmp`
- Free up disk space
- Reduce `maxTestRunnerReuse` to clean up more frequently

## Integration with Mutation Tests

To run mutation tests with resource monitoring:

```bash
# Terminal 1: Start mutation tests
cd frontend
npm run test:mutation 2>&1 | tee /tmp/mutation.log &

# Terminal 2: Monitor resources
./monitor-mutation-resources.sh /tmp/mutation.log 60 40
```

Or run both together:

```bash
cd frontend
npm run test:mutation 2>&1 | tee /tmp/mutation.log &
sleep 50
./monitor-mutation-resources.sh /tmp/mutation.log 90 30
```

## Current System Limits

Based on the monitoring script output:
- **Process limit**: 4000 processes
- **Memory limit**: Unlimited (system has 24 GB RAM)
- **File limit**: 1,048,575 file descriptors
- **Node.js heap**: 4288 MB default limit

## Notes

- The script uses Python3 for accurate memory calculations on macOS
- Memory calculations use `vm_stat` for macOS-specific accuracy
- OOM kill detection checks system logs (may require sudo)
- All warnings are color-coded for easy identification
