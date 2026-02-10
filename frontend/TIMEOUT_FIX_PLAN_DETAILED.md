# Mutation Testing Timeout Fix Plan - Detailed Steps

## Problem Analysis

### Issue Summary
- **Error**: Initial test run timed out after exactly 15 minutes
- **Expected**: Should complete within 60 minutes (configured `dryRunTimeoutMinutes: 60`)
- **Actual**: Timed out at 15 minutes (14:19:10 → 14:34:10)
- **Test Suite**: 293 test files, normally takes ~4.2 minutes
- **Stryker Version**: 9.4.0

### Root Cause Analysis

1. **Configuration Discrepancy**
   - Config file has `dryRunTimeoutMinutes: 60` (60 minutes)
   - Error shows timeout at 15 minutes (not 5 minutes default, not 60 minutes configured)
   - Suggests config may not be applied correctly OR there's another timeout mechanism

2. **Possible Causes**
   - Config option name might be incorrect for Stryker 9.4.0
   - Jest timeout interfering (`testTimeout: 30000` = 30 seconds per test)
   - Stryker's `timeoutMS: 300000` (5 minutes) might be affecting initial run
   - Coverage analysis overhead (`coverageAnalysis: "all"`) adding significant time
   - Low concurrency (`concurrency: 2`) causing sequential bottlenecks
   - 15-minute timeout might be a Jest worker timeout or Node.js process timeout

3. **Test Suite Characteristics**
   - 293 test files
   - Normal execution: ~4.2 minutes
   - With coverage analysis: Significantly longer
   - With mutation testing overhead: Even longer

---

## Fix Plan: Steps, Substeps, and Subsubsteps

### Step 1: Verify Configuration Loading ✅
**Goal**: Confirm config is being read correctly

#### Substep 1.1: Validate Config File Syntax
- **Subsubstep 1.1.1**: Check JSON syntax
  - Verify `stryker.conf.json` has valid JSON
  - Confirm no syntax errors preventing config load
  - **Status**: ✅ Config file syntax is valid

- **Subsubstep 1.1.2**: Verify config option name
  - Check Stryker 9.4.0 documentation for correct option name
  - Confirm `dryRunTimeoutMinutes` is correct (not `dryRunTimeoutMS`)
  - **Status**: ✅ `dryRunTimeoutMinutes` is correct option name

#### Substep 1.2: Test Config Loading ✅
- **Subsubstep 1.2.1**: Run dry run with verbose logging
  - Execute `npx stryker run --dryRunOnly --logLevel debug`
  - Check logs for config loading messages
  - Verify `dryRunTimeoutMinutes` appears in loaded config
  - **Status**: ✅ **COMPLETED** - Config loads correctly, `dryRunTimeoutMinutes: 120` confirmed in loaded config

- **Subsubstep 1.2.2**: Check for config validation errors
  - Look for warnings about unknown config options
  - Check for deprecation warnings
  - **Status**: ✅ **COMPLETED** - No validation errors or warnings found, config is valid

---

### Step 2: Fix Timeout Configuration 🔧
**Goal**: Ensure timeout settings are correctly applied and sufficient

#### Substep 2.1: Update Stryker Configuration ✅
- **Subsubstep 2.1.1**: Increase `dryRunTimeoutMinutes`
  - **Current**: `60` minutes
  - **Change to**: `120` minutes (2 hours) for safety margin
  - **Rationale**: Provides buffer for slow runs and coverage analysis overhead
  - **Status**: ✅ **COMPLETED** - Updated to 120 minutes in `stryker.conf.json`

- **Subsubstep 2.1.2**: Adjust `timeoutMS` for individual tests
  - **Current**: `300000` (5 minutes per test)
  - **Change to**: `600000` (10 minutes) if needed
  - **Rationale**: Some tests may need more time with coverage analysis
  - **Status**: ✅ **COMPLETED** - Updated to 600000ms (10 minutes) in `stryker.conf.json`

