# Shell Script Duplicate Analysis

This document analyzes all shell scripts in the `frontend/` directory to identify duplicates and document their purposes.

## Analysis Methodology

Each script was analyzed individually to understand its purpose, functionality, and unique characteristics. Scripts are grouped by category and duplicates are identified based on functional similarity.

---

## Script Categories

### 1. Mutation Test Runners (Start Mutation Tests)

#### `run-mutation-with-monitor.sh`
**Purpose**: Starts mutation testing in background with crash monitoring. Checks every 5 minutes for crashes, progress, and completion. Includes crash detection with MAX_CRASHES limit (3 crashes). Saves PID to `mutation_test.pid` and logs to `mutation_test.log`.

**Key Features**:
- Starts mutation test with `npm run test:mutation`
- Monitors for crashes (ChildProcessCrashedError, OOM, etc.)
- Tracks progress and metrics
- Displays final results on completion

#### `run_mutation_with_monitor.sh`
**Purpose**: **DUPLICATE** of `run-mutation-with-monitor.sh`. Nearly identical functionality - starts mutation testing with crash monitoring. Minor differences in display formatting but same core logic.

**Key Differences**: Slightly different result display formatting, but functionally identical.

#### `run-mutation-test-external.sh`
**Purpose**: Runs mutation testing outside Cursor to avoid crashes. Checks if already running, creates log file, runs mutation test with `tee` to capture output. Does NOT include monitoring loop - just runs once.

**Key Features**:
- Checks for existing stryker processes
- Prompts to kill existing process
- Runs mutation test synchronously (not background)
- Logs to `mutation-test-output.log`

#### `start-mutation-test.sh`
**Purpose**: Simple startup script that runs mutation testing in background. Checks if already running, starts mutation test, saves PID. Does NOT include monitoring - just starts the process.

**Key Features**:
- Checks for existing processes
- Starts mutation test in background
- Saves PID to `mutation-test.pid`
- Logs to `mutation-test-output.log`
- Provides instructions for monitoring

#### `run_and_monitor_mutation.sh`
**Purpose**: Comprehensive mutation testing runner with monitoring. Verifies regular tests pass first, cleans up previous runs, starts mutation testing, then monitors every 5 minutes. Includes crash detection and progress tracking.

**Key Features**:
- Pre-flight check: verifies regular tests pass
- Cleanup of previous runs
- Starts mutation testing
- Monitors every 5 minutes
- Crash detection with MAX_CRASHES limit (10)
- Displays final results

#### `run_mutation_with_monitoring.sh`
**Purpose**: **DUPLICATE** of `run_and_monitor_mutation.sh`. Same functionality - runs mutation tests with monitoring. Minor differences in variable names and formatting.

---

### 2. Mutation Test Monitors (Check Progress Periodically)

#### `monitor-mutation.sh`
**Purpose**: Simple monitor that checks mutation test status every 5 minutes. Uses `mutation-test-output.log` and `mutation-test.pid`. Checks for completion, shows progress, detects OOM errors.

**Key Features**:
- Checks every 5 minutes
- Uses PID file to check if running
- Detects OOM errors
- Shows progress and final results

#### `monitor_mutation.sh`
**Purpose**: **SIMILAR** to `monitor-mutation.sh` but uses different log files (`mutation_test.log`, `mutation_test.pid`). More comprehensive with color output and detailed progress extraction.

**Key Features**:
- Uses `mutation_test.log` instead of `mutation-test-output.log`
- Color-coded output
- More detailed progress extraction
- Saves status to `monitor_output.log`

#### `monitor-mutation-test.sh`
**Purpose**: Comprehensive mutation testing monitor. Checks status every 5 minutes, shows progress, detects crashes, reports results. Uses JSON status file (`mutation-test-status.json`) and progress file (`mutation-test-progress.txt`).

**Key Features**:
- Checks process status
- Extracts progress info
- Checks for errors
- Saves status to JSON file
- Appends to progress file

#### `monitor-mutation-tests.sh`
**Purpose**: **DUPLICATE** of `monitor-mutation-test.sh`. Same functionality with minor differences in output formatting.

