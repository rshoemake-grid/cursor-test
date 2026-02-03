#!/bin/bash

# Mutation Test Resource Monitor
# Monitors system resources during mutation testing to detect if limits are being hit

LOG_FILE="${1:-/tmp/mutation-with-resources.log}"
MONITOR_INTERVAL="${2:-60}"  # seconds between checks
MAX_ITERATIONS="${3:-60}"     # max monitoring iterations

echo "════════════════════════════════════════════════════════════════════════════════"
echo "           MUTATION TEST RESOURCE MONITOR"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Log file: $LOG_FILE"
echo "Monitor interval: ${MONITOR_INTERVAL}s"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

# Get system limits
echo "=== SYSTEM LIMITS ==="
ULIMIT_PROC=$(ulimit -u 2>/dev/null || echo "unlimited")
ULIMIT_MEM=$(ulimit -v 2>/dev/null || echo "unlimited")
ULIMIT_FILES=$(ulimit -n 2>/dev/null || echo "unlimited")
NODE_MAX_OLD_SPACE=$(node -e "console.log(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)" 2>/dev/null || echo "N/A")

echo "Process limit:     $ULIMIT_PROC"
echo "Memory limit:      $ULIMIT_MEM"
echo "File limit:        $ULIMIT_FILES"
echo "Node max heap:     ${NODE_MAX_OLD_SPACE} MB"
echo ""