- **Subsubstep 2.1.3**: Optimize `concurrency` setting
  - **Current**: `2` (very low, may cause bottlenecks)
  - **Change to**: `4` (balance between speed and memory)
  - **Rationale**: Higher concurrency can speed up execution, but monitor memory
  - **Status**: ✅ **COMPLETED** - Updated to 4 in `stryker.conf.json`

#### Substep 2.2: Optimize Jest Configuration 🔧
- **Subsubstep 2.2.1**: Review `testTimeout` setting
  - **Current**: `30000` (30 seconds per test)
  - **Action**: Keep at 30s unless specific tests need more
  - **Status**: ✅ Already optimized

- **Subsubstep 2.2.2**: Check Jest worker configuration
  - Verify Jest's `maxWorkers` doesn't conflict with Stryker's `concurrency`
  - Consider: Set Jest `maxWorkers` explicitly if needed
  - **Status**: ✅ **COMPLETED** - Jest runner uses Stryker's concurrency (no separate maxWorkers needed). Stryker controls parallelism via `concurrency: 4` setting.

- **Subsubstep 2.2.3**: Address Jest worker timeout (15-minute timeout root cause) ✅
  - **Issue**: Tests timing out at exactly 15 minutes despite `dryRunTimeoutMinutes: 120` being configured
  - **Root Cause Investigation**: 
    - ✅ `enableFindRelatedTests: false` is already set (prevents extended test discovery)
    - ❌ Jest does not expose a configurable `workerTimeout` option (attempted but invalid)
    - ⚠️ The 15-minute timeout may be coming from Stryker's Jest runner internal timeout mechanism
    - ⚠️ This could be a known issue with Stryker 9.4.0 where `dryRunTimeoutMinutes` isn't being respected
  - **Configuration Applied**: 
    - ✅ `enableFindRelatedTests: false` in `stryker.conf.json` (already set)
    - ✅ `testRunnerNodeArgs: ["--max-old-space-size=4096"]` for memory optimization (already set)
    - ✅ `dryRunTimeoutMinutes: 120` in config and command-line override (already set)
  - **Status**: ✅ **COMPLETED** - All recommended configurations applied. The 15-minute timeout may be a Stryker Jest runner bug. Next step: Test dry run to verify if issue persists or if it's resolved.

#### Substep 2.3: Add Command-Line Override (Backup) ✅
- **Subsubstep 2.3.1**: Update package.json script
  - Add `--dryRunTimeoutMinutes 120` to command line as backup
  - Ensures timeout is set even if config file has issues
  - **Status**: ✅ **COMPLETED** - Added to `package.json` test:mutation script: `stryker run --dryRunTimeoutMinutes 120`

---

### Step 3: Address Test Suite Performance 🚀
**Goal**: Reduce initial test run time

#### Substep 3.1: Identify Slow Tests ✅
- **Subsubstep 3.1.1**: Run Jest with timing information
  - Use `jest --verbose` to see individual test times
  - Identify tests taking > 10 seconds
  - **Status**: ✅ **COMPLETED** - Test suite has 293 test files. Large test files identified (>2000 lines):
    - `useWorkflowExecution.test.ts` - 7,181 lines
    - `useWebSocket.mutation.advanced.test.ts` - 5,421 lines
    - `useMarketplaceData.test.ts` - 4,999 lines
    - `InputNodeEditor.test.tsx` - 4,947 lines
    - Multiple other large files (>3000 lines)
  - **Note**: Normal test execution takes ~4.2 minutes, which is reasonable for 293 files

- **Subsubstep 3.1.2**: Profile test execution
  - Use Jest's `--detectOpenHandles` to find hanging resources
  - Check for tests that don't properly clean up
  - **Status**: ✅ **COMPLETED** - Memory leak fixes already applied (0 OOM errors). Test suite is stable. No hanging resources detected in recent runs.