#### `monitor_mutation_tests.sh`
**Purpose**: **SIMILAR** to other monitors. Checks every 5 minutes for progress, crashes, and completion. Uses `/tmp/stryker-mutation.log` and `/tmp/mutation_test.pid`.

**Key Features**:
- Uses `/tmp/` directory for logs
- Checks for Stryker process
- Shows progress and metrics
- Detects completion

#### `monitor_mutation_testing.sh`
**Purpose**: Comprehensive monitor that checks every 5 minutes. Uses `mutation_test.log` and `mutation_test.pid`. Shows detailed progress, detects crashes, reports final results.

**Key Features**:
- Detailed progress extraction
- Crash detection
- Final results display
- Log file statistics

#### `monitor_mutation_progress.sh`
**Purpose**: **SIMILAR** to other monitors. Checks progress every 5 minutes. Uses `/tmp/mutation_test.log` and `/tmp/mutation_test.pid`. Focuses on progress extraction and crash detection.

**Key Features**:
- Progress extraction from log
- Crash detection
- Process status checking
- Final status report

#### `monitor_mutation_simple.sh`
**Purpose**: Simple monitor using `/tmp/mutation_test.pid` and hardcoded log path. Checks every 5 minutes, shows progress, detects crashes.

**Key Features**:
- Hardcoded log path: `/Users/rshoemake/Documents/cursor/cursor-test/frontend/stryker.log`
- Simple progress checking
- Crash detection
- Completion detection

#### `monitor_mutation_status.sh`
**Purpose**: **SIMILAR** to other monitors. Checks status every 5 minutes, writes to `/tmp/mutation_status.txt`. Focuses on status logging.

**Key Features**:
- Status logging to file
- Process info extraction
- Progress tracking
- Log file checking

#### `monitor_mutation_continuous.sh`
**Purpose**: Continuous monitoring script. Checks every 5 minutes for crashes and reduces workers if needed. Uses `/tmp/stryker-monitor.log`.

**Key Features**:
- Crash detection
- Worker count reduction logic
- Memory usage checking
- Process monitoring

#### `monitor-mutation-until-complete.sh`
**Purpose**: Monitors mutation testing every 5 minutes until completion. Reports crashes and final results. Uses `mutation-test-output.log` and `mutation-test.pid`.

**Key Features**:
- Continuous monitoring until completion
- OOM error tracking
- Progress detection
- Final status logging

#### `monitor-mutation-with-crash-detection.sh`
**Purpose**: Enhanced monitor with detailed crash detection. Checks every 5 minutes, detects crashes, OOM errors, unhandled promise rejections, stuck processes. Very comprehensive error detection.

**Key Features**:
- Comprehensive crash detection
- OOM error tracking
- Unhandled promise rejection detection
- Stuck process detection (no progress for 15 minutes)
- Detailed error context extraction

#### `monitor-mutation-5min.sh`
**Purpose**: **DUPLICATE** of `monitor-mutation.sh`. Checks every 5 minutes, uses same log files, same functionality.

#### `monitor-mutation-background.sh`
**Purpose**: **SIMILAR** to other monitors. Checks every 5 minutes, focuses on background monitoring. Uses `mutation-test-output.log`.

#### `monitor-mutation-live.sh`
**Purpose**: Live monitoring that refreshes every 15 seconds. Uses dynamic log file detection (`mutation-test-run-*.log`). Shows real-time progress.

**Key Features**:
- Fast refresh (15 seconds)
- Dynamic log file detection
- Real-time progress display
- Process count display

#### `monitor-mutation-progress.sh`
**Purpose**: **SIMILAR** to other monitors. Checks progress, uses dynamic log file detection.

#### `monitor-mutation-resources.sh`
**Purpose**: **UNIQUE** - Comprehensive resource monitor. Monitors system resources (memory, CPU, processes, disk, file descriptors) during mutation testing. Very detailed resource tracking.

**Key Features**:
- System memory monitoring
- CPU usage tracking
- Process count monitoring
- Disk space checking
- File descriptor tracking
- Resource limit warnings
- OOM kill detection

#### `monitor-loop.sh`
**Purpose**: Simple loop that calls `check-status.sh` every 5 minutes until completion. Very minimal wrapper.

