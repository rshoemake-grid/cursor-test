# Phase 8: ESLint Rules for Domain-Based Imports

## Overview

Add ESLint rules to enforce domain-based import patterns established in Phase 7. This ensures consistency across the codebase and prevents regression to old import patterns.

## Goals

1. **Enforce Domain Imports**: Prevent direct imports from `../hooks/useHookName`
2. **Encourage Best Practices**: Guide developers to use domain-based imports
3. **Maintain Consistency**: Ensure all new code follows Phase 7 patterns
4. **Gradual Migration**: Allow warnings initially, then errors later

## Implementation Strategy

### Step 1: Analyze Current ESLint Configuration
- Check existing ESLint setup
- Identify custom rules already in place
- Determine rule priority (warn vs error)

### Step 2: Create Custom ESLint Rule
- Rule name: `no-direct-hook-imports`
- Pattern: Block imports matching `../hooks/use[A-Z]`
- Allow: Domain imports (`../hooks/domain`)
- Allow: Utility imports (`../hooks/utils/...`)

### Step 3: Configure Rule Severity
- **Phase 8.1**: Set to `warn` (non-blocking)
- **Phase 8.2**: Set to `error` (blocking) after team adoption

### Step 4: Add Rule Documentation
- Document rule purpose and examples
- Provide migration examples
- Add to project README

## ESLint Rule Details

### Rule: `no-direct-hook-imports`

**Pattern to Block:**
```typescript
// ❌ Blocked
import { useWorkflowExecution } from '../hooks/useWorkflowExecution'
import { useNodeSelection } from '../hooks/useNodeSelection'
```

**Patterns to Allow:**
```typescript
// ✅ Allowed - Domain imports
import { useWorkflowExecution } from '../hooks/execution'
import { useNodeSelection } from '../hooks/nodes'

// ✅ Allowed - Utility imports
import { getStorageItem } from '../hooks/utils/storageValidation'
import { logger } from '../utils/logger'

// ✅ Allowed - Other hooks directory imports
import { something } from '../hooks/index'
```

### Rule Configuration

```json
{
  "rules": {
    "no-direct-hook-imports": ["warn", {
      "domains": [
        "execution",
        "workflow", 
        "marketplace",
        "tabs",
        "nodes",
        "ui",
        "storage",
        "providers",
        "api",
        "forms"
      ],
      "allowUtils": true,
      "allowIndex": true
    }]
  }
}
```

## Domain Mapping Reference

| Old Import | New Domain Import |
|-----------|-------------------|
| `useExecutionManagement` | `../hooks/execution` |
| `useWorkflowExecution` | `../hooks/execution` |
| `useWebSocket` | `../hooks/execution` |
| `useWorkflowAPI` | `../hooks/workflow` |
| `useWorkflowState` | `../hooks/workflow` |
| `useWorkflowLoader` | `../hooks/workflow` |
| `useWorkflowPersistence` | `../hooks/workflow` |
| `useMarketplaceData` | `../hooks/marketplace` |
| `useTemplateOperations` | `../hooks/marketplace` |
| `useTabOperations` | `../hooks/tabs` |
| `useTabRenaming` | `../hooks/tabs` |
| `useNodeOperations` | `../hooks/nodes` |
| `useNodeSelection` | `../hooks/nodes` |
| `useCanvasEvents` | `../hooks/ui` |
| `useContextMenu` | `../hooks/ui` |
| `useKeyboardShortcuts` | `../hooks/ui` |
| `useLocalStorage` | `../hooks/storage` |
| `useAutoSave` | `../hooks/storage` |
| `useLLMProviders` | `../hooks/providers` |
| `useProviderManagement` | `../hooks/providers` |
| `useAuthenticatedApi` | `../hooks/api` |
| `useFormField` | `../hooks/forms` |
| `usePublishForm` | `../hooks/forms` |

## Implementation Options

### Option 1: Custom ESLint Plugin (Recommended)
- Create `eslint-plugin-domain-imports`
- Full control over rule behavior
- Can provide auto-fix suggestions
- More maintainable long-term

### Option 2: ESLint `no-restricted-imports` Rule
- Use built-in ESLint rule
- Simpler implementation
- Less flexible
- Good for quick implementation

### Option 3: TypeScript Path Mapping + ESLint
- Use TypeScript path aliases
- Configure ESLint to enforce aliases
- Better IDE support
- More complex setup

## Recommended Approach: Option 2 (Quick Start)

Use ESLint's built-in `no-restricted-imports` rule for Phase 8.1, then consider custom plugin for Phase 8.2.

### Configuration Example

```json
{
  "rules": {
    "no-restricted-imports": ["warn", {
      "paths": [
        {
          "name": "../hooks/useExecutionManagement",
          "message": "Use domain import: import { useExecutionManagement } from '../hooks/execution'"
        },
        {
          "name": "../hooks/useWorkflowExecution", 
          "message": "Use domain import: import { useWorkflowExecution } from '../hooks/execution'"
        }
        // ... more patterns
      ],
      "patterns": [
        {
          "group": ["../hooks/use[A-Z]*"],
          "message": "Use domain-based imports instead. See PHASE7_COMPLETE_SUMMARY.md for mapping."
        }
      ]
    }]
  }
}
```

## Benefits

1. **Consistency**: All developers use same import patterns
2. **Prevent Regression**: Old patterns caught automatically
3. **Onboarding**: New developers guided to best practices
4. **Code Quality**: Maintains Phase 7 improvements
5. **Documentation**: Rule messages provide guidance

## Migration Path

### Phase 8.1: Warnings (Week 1-2)
- Add rule as `warn` severity
- Team adapts to new patterns
- Fix existing violations gradually

### Phase 8.2: Errors (Week 3+)
- Change rule to `error` severity
- All new code must use domain imports
- CI/CD enforces rule

## Testing Strategy

1. **Verify Rule Works**: Test with old import patterns
2. **Verify Rule Allows**: Test with domain imports
3. **Test Auto-fix**: If custom plugin created
4. **CI Integration**: Ensure rule runs in CI/CD

## Files to Create/Modify

1. **ESLint Configuration**
   - Update `.eslintrc.js` or `eslint.config.js`
   - Add `no-restricted-imports` rule configuration

2. **Documentation**
   - Update `PHASE8_COMPLETE_SUMMARY.md`
   - Add rule to project README
   - Create migration guide

3. **Scripts** (Optional)
   - Create script to find violations
   - Create script to auto-fix imports

## Success Criteria

- ✅ ESLint rule configured and active
- ✅ Rule catches old import patterns
- ✅ Rule allows domain imports
- ✅ Documentation updated
- ✅ Team aware of new rule
- ✅ CI/CD enforces rule

## Next Steps After Phase 8

1. **Phase 9**: File reorganization (move hooks to domain folders)
2. **Phase 10**: Additional utility extraction
3. **Phase 11**: Performance optimizations
4. **Phase 12**: Additional test coverage improvements
