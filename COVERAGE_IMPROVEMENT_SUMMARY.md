# Test Coverage Improvement Plan: 55% → 80%

## Current Status
- **Current Coverage**: 55%
- **Target Coverage**: 80%
- **Gap**: +25 percentage points needed

## Priority Areas Identified

### 1. API Routes (Highest Impact - ~750 lines to cover)
- **execution_routes.py**: 14% → Target 70% (+100 lines)
- **workflow_chat_routes.py**: 12% → Target 50% (+200 lines)  
- **auth_routes.py**: 25% → Target 70% (+50 lines)
- **marketplace_routes.py**: 25% → Target 60% (+50 lines)
- **sharing_routes.py**: 24% → Target 60% (+50 lines)
- **import_export_routes.py**: 30% → Target 60% (+30 lines)
- **settings_routes.py**: 30% → Target 60% (+100 lines)

### 2. Core Agents (~300 lines to cover)
- **unified_llm_agent.py**: 19% → Target 40% (+200 lines)
- **llm_agent_v2.py**: 0% → Target 70% (+50 lines)
- **llm_agent.py**: 26% → Target 70% (+20 lines)

### 3. Executor & Input Sources (~250 lines to cover)
- **executor_v3.py**: 43% → Target 65% (+100 lines)
- **input_sources.py**: 24% → Target 50% (+150 lines)

## Implementation Strategy

### Phase 1: Critical API Routes (Target: +10% coverage)
1. ✅ Created `test_execution_routes.py` - needs fixes for endpoint signatures
2. ✅ Created `test_auth_routes.py` - needs bcrypt fixture fix
3. Create `test_marketplace_routes.py`
4. Create `test_sharing_routes.py`
5. Expand `test_settings_routes.py` (already exists, needs more tests)

### Phase 2: UnifiedLLMAgent (Target: +8% coverage)
- Test different provider types (OpenAI, Anthropic, Gemini, Custom)
- Test error handling and edge cases
- Test tool calling functionality
- Test vision model support

### Phase 3: Executor & Input Sources (Target: +7% coverage)
- More executor test scenarios (loops, conditions, parallel execution)
- Input source handler tests (all types)
- Error handling and edge cases

## Next Steps

1. **Fix existing tests**:
   - Fix `test_execution_routes.py` - correct endpoint request format
   - Fix `test_auth_routes.py` - fix bcrypt password hashing in fixtures

2. **Create new test files**:
   - `test_marketplace_routes.py`
   - `test_sharing_routes.py`
   - `test_import_export_routes.py`

3. **Expand existing tests**:
   - More `unified_llm_agent` tests
   - More `executor_v3` tests
   - More `input_sources` tests

## Estimated Impact

| Phase | Tests Added | Coverage Gain | Total Coverage |
|-------|-------------|---------------|----------------|
| Current | 175 | - | 55% |
| Phase 1 | +40 | +10% | 65% |
| Phase 2 | +30 | +8% | 73% |
| Phase 3 | +30 | +7% | 80% |
| **Total** | **+100** | **+25%** | **80%** |

## Notes

- Focus on high-impact areas first (API routes)
- Use proper mocking for external dependencies (LLM APIs, cloud services)
- Ensure proper async/await patterns in FastAPI tests
- Handle optional dependencies gracefully (boto3, google-cloud-pubsub)

