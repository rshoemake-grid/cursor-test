# Legacy Code Documentation

**Date:** January 26, 2026  
**Purpose:** Document unused code and legacy implementations that have been replaced by newer, better components

---

## Overview

This document identifies code that is no longer actively used but remains in the codebase for reference or historical purposes. These sections should be considered for removal in future refactoring efforts to reduce code complexity and improve maintainability.

---

## 1. PropertyPanel.tsx - Legacy Input Node Configurations

### 1.1 GCP Bucket Configuration (Lines 823-894)

**Status:** ⚠️ **DEAD CODE** - Condition can never be true

**Location:** `frontend/src/components/PropertyPanel.tsx:823-894`

**Issue:**
```typescript
{/* GCP Bucket configuration - Legacy (kept for reference, replaced by InputNodeEditor above) */}
{selectedNode.type === 'gcp_bucket' && !['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem'].includes(selectedNode.type) && (
```

**Problem:** The condition `selectedNode.type === 'gcp_bucket' && !['gcp_bucket', ...].includes(selectedNode.type)` is logically impossible. If `type === 'gcp_bucket'`, then it will always be included in the array, making the second part of the condition always false.

**Replaced By:** `InputNodeEditor` component (lines 816-821)

**Current Implementation:**
```typescript
{isInputNode(selectedNode) && ['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem'].includes(selectedNode.type) && (
  <InputNodeEditor
    node={selectedNode}
    onConfigUpdate={handleConfigUpdate}
  />
)}
```

**Recommendation:** **DELETE** - This code block is unreachable and should be removed.

---

### 1.2 AWS S3 Configuration (Lines 896-994)

**Status:** ⚠️ **LEGACY CODE** - Still active but should be replaced

**Location:** `frontend/src/components/PropertyPanel.tsx:896-994`

**Issue:** This configuration block is still being rendered for `aws_s3` nodes, but `InputNodeEditor` already handles `aws_s3` nodes (see line 816).

**Current State:**
- `InputNodeEditor` handles `aws_s3` nodes when `isInputNode(selectedNode)` is true
- This legacy block renders when `selectedNode.type === 'aws_s3'` (without the `isInputNode` check)
- This creates potential duplication

**Replaced By:** `InputNodeEditor` component should handle all `aws_s3` cases

**Recommendation:** **REVIEW & REMOVE** - Verify that `InputNodeEditor` handles all `aws_s3` cases, then remove this block.

---

### 1.3 GCP Pub/Sub Configuration (Lines 996-1079)

**Status:** ⚠️ **LEGACY CODE** - Marked as legacy but still conditionally active

**Location:** `frontend/src/components/PropertyPanel.tsx:996-1079`

**Comment:** `{/* GCP Pub/Sub configuration - Legacy (replaced by InputNodeEditor above) */}`

**Condition:**
```typescript
{selectedNode.type === 'gcp_pubsub' && !isInputNode(selectedNode) && (
```

**Issue:** This renders when `gcp_pubsub` is NOT an input node, but `InputNodeEditor` handles `gcp_pubsub` when it IS an input node. This suggests there might be edge cases, but the comment indicates it's legacy.

**Replaced By:** `InputNodeEditor` component (lines 816-821)

**Recommendation:** **REVIEW & REMOVE** - Verify if `gcp_pubsub` nodes can exist without being input nodes. If not, remove this block.

---

### 1.4 Local File System Configuration (Lines 1548-1640)

**Status:** ⚠️ **LEGACY CODE** - Not explicitly marked but likely legacy

**Location:** `frontend/src/components/PropertyPanel.tsx:1548-1640`

**Issue:** `InputNodeEditor` handles `local_filesystem` nodes (line 816), but this block also renders for `local_filesystem` nodes.

**Current State:**
- `InputNodeEditor` handles `local_filesystem` when `isInputNode(selectedNode)` is true
- This block renders when `selectedNode.type === 'local_filesystem'`
- Potential duplication

**Replaced By:** `InputNodeEditor` component should handle all `local_filesystem` cases

**Recommendation:** **REVIEW & REMOVE** - Verify that `InputNodeEditor` handles all `local_filesystem` cases, then remove this block.

---

### 1.5 Database Configuration (Lines 1082-1254)

**Status:** ⚠️ **ACTIVE BUT SHOULD BE EXTRACTED**

**Location:** `frontend/src/components/PropertyPanel.tsx:1082-1254`

**Issue:** Database configuration is still handled directly in `PropertyPanel`, but `InputNodeEditor` has a note indicating it should be extracted (see `InputNodeEditor.tsx:472-486`).

**Current State:**
- `InputNodeEditor` returns a placeholder for database nodes (lines 472-486)
- Actual database configuration is in `PropertyPanel.tsx`
- This violates Single Responsibility Principle

**Note from InputNodeEditor:**
```typescript
// Database, Firebase, and BigQuery are more complex - return simplified version for now
// These can be extracted into separate components later if needed
```

**Recommendation:** **EXTRACT** - Create a `DatabaseNodeEditor` component similar to other node editors, or extend `InputNodeEditor` to handle database nodes properly.