# Get initial system state
SYSTEM_MEMORY_TOTAL=$(sysctl hw.memsize 2>/dev/null | awk '{print $2/1024/1024/1024}' || echo "0")
# Calculate memory used from vm_stat (macOS) - more accurate method
INITIAL_MEMORY_USED=$(python3 -c "
import subprocess
import re
result = subprocess.run(['vm_stat'], capture_output=True, text=True)
vm_stat = result.stdout
page_size_match = re.search(r'page size of (\d+)', vm_stat)
page_size = int(page_size_match.group(1)) if page_size_match else 4096
active_match = re.search(r'Pages active:\s+(\d+)', vm_stat)
inactive_match = re.search(r'Pages inactive:\s+(\d+)', vm_stat)
wired_match = re.search(r'Pages wired down:\s+(\d+)', vm_stat)
active = int(active_match.group(1)) if active_match else 0
inactive = int(inactive_match.group(1)) if inactive_match else 0
wired = int(wired_match.group(1)) if wired_match else 0
used_gb = (active + inactive + wired) * page_size / (1024**3)
print(f'{used_gb:.2f}')
" 2>/dev/null || echo "0")
INITIAL_CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
INITIAL_PROCS=$(ps aux | wc -l | awk '{print $1-1}' || echo "0")

echo "=== INITIAL SYSTEM STATE ==="
echo "Total memory:      ${SYSTEM_MEMORY_TOTAL} GB"
echo "Memory used:       ${INITIAL_MEMORY_USED} GB"
echo "CPU usage:         ${INITIAL_CPU}%"
echo "Total processes:   ${INITIAL_PROCS}"
echo ""
echo "Starting monitoring..."
echo ""

ITERATION=0
LAST_PROGRESS=0
MAX_MEMORY=0
MAX_CPU=0
MAX_PROCS=0

while [ $ITERATION -lt $MAX_ITERATIONS ] && ps aux | grep -q "[s]tryker run"; do
  ITERATION=$((ITERATION + 1))
  sleep $MONITOR_INTERVAL
  
  # Get mutation test progress
  PROGRESS=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "Mutation testing [0-9]+%" | grep -oE "[0-9]+" || echo "0")
  TESTED=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "[0-9]+/[0-9]+ tested" | head -1 || echo "0/0")
  SURVIVED=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "[0-9]+ survived" | grep -oE "[0-9]+" || echo "0")
  TIMEOUT=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "[0-9]+ timed out" | grep -oE "[0-9]+" || echo "0")
  ELAPSED=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "elapsed: [^,]+" | sed 's/elapsed: //' || echo "N/A")
  REMAINING=$(tail -1 "$LOG_FILE" 2>/dev/null | grep -oE "remaining: [^)]+" | sed 's/remaining: //' || echo "N/A")
  
  # === RESOURCE MONITORING ===
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[$(date '+%H:%M:%S')] Update #$ITERATION"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Mutation Test Progress
  echo "📊 MUTATION TEST PROGRESS:"
  echo "   Progress:        ${PROGRESS}%"
  echo "   Tested:          ${TESTED}"
  echo "   Survived:        ${SURVIVED}"
  echo "   Timeout:         ${TIMEOUT}"
  echo "   Elapsed:         ${ELAPSED}"
  echo "   Remaining:       ${REMAINING}"
  echo ""
  
  # Memory Usage
  echo "💾 MEMORY USAGE:"
  STRYKER_MEMORY=$(ps aux | grep -E "[s]tryker run" | awk '{sum+=$6} END {print sum/1024}' || echo "0")
  JEST_MEMORY=$(ps aux | grep -E "[j]est|node.*jest" | awk '{sum+=$6} END {print sum/1024}' || echo "0")
  TOTAL_TEST_MEMORY=$(echo "$STRYKER_MEMORY + $JEST_MEMORY" | bc 2>/dev/null || echo "0")
  
  # Calculate memory used from vm_stat (macOS) - more accurate method
  SYSTEM_MEMORY_USED=$(python3 -c "
import subprocess
import re
result = subprocess.run(['vm_stat'], capture_output=True, text=True)
vm_stat = result.stdout
page_size_match = re.search(r'page size of (\d+)', vm_stat)
page_size = int(page_size_match.group(1)) if page_size_match else 4096
active_match = re.search(r'Pages active:\s+(\d+)', vm_stat)
inactive_match = re.search(r'Pages inactive:\s+(\d+)', vm_stat)
wired_match = re.search(r'Pages wired down:\s+(\d+)', vm_stat)
active = int(active_match.group(1)) if active_match else 0
inactive = int(inactive_match.group(1)) if inactive_match else 0
wired = int(wired_match.group(1)) if wired_match else 0
used_gb = (active + inactive + wired) * page_size / (1024**3)
print(f'{used_gb:.2f}')
" 2>/dev/null || echo "0")
  SYSTEM_MEMORY_FREE=$(echo "$SYSTEM_MEMORY_TOTAL - $SYSTEM_MEMORY_USED" | bc 2>/dev/null || echo "0")
  MEMORY_PERCENT=$(echo "scale=1; ($SYSTEM_MEMORY_USED / $SYSTEM_MEMORY_TOTAL) * 100" | bc 2>/dev/null || echo "0")
  
  # Track max memory
  if (( $(echo "$TOTAL_TEST_MEMORY > $MAX_MEMORY" | bc -l 2>/dev/null || echo "0") )); then
    MAX_MEMORY=$TOTAL_TEST_MEMORY
  fi
  
  echo "   Stryker process:  ${STRYKER_MEMORY} MB"
  echo "   Jest processes:   ${JEST_MEMORY} MB"
  echo "   Total test mem:   ${TOTAL_TEST_MEMORY} MB (max: ${MAX_MEMORY} MB)"
  echo "   System total:     ${SYSTEM_MEMORY_TOTAL} GB"
  echo "   System used:      ${SYSTEM_MEMORY_USED} GB (${MEMORY_PERCENT}%)"
  echo "   System free:      ${SYSTEM_MEMORY_FREE} GB"
  
  # Check for memory warnings
  MEMORY_WARNING=""
  if (( $(echo "$MEMORY_PERCENT > 95" | bc -l 2>/dev/null || echo "0") )); then
    MEMORY_WARNING="🚨 CRITICAL"
    echo "   🚨 CRITICAL: System memory usage is critical (>95%) - may cause OOM kills"
  elif (( $(echo "$MEMORY_PERCENT > 90" | bc -l 2>/dev/null || echo "0") )); then
    MEMORY_WARNING="⚠️  WARNING"
    echo "   ⚠️  WARNING: System memory usage is very high (>90%)"
  elif (( $(echo "$MEMORY_PERCENT > 80" | bc -l 2>/dev/null || echo "0") )); then
    MEMORY_WARNING="⚠️  CAUTION"
    echo "   ⚠️  CAUTION: System memory usage is high (>80%)"
  fi
  
  # Check Node.js heap limits
  if [ "$NODE_MAX_OLD_SPACE" != "N/A" ] && (( $(echo "$TOTAL_TEST_MEMORY > $NODE_MAX_OLD_SPACE * 0.9" | bc -l 2>/dev/null || echo "0") )); then
    echo "   ⚠️  CAUTION: Approaching Node.js heap limit (${NODE_MAX_OLD_SPACE} MB)"
  fi
  echo ""
  
  # CPU Usage
  echo "⚡ CPU USAGE:"
  CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
  STRYKER_CPU=$(ps aux | grep -E "[s]tryker run" | awk '{sum+=$3} END {print sum}' || echo "0")
  JEST_CPU=$(ps aux | grep -E "[j]est|node.*jest" | awk '{sum+=$3} END {print sum}' || echo "0")
  TOTAL_TEST_CPU=$(echo "$STRYKER_CPU + $JEST_CPU" | bc 2>/dev/null || echo "0")
  
  # Track max CPU
  if (( $(echo "$CPU_USAGE > $MAX_CPU" | bc -l 2>/dev/null || echo "0") )); then
    MAX_CPU=$CPU_USAGE
  fi
  
  echo "   System CPU:       ${CPU_USAGE}% (max: ${MAX_CPU}%)"
  echo "   Stryker CPU:      ${STRYKER_CPU}%"
  echo "   Jest processes:   ${JEST_CPU}%"
  echo "   Total test CPU:   ${TOTAL_TEST_CPU}%"
  
  CPU_WARNING=""
  if (( $(echo "$CPU_USAGE > 95" | bc -l 2>/dev/null || echo "0") )); then
    CPU_WARNING="🚨 CRITICAL"
    echo "   🚨 CRITICAL: System CPU usage is critical (>95%) - may cause slowdowns"
  elif (( $(echo "$CPU_USAGE > 90" | bc -l 2>/dev/null || echo "0") )); then
    CPU_WARNING="⚠️  WARNING"
    echo "   ⚠️  WARNING: System CPU usage is very high (>90%)"
  elif (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
    CPU_WARNING="⚠️  CAUTION"
    echo "   ⚠️  CAUTION: System CPU usage is high (>80%)"
  fi
  echo ""
  
  # Process Count
  echo "🔢 PROCESS COUNTS:"
  STRYKER_PROCS=$(ps aux | grep -cE "[s]tryker" || echo "0")
  JEST_PROCS=$(ps aux | grep -cE "[j]est|node.*jest" || echo "0")
  NODE_PROCS=$(ps aux | grep -cE "[n]ode" || echo "0")
  TOTAL_PROCS=$(ps aux | wc -l | awk '{print $1-1}' || echo "0")
  
  # Track max processes
  if [ "$TOTAL_PROCS" -gt "$MAX_PROCS" ]; then
    MAX_PROCS=$TOTAL_PROCS
  fi
  
  echo "   Stryker procs:    ${STRYKER_PROCS}"
  echo "   Jest procs:       ${JEST_PROCS}"
  echo "   Node procs:       ${NODE_PROCS}"
  echo "   Total processes:  ${TOTAL_PROCS} (max: ${MAX_PROCS})"
  
  PROC_WARNING=""
  if [ "$ULIMIT_PROC" != "unlimited" ]; then
    PROC_USAGE_PERCENT=$(echo "scale=1; ($TOTAL_PROCS / $ULIMIT_PROC) * 100" | bc 2>/dev/null || echo "0")
    echo "   Process limit:    ${ULIMIT_PROC}"
    echo "   Process usage:    ${PROC_USAGE_PERCENT}%"
    if (( $(echo "$PROC_USAGE_PERCENT > 95" | bc -l 2>/dev/null || echo "0") )); then
      PROC_WARNING="🚨 CRITICAL"
      echo "   🚨 CRITICAL: Approaching process limit - may cause failures"
    elif (( $(echo "$PROC_USAGE_PERCENT > 80" | bc -l 2>/dev/null || echo "0") )); then
      PROC_WARNING="⚠️  WARNING"
      echo "   ⚠️  WARNING: Approaching process limit"
    fi
  fi
  echo ""
  
  # Disk Space
  echo "💿 DISK SPACE:"
  DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")
  DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}' || echo "N/A")
  STRYKER_TMP_SIZE=$(du -sh .stryker-tmp 2>/dev/null | awk '{print $1}' || echo "0")
  
  echo "   Disk usage:       ${DISK_USAGE}%"
  echo "   Disk available:   ${DISK_AVAIL}"
  echo "   Stryker tmp size: ${STRYKER_TMP_SIZE}"
  
  DISK_WARNING=""
  if [ "$DISK_USAGE" -gt "95" ]; then
    DISK_WARNING="🚨 CRITICAL"
    echo "   🚨 CRITICAL: Disk usage is critical (>95%) - may cause write failures"
  elif [ "$DISK_USAGE" -gt "90" ]; then
    DISK_WARNING="⚠️  WARNING"
    echo "   ⚠️  WARNING: Disk usage is very high (>90%)"
  elif [ "$DISK_USAGE" -gt "80" ]; then
    DISK_WARNING="⚠️  CAUTION"
    echo "   ⚠️  CAUTION: Disk usage is high (>80%)"
  fi
  echo ""
  
  # File Descriptors
  echo "📁 FILE DESCRIPTORS:"
  OPEN_FILES=$(lsof 2>/dev/null | wc -l || echo "N/A")
  echo "   Open files:       ${OPEN_FILES}"
  if [ "$ULIMIT_FILES" != "unlimited" ] && [ "$OPEN_FILES" != "N/A" ]; then
    FILE_USAGE_PERCENT=$(echo "scale=1; ($OPEN_FILES / $ULIMIT_FILES) * 100" | bc 2>/dev/null || echo "0")
    echo "   File limit:       ${ULIMIT_FILES}"
    echo "   File usage:       ${FILE_USAGE_PERCENT}%"
    if (( $(echo "$FILE_USAGE_PERCENT > 80" | bc -l 2>/dev/null || echo "0") )); then
      echo "   ⚠️  WARNING: Approaching file descriptor limit"
    fi
  fi
  echo ""
  
  # Crashes/Errors
  CRASHES=$(tail -150 "$LOG_FILE" 2>/dev/null | grep -c "ChildProcessCrashedError\|exited unexpectedly" || echo "0")
  ERRORS=$(tail -150 "$LOG_FILE" 2>/dev/null | grep -c "ERROR Stryker" || echo "0")
  OOM_KILLS=$(dmesg 2>/dev/null | grep -i "out of memory\|oom" | tail -5 | wc -l || echo "0")
  
  if [ "$CRASHES" -gt "0" ] || [ "$ERRORS" -gt "0" ] || [ "$OOM_KILLS" -gt "0" ]; then
    echo "⚠️  ERRORS/CRASHES:"
    echo "   Recent crashes:  ${CRASHES}"
    echo "   Recent errors:   ${ERRORS}"
    if [ "$OOM_KILLS" -gt "0" ]; then
      echo "   🚨 OOM kills:     ${OOM_KILLS} (system killed processes due to memory)"
    fi
    echo ""
  fi
  
  # Resource Limit Summary
  if [ -n "$MEMORY_WARNING" ] || [ -n "$CPU_WARNING" ] || [ -n "$PROC_WARNING" ] || [ -n "$DISK_WARNING" ] || [ "$OOM_KILLS" -gt "0" ]; then
    echo "🚨 RESOURCE LIMIT WARNINGS:"
    [ -n "$MEMORY_WARNING" ] && echo "   $MEMORY_WARNING: Memory"
    [ -n "$CPU_WARNING" ] && echo "   $CPU_WARNING: CPU"
    [ -n "$PROC_WARNING" ] && echo "   $PROC_WARNING: Processes"
    [ -n "$DISK_WARNING" ] && echo "   $DISK_WARNING: Disk"
    [ "$OOM_KILLS" -gt "0" ] && echo "   🚨 CRITICAL: OOM kills detected"
    echo ""
  fi
  
  # Progress bar
  if [ "$PROGRESS" -gt "0" ] && [ "$PROGRESS" -lt "100" ]; then
    BAR_LEN=$((PROGRESS / 2))
    BAR=$(printf "█%.0s" $(seq 1 $BAR_LEN))
    SPACE=$((50 - BAR_LEN))
    EMPTY=$(printf "░%.0s" $(seq 1 $SPACE))
    echo "Progress:          [$BAR$EMPTY] ${PROGRESS}%"
  elif [ "$PROGRESS" -eq "100" ]; then
    echo "Progress:          [████████████████████████████████████████████████████] 100%"
    echo "                    ✅ Tests completed!"
  fi
  
  echo ""
done

if ! ps aux | grep -q "[s]tryker run"; then
  echo ""
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo "                    MUTATION TESTS COMPLETED"
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  # Final resource summary
  echo "=== FINAL RESOURCE SUMMARY ==="
  FINAL_MEMORY=$(ps aux | grep -E "[s]tryker|jest" | awk '{sum+=$6} END {print sum/1024}' || echo "0")
  FINAL_CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
  FINAL_PROCS=$(ps aux | wc -l | awk '{print $1-1}' || echo "0")
  FINAL_MEMORY_USED=$(python3 -c "
import subprocess
import re
result = subprocess.run(['vm_stat'], capture_output=True, text=True)
vm_stat = result.stdout
page_size_match = re.search(r'page size of (\d+)', vm_stat)
page_size = int(page_size_match.group(1)) if page_size_match else 4096
active_match = re.search(r'Pages active:\s+(\d+)', vm_stat)
inactive_match = re.search(r'Pages inactive:\s+(\d+)', vm_stat)
wired_match = re.search(r'Pages wired down:\s+(\d+)', vm_stat)
active = int(active_match.group(1)) if active_match else 0
inactive = int(inactive_match.group(1)) if inactive_match else 0
wired = int(wired_match.group(1)) if wired_match else 0
used_gb = (active + inactive + wired) * page_size / (1024**3)
print(f'{used_gb:.2f}')
" 2>/dev/null || echo "0")
  
  echo "Peak test memory:   ${MAX_MEMORY} MB"
  echo "Final test memory:  ${FINAL_MEMORY} MB"
  echo "Peak CPU usage:     ${MAX_CPU}%"
  echo "Final CPU usage:    ${FINAL_CPU}%"
  echo "Peak processes:     ${MAX_PROCS}"
  echo "Final processes:    ${FINAL_PROCS}"
  echo "Final system mem:   ${FINAL_MEMORY_USED} GB"
  echo ""
  
  # Check for resource-related issues
  if (( $(echo "$MAX_MEMORY > 8000" | bc -l 2>/dev/null || echo "0") )); then
    echo "⚠️  High memory usage detected (${MAX_MEMORY} MB) - may indicate memory leaks"
  fi
  
  if [ "$MAX_CPU" -gt "90" ]; then
    echo "⚠️  High CPU usage detected (${MAX_CPU}%) - may cause slowdowns"
  fi
  
  if [ "$MAX_PROCS" -gt "500" ]; then
    echo "⚠️  High process count detected (${MAX_PROCS}) - may approach limits"
  fi
  
  echo ""
  
  if tail -300 "$LOG_FILE" 2>/dev/null | grep -q "Initial test run succeeded"; then
    echo "✅ Initial Test Run: SUCCESS"
  else
    echo "❌ Initial Test Run: FAILED or INCOMPLETE"
  fi
  
  echo ""
  echo "=== Final Results Summary ==="
  tail -500 "$LOG_FILE" 2>/dev/null | grep -E "Final|Done|score|Your report|Killed|Survived|No Coverage|Timeout|Errors|mutation score" | tail -30
  
  echo ""
  echo "=== Report File Status ==="
  REPORT_FILE="reports/mutation/mutation.html"
  if [ -f "$REPORT_FILE" ]; then
    REPORT_SIZE=$(ls -lh "$REPORT_FILE" | awk '{print $5}')
    REPORT_TIME=$(stat -f "%Sm" "$REPORT_FILE" 2>/dev/null || stat -c "%y" "$REPORT_FILE" 2>/dev/null)
    echo "✅ Report exists: $REPORT_FILE"
    echo "   Size: $REPORT_SIZE"
    echo "   Modified: $REPORT_TIME"
  else
    echo "⚠️  No report file found yet"
  fi
else
  echo ""
  echo "⚠️  Monitoring stopped but tests are still running"
  echo "   Check progress: tail -f $LOG_FILE"
  echo "   Check resources: ps aux | grep stryker"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
