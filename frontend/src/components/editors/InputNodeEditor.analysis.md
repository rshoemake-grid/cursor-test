# InputNodeEditor.tsx - Coverage Analysis

## File Overview
- **Total Lines**: 487
- **No Coverage Mutants**: 31
- **Existing Tests**: 252 test cases

## Component Breakdown

### 1. State Initialization (lines 19-53)
**Purpose**: Initialize refs and state for all input fields

**Code Paths**:
- ✅ All refs initialized (tested)
- ✅ All state initialized (tested)

### 2. useEffect - Sync State (lines 56-95)
**Purpose**: Sync local state with node data, avoiding updates when field is focused

**Complex Logic Flow**:
- ✅ `inputConfig` extraction (tested)
- ✅ Multiple `document.activeElement !== ref.current` checks (tested)
- ✅ Fallback values with `||` operators (tested)
- ✅ `inputConfig.mode || 'read'` (tested)
- ✅ `inputConfig.overwrite ?? true` (tested)

**Potential Uncovered Paths**:
- ❓ `node.data.input_config || {}` - exact fallback
- ❓ `document.activeElement !== bucketNameRef.current` - exact comparison for each ref
- ❓ `inputConfig.bucket_name || ''` - exact fallback
- ❓ `inputConfig.object_path || ''` - exact fallback
- ❓ `inputConfig.credentials || ''` - exact fallback
- ❓ `inputConfig.object_key || ''` - exact fallback
- ❓ `inputConfig.access_key_id || ''` - exact fallback
- ❓ `inputConfig.secret_access_key || ''` - exact fallback
- ❓ `inputConfig.region || 'us-east-1'` - exact fallback
- ❓ `inputConfig.project_id || ''` - exact fallback
- ❓ `inputConfig.topic_name || ''` - exact fallback
- ❓ `inputConfig.subscription_name || ''` - exact fallback
- ❓ `inputConfig.file_path || ''` - exact fallback
- ❓ `inputConfig.file_pattern || ''` - exact fallback
- ❓ `inputConfig.mode || 'read'` - exact fallback
- ❓ `inputConfig.overwrite ?? true` - nullish coalescing

### 3. Conditional Rendering by Node Type (lines 98-486)
**Purpose**: Render appropriate UI based on node type

**Node Types**:
1. **GCP Bucket** (lines 98-177):
   - ✅ Renders (tested)
   - ✅ Mode select (tested)
   - ✅ Bucket name input (tested)
   - ✅ Object path input (tested)
   - ✅ Credentials textarea (tested)
   - ✅ onChange handlers (tested)

2. **AWS S3** (lines 181-291):
   - ✅ Renders (tested)
   - ✅ Mode select (tested)
   - ✅ Bucket name input (tested)
   - ✅ Object key input (tested)
   - ✅ Access key ID input (tested)
   - ✅ Secret key input (tested)
   - ✅ Region input (tested)
   - ✅ onChange handlers (tested)

3. **GCP Pub/Sub** (lines 295-388):
   - ✅ Renders (tested)
   - ✅ Mode select (tested)
   - ✅ Project ID input (tested)
   - ✅ Topic name input (tested)
   - ✅ Subscription name input (tested)
   - ✅ Credentials textarea (tested)
   - ✅ onChange handlers (tested)

4. **Local FileSystem** (lines 392-469):
   - ✅ Renders (tested)
   - ✅ Mode select (tested)
   - ✅ File path input (tested)
   - ✅ Conditional rendering: `modeValue === 'read'` (tested)
   - ✅ Conditional rendering: `modeValue === 'write'` (tested)
   - ✅ File pattern input (tested)
   - ✅ Overwrite checkbox (tested)
   - ✅ onChange handlers (tested)

5. **Database/Firebase/BigQuery** (lines 474-486):
   - ✅ Renders (tested)
   - ✅ Conditional text: `node.type === 'database'` (tested)
   - ✅ Conditional text: `node.type === 'firebase'` (tested)
   - ✅ Conditional text: `node.type === 'bigquery'` (tested)

**Potential Uncovered Paths**:
- ❓ `node.type === 'gcp_bucket'` - exact comparison
- ❓ `node.type === 'aws_s3'` - exact comparison
- ❓ `node.type === 'gcp_pubsub'` - exact comparison
- ❓ `node.type === 'local_filesystem'` - exact comparison
- ❓ `node.type === 'database'` - exact comparison
- ❓ `node.type === 'firebase'` - exact comparison
- ❓ `node.type === 'bigquery'` - exact comparison
- ❓ `modeValue === 'read'` - exact comparison
- ❓ `modeValue === 'write'` - exact comparison
- ❓ `e.target.value` - exact property access
- ❓ `e.target.checked` - exact property access

## Identified Gaps (31 no-coverage mutants likely in):

### High Priority:
1. **Conditional expression edge cases**:
   - `node.type === 'gcp_bucket'` - exact comparison
   - `node.type === 'aws_s3'` - exact comparison
   - `node.type === 'gcp_pubsub'` - exact comparison
   - `node.type === 'local_filesystem'` - exact comparison
   - `node.type === 'database'` - exact comparison
   - `node.type === 'firebase'` - exact comparison
   - `node.type === 'bigquery'` - exact comparison
   - `modeValue === 'read'` - exact comparison
   - `modeValue === 'write'` - exact comparison

2. **Logical OR operators**:
   - `node.data.input_config || {}` - exact fallback
   - All `inputConfig.field || defaultValue` - exact fallbacks
   - `inputConfig.mode || 'read'` - exact fallback

3. **Nullish coalescing**:
   - `inputConfig.overwrite ?? true` - exact nullish coalescing

4. **Document activeElement checks**:
   - `document.activeElement !== ref.current` - exact comparisons for each ref
   - All ref comparisons in useEffect

5. **Event property access**:
   - `e.target.value` - exact property access
   - `e.target.checked` - exact property access

## Recommended Test Additions:

1. **Node type comparison tests**:
   - Test exact `node.type === 'gcp_bucket'` comparison
   - Test exact `node.type === 'aws_s3'` comparison
   - Test exact `node.type === 'gcp_pubsub'` comparison
   - Test exact `node.type === 'local_filesystem'` comparison
   - Test exact `node.type === 'database'` comparison
   - Test exact `node.type === 'firebase'` comparison
   - Test exact `node.type === 'bigquery'` comparison

2. **Mode value comparison tests**:
   - Test exact `modeValue === 'read'` comparison
   - Test exact `modeValue === 'write'` comparison

3. **Logical OR operator tests**:
   - Test `node.data.input_config || {}` when input_config is null/undefined
   - Test all `inputConfig.field || defaultValue` when field is null/undefined/empty

4. **Nullish coalescing tests**:
   - Test `inputConfig.overwrite ?? true` when overwrite is null vs undefined vs false vs true

5. **Document activeElement tests**:
   - Test `document.activeElement !== ref.current` for each ref when field is focused vs not focused

6. **Event property access tests**:
   - Test `e.target.value` exact property access
   - Test `e.target.checked` exact property access