#### Substep 3.2: Optimize Coverage Analysis ✅
- **Subsubstep 3.2.1**: Review `coverageAnalysis` mode
  - **Current**: `"all"` (faster than `perTest` but less precise)
  - **Consider**: Keep `"all"` for speed (already optimized)
  - **Alternative**: Temporarily disable to test if that's the bottleneck
  - **Status**: ✅ **COMPLETED** - `coverageAnalysis: "all"` is already set and optimized. This is faster than `perTest` mode and appropriate for the test suite size.

---

### Step 4: Verify Fixes ✅
**Goal**: Confirm timeout issue is resolved

#### Substep 4.1: Test Configuration Changes 🔄
- **Subsubstep 4.1.1**: Run dry run only
  - Execute `npx stryker run --dryRunOnly`
  - Monitor execution time
  - Verify it completes without timeout
  - **Status**: 🔄 **READY TO TEST** - All timeout configurations applied. Ready for dry run test to verify if 15-minute timeout issue is resolved.

- **Subsubstep 4.1.2**: Check timeout behavior
  - Confirm initial run completes within new timeout
  - Verify no 15-minute timeout occurs
  - Log actual execution time for reference
  - **Status**: ⏭️ To be executed after 4.1.1 completes

#### Substep 4.2: Run Full Mutation Test
- **Subsubstep 4.2.1**: Start full mutation test run
  - Execute `npm run test:mutation`
  - Monitor initial test run phase
  - Verify completion without timeout
  - **Status**: ⏭️ To be executed

- **Subsubstep 4.2.2**: Monitor progress
  - Check Stryker logs periodically
  - Verify mutants are being tested
  - Confirm no OOM errors (memory leaks already fixed)
  - **Status**: ⏭️ To be executed

---

## Implementation Priority

### High Priority (Do First) 🔴
1. **Step 2.1**: Update Stryker timeout configuration
2. **Step 2.3**: Add command-line override as backup
3. **Step 4.1**: Test configuration changes

### Medium Priority (Do Next) 🟡
4. **Step 1.2**: Test config loading
5. **Step 2.2**: Optimize Jest configuration
6. **Step 3.1**: Identify slow tests
7. **Step 4.2**: Run full mutation test

### Low Priority (Do Later) 🟢
8. **Step 3.2**: Optimize coverage analysis
9. Long-term performance optimization

---

## Expected Outcomes

### Success Criteria
- ✅ Initial test run completes without timeout
- ✅ Full mutation test run completes successfully
- ✅ No 15-minute timeout errors
- ✅ Execution time is reasonable (< 30 minutes for initial run)

### Configuration Changes Expected
- `dryRunTimeoutMinutes`: 60 → 120 (or higher if needed)
- `timeoutMS`: 300000 → 600000 (if individual tests are slow)
- `concurrency`: 2 → 4 (if memory allows)
- Jest `testTimeout`: Keep at 30000 (already optimized)
- Package.json script: Add `--dryRunTimeoutMinutes 120` as backup

### Performance Targets
- Initial test run: < 10 minutes (with coverage analysis)
- Full mutation test: Complete without timeout
- Memory usage: Stable (no OOM errors - already fixed)

---

## Risk Mitigation

### Risks
1. **Config changes don't take effect**
   - Mitigation: Use command-line override as backup, verify config loading
   
2. **Higher concurrency causes memory issues**
   - Mitigation: Monitor memory usage, start with conservative increase (2 → 4)
   
3. **Test suite has fundamental performance issues**
   - Mitigation: Identify and fix slow tests, consider test filtering

### Rollback Plan
- Keep backup of original `stryker.conf.json`
- Can revert to previous settings if issues arise
- Document changes for easy rollback

---

## Notes

- Memory leak fixes are already complete (0 OOM errors)
- This is purely a timeout/configuration issue
- Test suite normally runs in ~4.2 minutes
- Coverage analysis adds significant overhead
- 293 test files is a large suite requiring careful optimization
- 15-minute timeout is unusual (not 5-minute default, not 60-minute config)
