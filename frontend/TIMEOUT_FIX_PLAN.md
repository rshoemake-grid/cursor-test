# Mutation Testing Timeout Fix Plan

## Problem Analysis

### Issue Summary
- **Error**: Initial test run timed out after exactly 15 minutes
- **Expected**: Should complete within 60 minutes (configured `dryRunTimeoutMinutes: 60`)
- **Actual**: Timed out at 15 minutes
- **Test Suite**: 293 test files, normally takes ~4.2 minutes

### Root Cause Analysis

1. **Configuration Discrepancy**
   - Config file has `dryRunTimeoutMinutes: 60` (60 minutes)
   - Error shows timeout at 15 minutes
   - Suggests config may not be applied correctly or there's another timeout mechanism

2. **Possible Causes**
   - Jest timeout interfering (`testTimeout: 30000` = 30 seconds per test)
   - Stryker's `timeoutMS: 300000` (5 minutes) might be affecting initial run
   - Test runner process timeout (Node.js default limits)
   - Coverage analysis overhead (`coverageAnalysis: "all"`) adding significant time
   - Low concurrency (`concurrency: 2`) causing sequential bottlenecks

3. **Test Suite Characteristics**
   - 293 test files
   - Normal execution: ~4.2 minutes
   - With coverage analysis: Significantly longer
   - With mutation testing overhead: Even longer

---

## Fix Plan: Steps, Substeps, and Subsubsteps

### Step 1: Verify Current Configuration
**Goal**: Confirm what's actually being used vs. what's configured

#### Substep 1.1: Check Stryker Config Loading
- **Subsubstep 1.1.1**: Verify config file is being read
  - Check if `stryker.conf.json` is in correct location
  - Verify JSON syntax is valid
  - Confirm no syntax errors preventing config load

- **Subsubstep 1.1.2**: Test config validation
  - Run `npx stryker run --dryRunOnly` to test config
  - Check for config validation errors
  - Verify `dryRunTimeoutMinutes` appears in loaded config

#### Substep 1.2: Check for Overriding Settings
- **Subsubstep 1.2.1**: Search for command-line overrides
  - Check package.json scripts for Stryker commands
  - Look for environment variables that might override config
  - Check CI/CD configs if applicable

- **Subsubstep 1.2.2**: Check Jest configuration conflicts
  - Verify `jest.config.cjs` doesn't have conflicting timeouts
  - Check if Jest's `testTimeout` is causing cumulative issues
  - Review if Jest's `maxWorkers` conflicts with Stryker's `concurrency`

#### Substep 1.3: Analyze Actual Timeout Behavior
- **Subsubstep 1.3.1**: Review Stryker logs
  - Check `.stryker-tmp` logs for timeout details
  - Identify exact timeout source (Stryker vs Jest vs Node)
  - Note any warnings about timeout configuration

- **Subsubstep 1.3.2**: Test with minimal config
  - Create minimal test run to isolate timeout source
  - Run with `--dryRunOnly` flag to test initial run only
  - Measure actual execution time vs timeout

---

### Step 2: Fix Configuration Issues
**Goal**: Ensure timeout settings are correctly applied

#### Substep 2.1: Update Stryker Configuration
- **Subsubstep 2.1.1**: Increase `dryRunTimeoutMinutes`
  - Change from `60` to `120` (2 hours) for safety margin
  - This provides buffer for slow runs
  - Accounts for coverage analysis overhead

- **Subsubstep 2.1.2**: Adjust `timeoutMS` for individual tests
  - Current: `300000` (5 minutes per test)
  - Consider: Increase to `600000` (10 minutes) if needed
  - Balance: Too high may hide real performance issues

- **Subsubstep 2.1.3**: Optimize `concurrency` setting
  - Current: `2` (very low, may cause bottlenecks)
  - Consider: Increase to `4` or `6` (balance between speed and memory)
  - Test: Monitor memory usage with higher concurrency

#### Substep 2.2: Optimize Jest Configuration
- **Subsubstep 2.2.1**: Review `testTimeout` setting
  - Current: `30000` (30 seconds per test)
  - Action: Keep at 30s unless specific tests need more
  - Consider: Add per-test timeout overrides for slow tests

- **Subsubstep 2.2.2**: Optimize Jest workers
  - Check if Jest's `maxWorkers` conflicts with Stryker's `concurrency`
  - Consider: Set Jest `maxWorkers` to match Stryker `concurrency`
  - Benefit: Prevents resource contention

#### Substep 2.3: Optimize Coverage Analysis
- **Subsubstep 2.3.1**: Review `coverageAnalysis` mode
  - Current: `"all"` (faster than `perTest` but less precise)
  - Consider: Keep `"all"` for speed (already optimized)
  - Alternative: If still slow, consider `"off"` temporarily for testing

- **Subsubstep 2.3.2**: Check coverage collection overhead
  - Verify coverage tools aren't adding excessive overhead
  - Consider: Disable coverage temporarily to test if that's the bottleneck
  - Re-enable: Once timeout is resolved

