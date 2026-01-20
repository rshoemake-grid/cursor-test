# Test Coverage Improvement Plan: 55% → 80%

## Current Status
- **Current Coverage**: 55%
- **Target Coverage**: 80%
- **Gap**: +25 percentage points needed

## Priority Areas (by impact)

### Priority 1: API Routes (Highest Impact)
These routes handle critical functionality and have low coverage:

1. **execution_routes.py** (14% coverage, 134 lines missing)
   - `POST /workflows/{id}/execute` - Execute workflow endpoint
   - `GET /executions/{id}` - Get execution status
   - Impact: Critical functionality, moderate size

2. **workflow_chat_routes.py** (12% coverage, 250 lines missing)
   - `POST /api/workflow-chat/chat` - Chat with LLM to modify workflows
   - Complex LLM integration, tool calling
   - Impact: High complexity, large file

3. **auth_routes.py** (25% coverage, 71 lines missing)
   - User registration, login, password reset
   - Impact: Security-critical, moderate size

4. **marketplace_routes.py** (25% coverage, 65 lines missing)
   - Marketplace operations
   - Impact: Moderate size

5. **sharing_routes.py** (24% coverage, 77 lines missing)
   - Workflow sharing functionality
   - Impact: Moderate size

6. **import_export_routes.py** (30% coverage, 48 lines missing)
   - Import/export workflows
   - Impact: Moderate size

### Priority 2: Core Agents (Large Files)
1. **unified_llm_agent.py** (19% coverage, 653 lines missing)
   - 808 total lines, only 155 covered
   - Core LLM agent implementation
   - Impact: Huge file, complex logic

2. **llm_agent_v2.py** (0% coverage, 73 lines missing)
   - Alternative LLM agent implementation
   - Impact: Small file, easy to cover

### Priority 3: Executor & Input Sources
1. **executor_v3.py** (43% coverage, 255 lines missing)
   - Workflow execution engine
   - Impact: Critical, large file

2. **input_sources.py** (24% coverage, 406 lines missing)
   - Input source handlers
   - Impact: Large file, moderate complexity

## Implementation Strategy

### Phase 1: API Route Tests (Target: +10% coverage)
Focus on execution and auth routes first:
- `test_execution_routes.py` - Execute workflow, get execution status
- `test_auth_routes.py` - Registration, login, password reset
- `test_marketplace_routes.py` - Marketplace operations
- `test_sharing_routes.py` - Sharing functionality

### Phase 2: UnifiedLLMAgent Tests (Target: +8% coverage)
- Test different provider types (OpenAI, Anthropic, Gemini, Custom)
- Test error handling and edge cases
- Test tool calling functionality
- Test vision model support

### Phase 3: Executor & Input Sources (Target: +7% coverage)
- More executor test scenarios (loops, conditions, parallel execution)
- Input source handler tests (all types)
- Error handling and edge cases

## Estimated Impact

| Module | Current | Target | Lines to Cover | Estimated Tests |
|--------|---------|--------|----------------|-----------------|
| execution_routes.py | 14% | 70% | ~100 | 15-20 |
| auth_routes.py | 25% | 70% | ~50 | 10-15 |
| unified_llm_agent.py | 19% | 40% | ~200 | 20-30 |
| executor_v3.py | 43% | 65% | ~100 | 15-20 |
| input_sources.py | 24% | 50% | ~150 | 20-25 |
| Other routes | 20-30% | 60% | ~150 | 20-30 |
| **Total** | **55%** | **80%** | **~750** | **100-140** |

## Next Steps
1. Create test_execution_routes.py
2. Create test_auth_routes.py  
3. Expand unified_llm_agent tests
4. Expand executor_v3 tests
5. Add more input_sources tests
6. Add remaining route tests