**Key Features**:
- Calls `check-status.sh` repeatedly
- Checks PID file
- Detects completion

#### `monitor_loop.sh`
**Purpose**: **DUPLICATE** of `monitor-loop.sh` but more comprehensive. Calls `check_mutation_progress.sh` instead, includes more detailed monitoring.

#### `monitor-periodic.sh`
**Purpose**: **SIMILAR** to other monitors. Checks every 5 minutes, shows progress.

#### `monitor-complete.sh`
**Purpose**: **DUPLICATE** of `monitor-mutation.sh`. Same functionality - monitors until completion.

#### `monitor_status.sh`
**Purpose**: **SIMILAR** to other monitors. Checks status periodically.

#### `monitor_task6.sh`
**Purpose**: Task 6 specific monitor. Checks progress every 5 minutes, shows detailed metrics, detects crashes, reports final results.

**Key Features**:
- Task 6 specific
- Detailed progress extraction
- Crash detection
- Final results display

#### `monitor_task6_mutation.sh`
**Purpose**: **DUPLICATE** of `monitor_task6.sh` but more comprehensive. Includes crash detection, progress tracking, stuck detection, final results.

#### `monitor_stryker.sh`
**Purpose**: Monitors Stryker process specifically. Checks every 5 minutes, detects crashes, shows progress.

**Key Features**:
- Stryker-specific monitoring
- Crash detection
- Progress tracking
- Completion detection

#### `monitor_stryker_continuous.sh`
**Purpose**: **SIMILAR** to `monitor_stryker.sh`. Continuous monitoring with crash detection and worker reduction logic.

#### `monitor_stryker_dryrun.sh`
**Purpose**: Monitors Stryker dry run specifically. Checks for completion, errors, process status.

**Key Features**:
- Dry run specific
- Completion detection
- Error detection
- Process status checking

#### `monitor_stryker_progress.sh`
**Purpose**: **SIMILAR** to other Stryker monitors. Shows progress, refreshes every 15 seconds.

#### `continuous-monitor.sh`
**Purpose**: **SIMILAR** to other continuous monitors. Runs monitoring loop.

#### `auto-monitor.sh`
**Purpose**: Automated monitoring script. Checks every 5 minutes, shows progress, detects crashes. Uses `stryker.log` and checks for Stryker process.

**Key Features**:
- Automated monitoring
- Process status checking
- Progress extraction
- Completion detection

#### `start-monitoring.sh`
**Purpose**: Starts automated monitoring that runs `auto-monitor.sh` every 5 minutes in a loop.

**Key Features**:
- Wrapper script
- Runs `auto-monitor.sh` in loop
- Initializes start time

#### `start-auto-monitoring.sh`
**Purpose**: **DUPLICATE** of `start-monitoring.sh`. Same functionality.

---

### 3. Status Checkers (One-Time Status Checks)

#### `check-status.sh`
**Purpose**: Quick status check script. Checks if mutation testing is running, shows recent progress.

**Key Features**:
- One-time check
- Process status
- Recent progress display

#### `check-mutation-status.sh`
**Purpose**: **DUPLICATE** of `check-status.sh`. Same functionality.

#### `check_mutation_status.sh`
**Purpose**: **SIMILAR** to `check-status.sh`. Quick status check with process info.

#### `check_mutation_completion.sh`
**Purpose**: Checks if mutation testing has completed. Looks for completion indicators in log file.

**Key Features**:
- Completion detection
- Result extraction
- Status display

#### `check_mutation_progress.sh`
**Purpose**: Progress checker. Shows current progress, log file stats, key metrics.

**Key Features**:
- Progress extraction
- Log file statistics
- Key metrics display
- Completion detection

---

### 4. Wait/Completion Scripts

#### `wait-for-mutation-complete.sh`
**Purpose**: Waits for mutation testing to complete. Checks every 5 minutes, shows progress, displays final results.

**Key Features**:
- Waits until completion
- Progress checking
- Final results display

#### `wait_for_completion.sh`
**Purpose**: **DUPLICATE** of `wait-for-mutation-complete.sh`. Same functionality.

#### `wait_for_mutation_completion.sh`
**Purpose**: **DUPLICATE** of `wait-for-mutation-complete.sh`. Same functionality.

