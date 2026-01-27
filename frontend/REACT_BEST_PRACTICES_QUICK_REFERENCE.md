# React Best Practices - Quick Reference

## 🚨 Critical Issues (Fix Immediately)

### 1. PropertyPanel.tsx - Import Order
**Line 30-32:** Move imports to top of file

### 2. Type Safety - Replace `any` Types
**Files to fix:**
- `PropertyPanel.tsx`: `nodes?: any[]` → `nodes?: Node[]`
- `MarketplaceDialog.tsx`: `node?: any` → `node?: Node`
- `ExecutionConsole.tsx`: `log: any` → `log: ExecutionLog`
- `NodeContextMenu.tsx`: `node?: any` → `node?: Node`
- `ExecutionInputDialog.tsx`: `Record<string, any>` → `Record<string, string | number | boolean>`
- `NodePanel.tsx`: `useState<any[]>([])` → `useState<CustomAgentNode[]>([])`
- `WorkflowTabsContext.tsx`: `nodes: Record<string, any>`, `logs: any[]` → Proper types

### 3. useEffect Dependencies
**Files with eslint-disable:**
- `WorkflowChat.tsx` (line 82)
- `useLLMProviders.ts` (line 192)
- `useOfficialAgentSeeding.ts` (line 213)

**Fix:** Use refs or add proper dependencies

---

## ⚡ Performance Issues

### 1. WorkflowList.tsx
**Line 37:** Wrap `loadWorkflows` in `useCallback`

### 2. WorkflowBuilder.tsx
**Lines 331-332:** Memoize `workflowTabs.find()` result (called twice)

```typescript
const activeTabData = useMemo(() => 
  workflowTabs?.find(t => t.workflowId === localWorkflowId),
  [workflowTabs, localWorkflowId]
)
```

### 3. Duplicate useEffect
**WorkflowBuilder.tsx:** Lines 171-173 and 206-208 both update `workflowIdRef` - consolidate

---

## 📋 Code Organization

### 1. Error Handling
**Replace:** `catch (error: any)` → `catch (error: unknown)`

**Pattern:**
```typescript
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  showError('Failed: ' + message)
}
```

### 2. Inline Functions
**Consider:** Wrap handlers in `useCallback` if passed to child components

---

## ✅ What's Already Good

1. ✅ Custom hooks well-organized (SRP)
2. ✅ Components properly extracted (KeyboardHandler, ReactFlowInstanceCapture)
3. ✅ Context providers used appropriately
4. ✅ useMemo used for expensive calculations
5. ✅ Refs used correctly for non-render values
6. ✅ TypeScript used throughout

---

## 📊 Statistics

- **Total Issues:** ~25
- **Critical:** 8
- **Medium:** 12  
- **Low:** 5

**By Category:**
- Type Safety: 60%
- Performance: 20%
- Organization: 12%
- Hooks: 8%

---

## 🎯 Implementation Order

1. **Week 1:** Fix imports, replace `any` types, fix useEffect deps
2. **Week 2:** Add useCallback/useMemo, improve error handling
3. **Week 3-4:** Refactor large components, extract reusable parts