---

### 1.6 Firebase Configuration (Lines 1256-1399)

**Status:** ⚠️ **ACTIVE BUT SHOULD BE EXTRACTED**

**Location:** `frontend/src/components/PropertyPanel.tsx:1256-1399`

**Issue:** Similar to database configuration, Firebase is handled directly in `PropertyPanel` but should be extracted.

**Recommendation:** **EXTRACT** - Create a `FirebaseNodeEditor` component or extend `InputNodeEditor` to handle Firebase nodes.

---

### 1.7 BigQuery Configuration (Lines 1401-1545)

**Status:** ⚠️ **ACTIVE BUT SHOULD BE EXTRACTED**

**Location:** `frontend/src/components/PropertyPanel.tsx:1401-1545`

**Issue:** Similar to database and Firebase, BigQuery is handled directly in `PropertyPanel` but should be extracted.

**Recommendation:** **EXTRACT** - Create a `BigQueryNodeEditor` component or extend `InputNodeEditor` to handle BigQuery nodes.

---

## 2. PropertyPanel.tsx - Unused State Variables and Refs

### 2.1 Input Config State Variables (Lines 148-161)

**Status:** ⚠️ **PARTIALLY UNUSED** - Some may still be used by legacy blocks

**Location:** `frontend/src/components/PropertyPanel.tsx:148-161`

**Variables:**
- `bucketNameValue`, `setBucketNameValue`
- `objectPathValue`, `setObjectPathValue`
- `gcpCredentialsValue`, `setGcpCredentialsValue`
- `objectKeyValue`, `setObjectKeyValue`
- `accessKeyIdValue`, `setAccessKeyIdValue`
- `secretKeyValue`, `setSecretKeyValue`
- `regionValue`, `setRegionValue`
- `projectIdValue`, `setProjectIdValue`
- `topicNameValue`, `setTopicNameValue`
- `subscriptionNameValue`, `setSubscriptionNameValue`
- `filePathValue`, `setFilePathValue`
- `filePatternValue`, `setFilePatternValue`
- `modeValue`, `setModeValue`
- `overwriteValue`, `setOverwriteValue`

**Comment:** `// Input config local state`

**Issue:** These state variables are used by legacy input node configuration blocks (GCP Bucket, AWS S3, GCP Pub/Sub, Local File System). Since `InputNodeEditor` handles these node types, these state variables may be redundant.

**Used By:**
- Legacy GCP Bucket block (lines 830, 850, 865, 879)
- Legacy AWS S3 block (lines 903, 923, 938, 953, 968, 983)
- Legacy GCP Pub/Sub block (lines 1003, 1023, 1038, 1053, 1067)
- Legacy Local File System block (lines 1554, 1574, 1589, 1607, 1624)

**Recommendation:** **REVIEW & REMOVE** - If legacy blocks are removed, these state variables can be removed. However, they may still be needed for database/firebase/bigquery nodes if those remain in PropertyPanel.

---

### 2.2 Input Config Refs (Lines 66-77)

**Status:** ⚠️ **PARTIALLY UNUSED** - Used by legacy blocks

**Location:** `frontend/src/components/PropertyPanel.tsx:66-77`

**Refs:**
- `bucketNameRef`, `objectPathRef`, `gcpCredentialsRef`
- `objectKeyRef`, `accessKeyIdRef`, `secretKeyRef`, `regionRef`
- `projectIdRef`, `topicNameRef`, `subscriptionNameRef`
- `filePathRef`, `filePatternRef`

**Comment:** `// Input config refs`

**Issue:** These refs are used to prevent flickering when syncing with node data (see lines 256-294), but they're primarily used by legacy input node configuration blocks.

**Used By:**
- Node data synchronization useEffect (lines 256-294)
- Legacy input node configuration blocks

**Recommendation:** **REVIEW & REMOVE** - If legacy blocks are removed and `InputNodeEditor` handles all input nodes, these refs may not be needed in `PropertyPanel`.

---

### 2.3 Config Field State (Removed)

**Status:** ✅ **ALREADY REMOVED** - Good refactoring

**Location:** Comment at line 145: `// Local state for config fields removed - now handled by node-specific editors`

**Previous State:** Config fields for agent_config, condition_config, loop_config were previously managed in PropertyPanel.

**Current State:** Now handled by:
- `AgentNodeEditor` - handles `agent_config`
- `ConditionNodeEditor` - handles `condition_config`
- `LoopNodeEditor` - handles `loop_config`

**Status:** ✅ This refactoring is complete and correct.

---

### 2.4 Config Field Refs (Removed)

**Status:** ✅ **ALREADY REMOVED** - Good refactoring

**Location:** Comment at line 63: `// Refs removed - now handled by node-specific editors`

**Previous State:** Refs for agent_config, condition_config, loop_config fields were previously in PropertyPanel.

**Current State:** Now handled by node-specific editors.

**Status:** ✅ This refactoring is complete and correct.

---

## 3. WorkflowTabs.tsx - Storage Functions Removed

**Status:** ✅ **ALREADY REFACTORED** - Good refactoring

