# Surviving Mutants Priority Analysis

**Date:** February 3, 2026  
**Total Surviving Mutants:** 790

---

## Analysis Summary

Based on the mutation test results, here's a prioritized approach to addressing surviving mutants:

### Mutator Type Distribution

The most common mutator types in the codebase:
1. **ConditionalExpression** - 1,448 mutants (ternary operators)
2. **BlockStatement** - 922 mutants (code blocks)
3. **StringLiteral** - 921 mutants (string values)
4. **LogicalOperator** - 391 mutants (&&, ||)
5. **EqualityOperator** - 331 mutants (===, !==)
6. **BooleanLiteral** - 239 mutants (true/false)
7. **ObjectLiteral** - 207 mutants (object creation)
8. **ArrowFunction** - 186 mutants (arrow functions)
9. **ArrayDeclaration** - 176 mutants (array creation)
10. **MethodExpression** - 104 mutants (method calls)
11. **OptionalChaining** - 74 mutants (?., ?[])
12. **ArithmeticOperator** - 24 mutants (+, -, *, /)

---

## Priority Areas for Improvement

### 1. Conditional Expressions (Highest Priority)
**Count:** 1,448 total mutants  
**Focus:** Ternary operators and conditional logic

**Common Patterns:**
- `condition ? valueA : valueB`
- Nested ternaries
- Default value assignments

**Action Items:**
- Add tests for all branches of ternary operators
- Test edge cases where condition is exactly true/false
- Verify both branches produce expected results

### 2. Block Statements
**Count:** 922 total mutants  
**Focus:** Code blocks and control flow

**Common Patterns:**
- Empty blocks `{}`
- Early returns
- Conditional blocks

**Action Items:**
- Ensure all code paths are tested
- Add tests for empty block scenarios
- Test early return conditions

### 3. String Literals
**Count:** 921 total mutants  
**Focus:** String comparisons and assignments

**Common Patterns:**
- Exact string matches (`=== 'value'`)
- String concatenation
- Template literals

**Action Items:**
- Add tests for exact string matches
- Test string edge cases (empty, whitespace)
- Verify string comparisons handle all cases

### 4. Logical Operators
**Count:** 391 total mutants  
**Focus:** Boolean logic (&&, ||)

**Common Patterns:**
- `condition1 && condition2`
- `condition1 || condition2`
- Short-circuit evaluation

**Action Items:**
- Test all combinations of boolean values
- Verify short-circuit behavior
- Test with null/undefined values

### 5. Equality Operators
**Count:** 331 total mutants  
**Focus:** Comparison operators (===, !==)

**Common Patterns:**
- `value === expected`
- `value !== expected`
- Type and value comparisons

**Action Items:**
- Test exact equality cases
- Test with different types
- Verify strict vs loose equality

---

## Files Needing Attention

Based on the mutation test results, focus on files with:
- High number of surviving mutants
- Low mutation scores (< 80%)
- Complex conditional logic
- Many edge cases

### Recommended Review Order

1. **Hooks with comprehensive mutation tests** (already have tests, review survivors)
   - `useCanvasEvents.ts`
   - `useLLMProviders.ts`
   - `useMarketplaceIntegration.ts`
   - `useWebSocket.ts`
   - `useExecutionManagement.ts`
   - `useTemplateOperations.ts`

2. **Hooks without mutation tests** (add mutation tests first)
   - Review other hooks in `src/hooks/`
   - Focus on hooks with complex logic

3. **Utility functions** (`src/utils/`)
   - Review utility functions with many conditionals
   - Focus on error handling paths

4. **Editor components** (`src/components/editors/`)
   - Review component logic
   - Focus on event handlers and state management

---

## Action Plan

### Phase 1: Review & Document (Current)
- ✅ Identify surviving mutant types
- ✅ Document priority areas
- ⏭️ Review HTML report for specific locations
- ⏭️ Create file-level priority list

### Phase 2: Targeted Testing
1. **Conditional Expressions**
   - Add tests for all ternary branches
   - Test default value assignments
   - Verify edge cases

2. **Logical Operators**
   - Test all boolean combinations
   - Verify short-circuit behavior
   - Test with null/undefined

3. **Equality Operators**
   - Test exact matches
   - Test type comparisons
   - Verify edge cases

### Phase 3: Validation
1. Re-run mutation tests
2. Verify improvement in mutation score
3. Target: > 85% mutation score

---

## Expected Impact

Based on mutator type distribution:
- **Conditional Expressions:** Addressing these could improve score by 5-10%
- **Logical Operators:** Addressing these could improve score by 3-5%
- **Equality Operators:** Addressing these could improve score by 2-4%

**Total Expected Improvement:** +10-19% mutation score  
**Target Score:** > 90% (currently 83%)

---

## Next Steps

1. **Open HTML Report**
   ```bash
   open frontend/reports/mutation/mutation.html
   ```

2. **Review Specific Mutants**
   - Filter by mutator type
   - Sort by file
   - Identify patterns

3. **Create Targeted Tests**
   - Focus on high-priority mutator types
   - Add edge case tests
   - Verify mutants are killed

4. **Re-run Mutation Tests**
   ```bash
   npm run test:mutation
   ```

---

## Notes

- The HTML report provides detailed information about each surviving mutant
- Focus on mutator types with the highest counts first
- Many surviving mutants may be in code paths that are difficult to test
- Some mutants may represent equivalent code (not actual bugs)

---

## Resources

- **HTML Report:** `frontend/reports/mutation/mutation.html`
- **Analysis:** `frontend/MUTATION_TEST_ANALYSIS.md`
- **Summary:** `frontend/MUTATION_TEST_RESULTS_SUMMARY.md`