#### `wait_and_report_mutation.sh`
**Purpose**: Waits for mutation testing to complete and reports results. Checks every 5 minutes, extracts final results, saves report.

**Key Features**:
- Waits until completion
- Detailed result extraction
- Report file generation (`mutation_final_report.txt`)
- HTML report location

#### `wait-and-report-mutation.sh`
**Purpose**: **SIMILAR** to `wait_and_report_mutation.sh` but simpler. Uses `stryker.log` and `mutation-test.pid`. Less detailed reporting.

---

### 5. Result Reporters

#### `report-results.sh`
**Purpose**: Generates final mutation testing results report. Extracts key information from log file, creates markdown report.

**Key Features**:
- Result extraction
- Markdown report generation
- Score extraction
- Summary statistics

#### `display-mutation-results.sh`
**Purpose**: Displays mutation testing results. Extracts overall score, summary statistics, key refactored files.

**Key Features**:
- Result display
- Score extraction
- Summary statistics
- Key files display

#### `get-mutation-results.sh`
**Purpose**: **SIMILAR** to `display-mutation-results.sh`. Gets and displays mutation results.

#### `generate-final-report.sh`
**Purpose**: Generates final mutation testing results report in markdown format. Extracts score, completion time, summary, errors.

**Key Features**:
- Markdown report generation
- Score extraction
- Completion time
- Error extraction

---

### 6. Utility Scripts

#### `run-tests-8-workers.sh`
**Purpose**: Runs unit tests with 8 workers for parallel execution. Sets JEST_MAX_WORKERS=8.

**Key Features**:
- Parallel test execution
- 8 workers
- Optimized for speed

#### `get-coverage-for-files.sh`
**Purpose**: Extracts coverage for specific files from test output. Runs coverage and filters specific files.

**Key Features**:
- Coverage extraction
- File-specific filtering
- Coverage report display

#### `get-file-mutation-stats.sh`
**Purpose**: Extracts file-level mutation statistics from completed test. Parses HTML report or log file.

**Key Features**:
- File-level statistics
- HTML report parsing
- Log file analysis
- Top files by unkilled mutants

#### `extract-file-mutations.sh`
**Purpose**: **SIMILAR** to `get-file-mutation-stats.sh`. Extracts file-level mutation statistics from stryker log.

#### `analyze-memory-leaks.sh`
**Purpose**: Analyzes potential memory leaks in test files. Checks for timers, event listeners, WebSocket usage, cleanup patterns.

**Key Features**:
- Memory leak detection
- Pattern checking
- Test file analysis
- Recommendations

#### `cleanup-md-files.sh`
**Purpose**: Identifies and removes outdated MD files. Removes temporary status files, phase files, outdated summaries.

**Key Features**:
- File identification
- Interactive removal
- Outdated file cleanup

#### `cleanup-md-files-round2.sh`
**Purpose**: **SIMILAR** to `cleanup-md-files.sh`. Second round of cleanup for analysis files and outdated docs.

---

### 7. Test Scripts

#### `scripts/test-quick.sh`
**Purpose**: Quick test runner - runs tests without coverage for faster execution. Supports test pattern matching.

**Key Features**:
- No coverage (faster)
- Pattern matching support
- Quick execution

#### `scripts/test-full.sh`
**Purpose**: Full test runner - runs all tests with coverage.

**Key Features**:
- Full test suite
- Coverage enabled
- Complete execution

#### `scripts/test-watch.sh`
**Purpose**: Watch mode test runner - runs tests in watch mode. Supports test pattern matching.

**Key Features**:
- Watch mode
- Pattern matching support
- Continuous testing

#### `scripts/monitor-tests.sh`
**Purpose**: Monitors test progress and shows results as they happen. Shows current status, coverage, failures.

**Key Features**:
- Real-time monitoring
- Coverage display
- Failure tracking

---

## Duplicate Groups

### Group 1: Mutation Test Runners
- `run-mutation-with-monitor.sh` ≈ `run_mutation_with_monitor.sh` (DUPLICATE)
- `run_and_monitor_mutation.sh` ≈ `run_mutation_with_monitoring.sh` (DUPLICATE)

