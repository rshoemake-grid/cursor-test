# Workflow Execution API - Implementation Plan

## Current Status

### ✅ Already Implemented

1. **Execute Workflow** (`POST /workflows/{workflow_id}/execute`)
   - ✅ Triggers workflow execution
   - ✅ Returns execution ID immediately
   - ✅ Runs execution in background
   - ✅ Creates execution record in database
   - ✅ Tracks start time (`started_at`)
   - ✅ Updates status on completion
   - ✅ Tracks completion time (`completed_at`)

2. **Get Execution Status** (`GET /executions/{execution_id}`)
   - ✅ Returns execution details
   - ✅ Includes status, result, error
   - ✅ Includes logs from state
   - ✅ Includes start/completion times

3. **Database Schema**
   - ✅ `ExecutionDB` model with all required fields
   - ✅ Status tracking (pending, running, completed, failed)
   - ✅ Time tracking (started_at, completed_at)
   - ✅ Log storage in JSON state field

4. **Logging Infrastructure**
   - ✅ Log entries stored during execution
   - ✅ Log structure with timestamp, level, node_id, message
   - ✅ Logs included in execution state

### ❌ Needs Implementation

1. **List Executions** (`GET /executions`)
   - ❌ Endpoint not implemented
   - ❌ Filtering by workflow_id, status, user_id
   - ❌ Pagination support

2. **Download Execution Logs** (`GET /executions/{execution_id}/logs/download`)
   - ❌ Endpoint not implemented
   - ❌ Text format export
   - ❌ JSON format export
   - ❌ File download headers

3. **Get Execution Logs** (`GET /executions/{execution_id}/logs`)
   - ❌ Endpoint not implemented
   - ❌ Log filtering (level, node_id)
   - ❌ Pagination for logs

4. **Cancel Execution** (`POST /executions/{execution_id}/cancel`)
   - ❌ Endpoint not implemented
   - ❌ Cancellation logic in executor
   - ❌ Status update to cancelled

5. **Enhanced Status Tracking**
   - ⚠️ `pending` status not fully implemented
   - ⚠️ `paused` status not implemented
   - ⚠️ `cancelled` status not implemented

6. **Rate Limiting**
   - ❌ Rate limiting middleware not implemented

---

## Implementation Tasks

### Phase 1: Core API Enhancements (Priority: High)

#### Task 1.1: List Executions Endpoint
**File:** `backend/api/routes/execution_routes.py`

```python
@router.get("/executions", response_model=ExecutionListResponse)
async def list_executions(
    workflow_id: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """List executions with filtering and pagination"""
    # Implementation needed
```

**Schema:** Add `ExecutionListResponse` to `backend/models/schemas.py`

**Estimated Time:** 2 hours

---

#### Task 1.2: Download Logs Endpoint
**File:** `backend/api/routes/execution_routes.py`

```python
@router.get("/executions/{execution_id}/logs/download")
async def download_execution_logs(
    execution_id: str,
    format: str = Query("text", regex="^(text|json)$"),
    db: AsyncSession = Depends(get_db)
):
    """Download execution logs as file"""
    # Implementation needed
```

**Features:**
- Format logs as text file
- Format logs as JSON file
- Set proper Content-Disposition headers
- Handle large log files efficiently

**Estimated Time:** 3 hours

---

#### Task 1.3: Get Logs Endpoint
**File:** `backend/api/routes/execution_routes.py`

```python
@router.get("/executions/{execution_id}/logs", response_model=ExecutionLogsResponse)
async def get_execution_logs(
    execution_id: str,
    level: Optional[str] = None,
    node_id: Optional[str] = None,
    limit: int = Query(1000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Get execution logs with filtering"""
    # Implementation needed
```

**Schema:** Add `ExecutionLogsResponse` to `backend/models/schemas.py`

**Estimated Time:** 2 hours

---

### Phase 2: Execution Control (Priority: Medium)

#### Task 2.1: Cancel Execution Endpoint
**File:** `backend/api/routes/execution_routes.py`

```python
@router.post("/executions/{execution_id}/cancel", response_model=ExecutionResponse)
async def cancel_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Cancel a running execution"""
    # Implementation needed
```

**Requirements:**
- Check if execution is cancellable (status = running)
- Signal cancellation to executor
- Update execution status to cancelled
- Set cancelled_at timestamp

**File:** `backend/engine/executor_v3.py`
- Add cancellation support to executor
- Handle cancellation gracefully
- Clean up resources

**Estimated Time:** 4 hours

---

#### Task 2.2: Enhanced Status Support
**Files:** 
- `backend/engine/executor_v3.py`
- `backend/models/schemas.py`

**Changes:**
- Add `pending` status when execution is queued
- Add `paused` status support (future feature)
- Ensure `cancelled` status works correctly

**Estimated Time:** 2 hours

---

### Phase 3: Log Management (Priority: Medium)

#### Task 3.1: Log Storage Optimization
**File:** `backend/database/models.py`

**Considerations:**
- Current: Logs stored in JSON state field
- Future: Consider separate `execution_logs` table for large logs
- Add log size limits
- Add log archival strategy