---

### Step 3: Address Test Suite Performance
**Goal**: Reduce initial test run time

#### Substep 3.1: Identify Slow Tests
- **Subsubstep 3.1.1**: Run Jest with timing information
  - Use `jest --listTests --verbose` to see all test files
  - Run `jest --verbose` to see individual test times
  - Identify tests taking > 10 seconds

- **Subsubstep 3.1.2**: Profile test execution
  - Use Jest's `--detectOpenHandles` to find hanging resources
  - Use `--forceExit` temporarily to identify cleanup issues
  - Check for tests that don't properly clean up

#### Substep 3.2: Optimize Slow Tests
- **Subsubstep 3.2.1**: Fix hanging tests
  - Add proper cleanup in `afterEach`/`afterAll`
  - Ensure WebSocket connections are closed
  - Ensure timers are cleared
  - Ensure event listeners are removed

- **Subsubstep 3.2.2**: Optimize test setup/teardown
  - Review `setupFilesAfterEnv` for efficiency
  - Minimize global setup overhead
  - Cache expensive setup operations

#### Substep 3.3: Consider Test Filtering
- **Subsubstep 3.3.1**: Use `testFiles` option (if needed)
  - Only as last resort if specific files are problematic
  - Filter out known slow/problematic test files temporarily
  - Re-add files once timeout is resolved

- **Subsubstep 3.3.2**: Use `mutate` patterns to reduce scope
  - Already configured to mutate specific directories
  - Verify patterns are correct
  - Consider narrowing scope temporarily for testing

---

### Step 4: Verify Fixes
**Goal**: Confirm timeout issue is resolved

#### Substep 4.1: Test Configuration Changes
- **Subsubstep 4.1.1**: Run dry run only
  - Execute `npx stryker run --dryRunOnly`
  - Monitor execution time
  - Verify it completes without timeout

- **Subsubstep 4.1.2**: Check timeout behavior
  - Confirm initial run completes within new timeout
  - Verify no 15-minute timeout occurs
  - Log actual execution time for reference

#### Substep 4.2: Run Full Mutation Test
- **Subsubstep 4.2.1**: Start full mutation test run
  - Execute `npm run test:mutation`
  - Monitor initial test run phase
  - Verify completion without timeout

- **Subsubstep 4.2.2**: Monitor progress
  - Check Stryker logs periodically
  - Verify mutants are being tested
  - Confirm no OOM errors (memory leaks already fixed)

#### Substep 4.3: Document Results
- **Subsubstep 4.3.1**: Record final configuration
  - Document all timeout settings used
  - Note actual execution times
  - Record any optimizations made

- **Subsubstep 4.3.2**: Update documentation
  - Update `stryker.conf.json` comments if needed
  - Document timeout rationale
  - Note any test suite optimizations

---

### Step 5: Long-term Optimization (Optional)
**Goal**: Improve test suite performance for future runs

#### Substep 5.1: Continuous Performance Monitoring
- **Subsubstep 5.1.1**: Track test execution times
  - Monitor test suite execution time over time
  - Alert if execution time increases significantly
  - Identify performance regressions early

- **Subsubstep 5.1.2**: Optimize test infrastructure
  - Consider parallel test execution improvements
  - Review test isolation and independence
  - Optimize shared test fixtures

#### Substep 5.2: Test Suite Health
- **Subsubstep 5.2.1**: Regular test suite audits
  - Identify and fix slow tests regularly
  - Remove redundant or obsolete tests
  - Optimize test data and mocks

- **Subsubstep 5.2.2**: Maintain cleanup patterns
  - Ensure all tests follow cleanup best practices
  - Document cleanup patterns for new tests
  - Review test code for resource leaks

---

## Implementation Priority

### High Priority (Do First)
1. **Step 1**: Verify current configuration
2. **Step 2.1**: Update Stryker timeout configuration
3. **Step 4.1**: Test configuration changes

### Medium Priority (Do Next)
4. **Step 2.2**: Optimize Jest configuration
5. **Step 3.1**: Identify slow tests
6. **Step 4.2**: Run full mutation test

### Low Priority (Do Later)
7. **Step 3.2**: Optimize slow tests
8. **Step 5**: Long-term optimization

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
- `concurrency`: 2 → 4-6 (if memory allows)
- Jest `testTimeout`: Keep at 30000 (already optimized)

### Performance Targets
- Initial test run: < 10 minutes (with coverage analysis)
- Full mutation test: Complete without timeout
- Memory usage: Stable (no OOM errors - already fixed)

---

## Risk Mitigation

### Risks
1. **Config changes don't take effect**
   - Mitigation: Verify config loading, test with `--dryRunOnly`
   
2. **Higher concurrency causes memory issues**
   - Mitigation: Monitor memory usage, start with conservative increase
   
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