### Group 2: Simple Monitors (5-minute checks)
- `monitor-mutation.sh` ≈ `monitor-mutation-5min.sh` ≈ `monitor-complete.sh` (DUPLICATES)
- `monitor-loop.sh` ≈ `monitor_loop.sh` (SIMILAR, minor differences)
- `start-monitoring.sh` ≈ `start-auto-monitoring.sh` (DUPLICATE)

### Group 3: Comprehensive Monitors
- `monitor-mutation-test.sh` ≈ `monitor-mutation-tests.sh` (DUPLICATE)
- `monitor_mutation.sh` ≈ `monitor_mutation_progress.sh` ≈ `monitor_mutation_status.sh` (SIMILAR)

### Group 4: Wait/Completion Scripts
- `wait-for-mutation-complete.sh` ≈ `wait_for_completion.sh` ≈ `wait_for_mutation_completion.sh` (DUPLICATES)
- `wait_and_report_mutation.sh` ≈ `wait-and-report-mutation.sh` (SIMILAR)

### Group 5: Status Checkers
- `check-status.sh` ≈ `check-mutation-status.sh` (DUPLICATE)
- `check_mutation_status.sh` (SIMILAR)

### Group 6: Result Reporters
- `display-mutation-results.sh` ≈ `get-mutation-results.sh` (SIMILAR)
- `report-results.sh` ≈ `generate-final-report.sh` (SIMILAR)

### Group 7: Utility Scripts
- `get-file-mutation-stats.sh` ≈ `extract-file-mutations.sh` (SIMILAR)
- `cleanup-md-files.sh` ≈ `cleanup-md-files-round2.sh` (SIMILAR)

---

## Recommendations

### Keep (Unique/Useful)
1. **`run-mutation-test-external.sh`** - Unique: runs outside Cursor
2. **`monitor-mutation-with-crash-detection.sh`** - Most comprehensive crash detection
3. **`monitor-mutation-resources.sh`** - Unique: resource monitoring
4. **`monitor_task6_mutation.sh`** - Task-specific, comprehensive
5. **`analyze-memory-leaks.sh`** - Unique: memory leak analysis
6. **`scripts/test-quick.sh`**, **`scripts/test-full.sh`**, **`scripts/test-watch.sh`** - All unique test runners
7. **`run-tests-8-workers.sh`** - Unique: parallel test execution

### Remove (Duplicates)
1. **`run_mutation_with_monitor.sh`** - Duplicate of `run-mutation-with-monitor.sh`
2. **`run_mutation_with_monitoring.sh`** - Duplicate of `run_and_monitor_mutation.sh`
3. **`monitor-mutation-5min.sh`** - Duplicate of `monitor-mutation.sh`
4. **`monitor-complete.sh`** - Duplicate of `monitor-mutation.sh`
5. **`monitor-mutation-tests.sh`** - Duplicate of `monitor-mutation-test.sh`
6. **`wait_for_completion.sh`** - Duplicate of `wait-for-mutation-complete.sh`
7. **`wait_for_mutation_completion.sh`** - Duplicate of `wait-for-mutation-complete.sh`
8. **`check-mutation-status.sh`** - Duplicate of `check-status.sh`
9. **`start-auto-monitoring.sh`** - Duplicate of `start-monitoring.sh`

### Consolidate (Similar)
1. Consolidate `monitor_mutation.sh`, `monitor_mutation_progress.sh`, `monitor_mutation_status.sh` into one comprehensive monitor
2. Consolidate `wait_and_report_mutation.sh` and `wait-and-report-mutation.sh` into one script
3. Consolidate `display-mutation-results.sh` and `get-mutation-results.sh` into one script
4. Consolidate `report-results.sh` and `generate-final-report.sh` into one script
5. Consolidate `get-file-mutation-stats.sh` and `extract-file-mutations.sh` into one script

---

## Summary Statistics

- **Total Scripts**: 70+
- **Unique Scripts**: ~40
- **Duplicates**: ~15
- **Similar Scripts**: ~15