**Estimated Time:** 3 hours (research + implementation)

---

#### Task 3.2: Log Formatting Utilities
**File:** `backend/utils/log_formatter.py` (new)

**Functions:**
- Format logs as text
- Format logs as JSON
- Filter logs by level/node_id
- Paginate logs efficiently

**Estimated Time:** 2 hours

---

### Phase 4: Rate Limiting & Security (Priority: Low)

#### Task 4.1: Rate Limiting Middleware
**File:** `backend/middleware/rate_limit.py` (new)

**Requirements:**
- Per-endpoint rate limits
- Per-user/IP rate limits
- Configurable limits
- Rate limit headers in response

**Estimated Time:** 3 hours

---

#### Task 4.2: Execution Access Control
**File:** `backend/api/routes/execution_routes.py`

**Requirements:**
- Users can only access their own executions (unless workflow is public)
- Admin users can access all executions
- Proper error messages for unauthorized access

**Estimated Time:** 2 hours

---

## Database Changes

### Current Schema (No Changes Needed)

```python
class ExecutionDB(Base):
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True)
    workflow_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=True, index=True)
    status = Column(String, nullable=False)
    state = Column(JSON, nullable=False)  # Contains logs
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
```

### Optional Future Enhancement

Consider adding a separate `execution_logs` table for better querying:

```python
class ExecutionLogDB(Base):
    __tablename__ = "execution_logs"
    
    id = Column(String, primary_key=True)
    execution_id = Column(String, ForeignKey("executions.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    level = Column(String, nullable=False, index=True)
    node_id = Column(String, nullable=True, index=True)
    message = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Benefits:**
- Better query performance for log filtering
- Easier pagination
- Can archive old logs separately
- Better indexing

**Trade-offs:**
- More complex writes (need to write to both tables)
- More storage overhead
- Migration needed for existing data

**Recommendation:** Start with current JSON storage, migrate later if needed.

---

## API Response Schemas

### New Schemas Needed

Add to `backend/models/schemas.py`:

```python
class ExecutionListResponse(BaseModel):
    """Response for listing executions"""
    executions: List[ExecutionSummary]
    total: int
    limit: int
    offset: int


class ExecutionSummary(BaseModel):
    """Summary of an execution (for list views)"""
    execution_id: str
    workflow_id: str
    status: ExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None


class ExecutionLogsResponse(BaseModel):
    """Response for execution logs"""
    execution_id: str
    workflow_id: str
    total_logs: int
    logs: List[ExecutionLogEntry]
    limit: int
    offset: int


class CancelExecutionResponse(BaseModel):
    """Response for cancelling execution"""
    execution_id: str
    status: ExecutionStatus
    cancelled_at: datetime
```

---

## Testing Plan

### Unit Tests

1. **List Executions**
   - Test filtering by workflow_id
   - Test filtering by status
   - Test filtering by user_id
   - Test pagination
   - Test empty results

2. **Download Logs**
   - Test text format
   - Test JSON format
   - Test file headers
   - Test large log files
   - Test missing execution

3. **Get Logs**
   - Test filtering by level
   - Test filtering by node_id
   - Test pagination
   - Test empty logs

4. **Cancel Execution**
   - Test cancelling running execution
   - Test cancelling completed execution (should fail)
   - Test cancelling non-existent execution
   - Test cancellation updates status

### Integration Tests

1. **End-to-End Execution Flow**
   - Execute workflow → Get status → Download logs
   - Execute workflow → Cancel → Verify cancellation
   - Execute workflow → List executions → Verify appears in list

2. **Error Handling**
   - Invalid execution ID
   - Missing authentication (where required)
   - Rate limiting

---

## Implementation Order

### Sprint 1 (Week 1)
1. ✅ List Executions endpoint
2. ✅ Get Logs endpoint
3. ✅ Download Logs endpoint (text format)

### Sprint 2 (Week 2)
1. ✅ Cancel Execution endpoint
2. ✅ Enhanced status support
3. ✅ Download Logs endpoint (JSON format)

### Sprint 3 (Week 3)
1. ✅ Rate limiting
2. ✅ Access control
3. ✅ Log formatting utilities
4. ✅ Comprehensive testing

---

## Estimated Total Time

- **Phase 1 (Core API):** 7 hours
- **Phase 2 (Execution Control):** 6 hours
- **Phase 3 (Log Management):** 5 hours
- **Phase 4 (Rate Limiting & Security):** 5 hours
- **Testing:** 8 hours
- **Documentation:** 2 hours

**Total:** ~33 hours (~4-5 days)

---

## Notes

1. **Backward Compatibility**: All new endpoints are additive, existing endpoints unchanged
2. **Performance**: Consider caching execution status for frequently accessed executions
3. **Scalability**: For high-volume scenarios, consider:
   - Log streaming instead of polling
   - Log archival to S3/cloud storage
   - Separate read replicas for execution queries
4. **Monitoring**: Add metrics for:
   - Execution start/completion rates
   - Average execution duration
   - Error rates
   - Log volume