**Location:** `frontend/src/components/WorkflowTabs.tsx:23`

**Comment:** `// Storage functions removed - now handled by WorkflowTabsContext`

**Previous State:** Storage logic was previously in `WorkflowTabs.tsx`.

**Current State:** Now handled by `WorkflowTabsContext.tsx` (Context API implementation).

**Status:** ✅ This refactoring is complete and correct.

---

## 4. InputNodeEditor.tsx - Placeholder for Complex Nodes

**Status:** ⚠️ **INCOMPLETE IMPLEMENTATION**

**Location:** `frontend/src/components/editors/InputNodeEditor.tsx:472-486`

**Code:**
```typescript
// Database, Firebase, and BigQuery are more complex - return simplified version for now
// These can be extracted into separate components later if needed
return (
  <div className="border-t pt-4">
    <h4 className="text-sm font-semibold text-gray-900 mb-3">
      {node.type === 'database' && 'Database Configuration'}
      {node.type === 'firebase' && 'Firebase Configuration'}
      {node.type === 'bigquery' && 'BigQuery Configuration'}
    </h4>
    <p className="text-xs text-gray-500">
      Configuration for {node.type} nodes is handled in PropertyPanel. 
      Consider extracting to a separate component for better organization.
    </p>
  </div>
)
```

**Issue:** `InputNodeEditor` doesn't fully handle `database`, `firebase`, and `bigquery` nodes. These are still handled in `PropertyPanel.tsx`.

**Recommendation:** **EXTRACT** - Create separate editor components:
- `DatabaseNodeEditor.tsx`
- `FirebaseNodeEditor.tsx`
- `BigQueryNodeEditor.tsx`

Or extend `InputNodeEditor` to handle these cases properly.

---

## 5. Summary of Recommendations

### High Priority (Dead/Unreachable Code)

1. **DELETE** - GCP Bucket Legacy Block (lines 823-894) - Condition can never be true
2. **REVIEW & DELETE** - AWS S3 Legacy Block (lines 896-994) - Likely redundant
3. **REVIEW & DELETE** - GCP Pub/Sub Legacy Block (lines 996-1079) - Marked as legacy
4. **REVIEW & DELETE** - Local File System Legacy Block (lines 1548-1640) - Likely redundant

### Medium Priority (Code Organization)

5. **EXTRACT** - Database Configuration (lines 1082-1254) → `DatabaseNodeEditor.tsx`
6. **EXTRACT** - Firebase Configuration (lines 1256-1399) → `FirebaseNodeEditor.tsx`
7. **EXTRACT** - BigQuery Configuration (lines 1401-1545) → `BigQueryNodeEditor.tsx`
8. **COMPLETE** - `InputNodeEditor` implementation for database/firebase/bigquery

### Low Priority (Cleanup After Removal)

9. **REMOVE** - Input config state variables (lines 148-161) after legacy blocks removed
10. **REMOVE** - Input config refs (lines 66-77) after legacy blocks removed

---

## 6. Impact Analysis

### Code Reduction Potential

If all legacy blocks are removed:
- **~700+ lines** could be removed from `PropertyPanel.tsx`
- **~15 state variables** could be removed
- **~12 refs** could be removed
- **Improved maintainability** - Single source of truth for input node configuration

### Testing Impact

- Legacy code blocks are currently **uncovered** in tests (see coverage report)
- Removing them would improve overall coverage percentage
- Tests would focus on `InputNodeEditor` component instead

### Migration Path

1. **Phase 1:** Verify `InputNodeEditor` handles all cases for `gcp_bucket`, `aws_s3`, `gcp_pubsub`, `local_filesystem`
2. **Phase 2:** Remove dead code (GCP Bucket block with impossible condition)
3. **Phase 3:** Remove redundant legacy blocks (AWS S3, GCP Pub/Sub, Local File System)
4. **Phase 4:** Extract database/firebase/bigquery to separate editors
5. **Phase 5:** Clean up unused state variables and refs

---

## 7. Files Affected

### Primary File
- `frontend/src/components/PropertyPanel.tsx` - Contains all legacy input node configurations

### Related Files
- `frontend/src/components/editors/InputNodeEditor.tsx` - New component that replaces legacy code
- `frontend/src/components/editors/AgentNodeEditor.tsx` - Example of proper node editor pattern
- `frontend/src/components/editors/ConditionNodeEditor.tsx` - Example of proper node editor pattern
- `frontend/src/components/editors/LoopNodeEditor.tsx` - Example of proper node editor pattern

---

## 8. Notes

- All legacy code blocks are marked with comments indicating they're legacy
- The refactoring to use node-specific editors (`AgentNodeEditor`, `ConditionNodeEditor`, `LoopNodeEditor`, `InputNodeEditor`) follows the Single Responsibility Principle
- Some legacy blocks may still be conditionally active, so careful review is needed before removal
- Database, Firebase, and BigQuery configurations are more complex and may require separate components rather than being handled by `InputNodeEditor`

---

**Last Updated:** January 26, 2026  
**Next Review:** After InputNodeEditor is fully implemented for all input node types
