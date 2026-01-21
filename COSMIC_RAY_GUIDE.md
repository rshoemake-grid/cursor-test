# Cosmic Ray Mutation Testing Guide

## Overview

Cosmic Ray is a powerful mutation testing tool for Python that helps assess the quality of your test suite by introducing small changes (mutations) into your code.

## Installation

```bash
pip install cosmic-ray
```

## Configuration

The configuration file `cosmic-ray.toml` has been created with settings optimized for this project:

- **Module**: `backend` (code to mutate)
- **Test command**: Runs pytest with your existing test configuration
- **Timeout**: 300 seconds per test run
- **Distributor**: `local` (can be changed to `multiprocessing` for parallel execution)
- **Exclusions**: Test files, scripts, legacy code, and `__pycache__` directories

## Basic Workflow

### Step 1: Initialize Baseline

Before running mutations, establish a baseline to ensure your tests pass:

```bash
cosmic-ray baseline cosmic-ray.toml
```

This verifies that:
- All tests pass on unmutated code
- The configuration is correct
- The test suite is ready for mutation testing

### Step 2: Initialize Session

Create a mutation testing session:

```bash
cosmic-ray init cosmic-ray.toml <session-name>
```

Example:
```bash
cosmic-ray init cosmic-ray.toml session-1
```

This creates a session database that tracks all mutations and their results.

### Step 3: Execute Mutations

Run the mutation testing:

```bash
cosmic-ray exec cosmic-ray.toml <session-name>
```

Example:
```bash
cosmic-ray exec cosmic-ray.toml session-1
```

This will:
- Generate mutants for your code
- Run tests against each mutant
- Track which mutants are killed vs. survived
- Store results in the session database

**Note**: This can take a long time (30+ minutes for large codebases). You can stop and resume later.

### Step 4: View Results

Generate an HTML report:

```bash
cosmic-ray report <session-name> --html
```

Or view in terminal:

```bash
cosmic-ray report <session-name>
```

### Step 5: Generate HTML Report

```bash
cosmic-ray report <session-name> --html
```

This creates an HTML file you can open in your browser to see detailed mutation results.

## Advanced Usage

### Parallel Execution

To speed up mutation testing, use multiprocessing:

1. Edit `cosmic-ray.toml`:
   ```toml
   distributor = "multiprocessing"
   num-workers = 4  # Number of parallel workers
   ```

2. Run as usual:
   ```bash
   cosmic-ray exec cosmic-ray.toml session-1
   ```

### Specific Mutation Operators

To test only specific mutation operators, edit `cosmic-ray.toml`:

```toml
operators = [
    "BinaryOperatorReplacement",
    "ComparisonOperatorReplacement",
    "BooleanReplacer",
]
```

### Targeting Specific Modules

To mutate only specific modules, edit the `paths` section in `cosmic-ray.toml`:

```toml
paths = [
    "backend/agents/unified_llm_agent.py",
    "backend/engine/executor_v3.py",
]
```

### Resuming a Session

If a session is interrupted, you can resume it:

```bash
cosmic-ray exec cosmic-ray.toml session-1
```

Cosmic Ray will continue where it left off.

## Understanding Results

### Mutation Score

The mutation score is calculated as:
```
Mutation Score = (Killed Mutants / Total Mutants) × 100%
```

- **Higher score = better test suite**
- **Lower score = gaps in test coverage**

### Mutant States

- **Killed**: Test suite detected the mutation ✅
- **Survived**: Test suite didn't detect the mutation ⚠️
- **Incompetent**: Mutant is syntactically invalid
- **Timeout**: Mutant took too long to execute

### Surviving Mutants

Surviving mutants indicate:
- Missing test cases
- Weak assertions
- Untested edge cases
- Equivalent mutants (syntactically different but semantically equivalent)

## Tips

1. **Start Small**: Test on a single module first to understand the process
2. **Review Surviving Mutants**: Focus on mutants that survived - they reveal test gaps
3. **Iterate**: After improving tests, re-run to see improved mutation scores
4. **Use Parallel Execution**: For large codebases, multiprocessing significantly speeds things up
5. **Check Timeouts**: If many mutants timeout, increase the timeout value in config

## Troubleshooting

### Tests Fail During Baseline

If baseline fails:
- Ensure all tests pass: `pytest backend/tests/`
- Check that test paths in config are correct
- Verify pytest configuration

### Session Already Exists

If you get "session already exists" error:
- Use a different session name, or
- Delete the session: `rm -rf .cosmic-ray/sessions/<session-name>`

### Too Many Timeouts

If many mutants timeout:
- Increase `timeout` value in `cosmic-ray.toml`
- Check for infinite loops or slow operations in your code
- Consider excluding problematic modules

## Comparison with mutmut

| Feature | Cosmic Ray | mutmut |
|---------|------------|--------|
| Setup Complexity | More complex | Simpler |
| Configuration | TOML file required | Optional config |
| Parallel Execution | Built-in support | Built-in support |
| Session Management | Explicit sessions | Automatic |
| Custom Operators | Yes | Limited |
| HTML Reports | Yes | Yes |
| Best For | Large projects, advanced users | Quick setup, simpler workflows |

## Next Steps

1. Run baseline: `cosmic-ray baseline cosmic-ray.toml`
2. Create session: `cosmic-ray init cosmic-ray.toml session-1`
3. Execute: `cosmic-ray exec cosmic-ray.toml session-1`
4. Review results: `cosmic-ray report session-1 --html`

Happy mutating! 🧬