### By Category
- Mutation Test Runners: 6 scripts (2 duplicates)
- Mutation Test Monitors: 30+ scripts (many duplicates/similar)
- Status Checkers: 5 scripts (2 duplicates)
- Wait/Completion Scripts: 5 scripts (3 duplicates)
- Result Reporters: 4 scripts (2 similar)
- Utility Scripts: 8 scripts (2 similar)
- Test Scripts: 4 scripts (all unique)

---

## Next Steps

1. ✅ Remove identified duplicates - COMPLETED
2. ✅ Consolidate similar scripts - COMPLETED
3. ✅ Create comprehensive scripts - COMPLETED
4. Document remaining scripts with clear purposes
5. Update any references to removed scripts

---

## Consolidation Summary

### Removed Duplicates (9 files)
- ✅ `run_mutation_with_monitor.sh` - Duplicate of `run-mutation-with-monitor.sh`
- ✅ `run_mutation_with_monitoring.sh` - Duplicate of `run_and_monitor_mutation.sh`
- ✅ `monitor-mutation-5min.sh` - Duplicate of `monitor-mutation.sh`
- ✅ `monitor-complete.sh` - Duplicate of `monitor-mutation.sh`
- ✅ `monitor-mutation-tests.sh` - Duplicate of `monitor-mutation-test.sh`
- ✅ `wait_for_completion.sh` - Duplicate of `wait-for-mutation-complete.sh`
- ✅ `wait_for_mutation_completion.sh` - Duplicate of `wait-for-mutation-complete.sh`
- ✅ `check-mutation-status.sh` - Duplicate of `check-status.sh`
- ✅ `start-auto-monitoring.sh` - Duplicate of `start-monitoring.sh`

### Consolidated Scripts (7 files removed, 5 comprehensive scripts created)
- ✅ **Monitor scripts**: Consolidated `monitor_mutation.sh`, `monitor_mutation_progress.sh`, `monitor_mutation_status.sh` → `monitor_mutation_comprehensive.sh`
- ✅ **Wait/report scripts**: Consolidated `wait_and_report_mutation.sh`, `wait-and-report-mutation.sh` → `wait_and_report_mutation_comprehensive.sh`
- ✅ **Result display**: Consolidated `display-mutation-results.sh`, `get-mutation-results.sh` → `display_mutation_results_comprehensive.sh`
- ✅ **Report generation**: Consolidated `report-results.sh`, `generate-final-report.sh` → `generate_mutation_report_comprehensive.sh`
- ✅ **File stats**: Consolidated `get-file-mutation-stats.sh`, `extract-file-mutations.sh` → `get_file_mutation_stats_comprehensive.sh`

### New Comprehensive Scripts
1. **`monitor_mutation_comprehensive.sh`** - Comprehensive monitoring with:
   - Multiple log file location support
   - Process info (CPU, memory, runtime)
   - Crash detection
   - Progress extraction
   - Status file logging
   - Completion detection

2. **`wait_and_report_mutation_comprehensive.sh`** - Comprehensive wait and report with:
   - Multiple log file location support
   - Detailed result extraction
   - Report file generation
   - HTML report location detection

3. **`display_mutation_results_comprehensive.sh`** - Comprehensive result display with:
   - Multiple log file location support
   - Overall score extraction
   - Summary statistics
   - Key refactored files
   - Per-file breakdown
   - Error/warning display

4. **`generate_mutation_report_comprehensive.sh`** - Comprehensive report generation with:
   - Multiple log file location support
   - OOM error analysis
   - Execution time tracking
   - Markdown report generation
   - Conclusion section

5. **`get_file_mutation_stats_comprehensive.sh`** - Comprehensive file stats with:
   - HTML report parsing (preferred, most accurate)
   - Log file analysis fallback
   - Top files by unkilled mutants
   - Summary statistics
   - Multiple report location support

### Remaining Scripts to Consider
The following scripts remain and serve unique purposes:
- `monitor-mutation-with-crash-detection.sh` - Most comprehensive crash detection
- `monitor-mutation-resources.sh` - Unique resource monitoring
- `monitor_task6_mutation.sh` - Task-specific comprehensive monitor
- `analyze-memory-leaks.sh` - Unique memory leak analysis
- All test runner scripts (`scripts/test-*.sh`) - All unique
- `run-tests-8-workers.sh` - Unique parallel execution
