# Test Plan for New Features

## Overview

This document outlines the unit tests needed for the newly implemented features:
1. Get Execution Logs endpoint (`GET /executions/{execution_id}/logs`)
2. Download Execution Logs endpoint (`GET /executions/{execution_id}/logs/download`)
3. Cancel Execution endpoint (`POST /executions/{execution_id}/cancel`)
4. Enhanced Analytics Dashboard (frontend)

## Backend Tests Needed

### 1. ExecutionService Tests

**File**: `backend/tests/services/test_execution_service_new_methods.py`

#### TestGetExecutionLogs (10 tests)
- ✅ `test_get_execution_logs_success` - Successfully retrieving logs
- ✅ `test_get_execution_logs_not_found` - Non-existent execution
- ✅ `test_get_execution_logs_filter_by_level` - Filter by log level
- ✅ `test_get_execution_logs_filter_by_node_id` - Filter by node ID
- ✅ `test_get_execution_logs_filter_by_both` - Filter by both level and node_id
- ✅ `test_get_execution_logs_pagination` - Pagination support
- ✅ `test_get_execution_logs_empty_logs` - Empty logs handling
- ✅ `test_get_execution_logs_no_state` - No state handling
- ✅ `test_get_execution_logs_sorted_by_timestamp` - Timestamp sorting
- ✅ `test_get_execution_logs_invalid_timestamp_handling` - Invalid timestamp fallback

#### TestCancelExecution (7 tests)
- ✅ `test_cancel_running_execution` - Cancel running execution
- ✅ `test_cancel_pending_execution` - Cancel pending execution
- ✅ `test_cancel_execution_not_found` - Non-existent execution
- ✅ `test_cancel_completed_execution_fails` - Cannot cancel completed
- ✅ `test_cancel_failed_execution_fails` - Cannot cancel failed
- ✅ `test_cancel_adds_cancellation_log` - Adds cancellation log entry
- ✅ `test_cancel_updates_state_status` - Updates state status

### 2. Execution Routes Tests

**File**: `backend/tests/api/routes/test_execution_routes_new_endpoints.py`

#### TestGetExecutionLogsEndpoint (6 tests)
- ✅ `test_get_execution_logs_endpoint_success` - Successful request
- ✅ `test_get_execution_logs_endpoint_not_found` - 404 for non-existent execution
- ✅ `test_get_execution_logs_endpoint_with_filters` - Query parameter filtering
- ✅ `test_get_execution_logs_endpoint_pagination` - Pagination parameters
- ✅ `test_get_execution_logs_endpoint_invalid_limit` - Validation errors
- ✅ `test_get_execution_logs_endpoint_response_format` - Response schema validation

#### TestDownloadExecutionLogsEndpoint (5 tests)
- ✅ `test_download_logs_text_format` - Text format download
- ✅ `test_download_logs_json_format` - JSON format download
- ✅ `test_download_logs_with_filters` - Filtered download
- ✅ `test_download_logs_not_found` - 404 for non-existent execution
- ✅ `test_download_logs_headers` - Proper download headers

#### TestCancelExecutionEndpoint (4 tests)
- ✅ `test_cancel_execution_endpoint_success` - Successful cancellation
- ✅ `test_cancel_execution_endpoint_not_found` - 404 for non-existent execution
- ✅ `test_cancel_execution_endpoint_not_cancellable` - 400 for non-cancellable status
- ✅ `test_cancel_execution_endpoint_response_format` - Response schema validation

## Frontend Tests Needed

### 1. API Client Tests

**File**: `frontend/src/api/client.test.ts` (extend existing)

#### New Methods (6 tests)
- ✅ `test_getExecutionLogs` - API client method
- ✅ `test_downloadExecutionLogs` - Download method
- ✅ `test_cancelExecution` - Cancel method
- ✅ `test_getExecutionLogs_with_filters` - Filter parameters
- ✅ `test_downloadExecutionLogs_formats` - Format handling
- ✅ `test_cancelExecution_error_handling` - Error handling

### 2. Analytics Dashboard Tests

**File**: `frontend/src/pages/AnalyticsPage.test.tsx` (new)

#### Chart Rendering (4 tests)
- ✅ `test_renders_success_rate_chart` - Success rate chart displays
- ✅ `test_renders_duration_chart` - Duration chart displays
- ✅ `test_renders_status_pie_chart` - Status pie chart displays
- ✅ `test_renders_executions_bar_chart` - Executions bar chart displays

#### Data Processing (3 tests)
- ✅ `test_chart_data_grouping` - Data grouped by day correctly
- ✅ `test_chart_data_calculation` - Success rate and duration calculated correctly
- ✅ `test_chart_data_empty_state` - Handles empty data gracefully

### 3. ExecutionDetailsModal Tests

**File**: `frontend/src/components/log/ExecutionDetailsModal.test.tsx` (extend existing)

#### Download Functionality (4 tests)
- ✅ `test_download_logs_text_button` - Text download button works
- ✅ `test_download_logs_json_button` - JSON download button works
- ✅ `test_download_logs_loading_state` - Loading state during download
- ✅ `test_download_logs_error_handling` - Error handling for failed downloads

## Test Implementation Status

### Backend
- ⚠️ **ExecutionService**: Tests need to be written (17 tests)
- ⚠️ **Execution Routes**: Tests need to be written (15 tests)
- **Total Backend Tests Needed**: 32 tests

### Frontend
- ⚠️ **API Client**: Tests need to be written (6 tests)
- ⚠️ **Analytics Dashboard**: Tests need to be written (7 tests)
- ⚠️ **ExecutionDetailsModal**: Tests need to be written (4 tests)
- **Total Frontend Tests Needed**: 17 tests

## Running Tests

### Backend
```bash
# Run all execution service tests
pytest backend/tests/services/test_execution_service_new_methods.py -v

# Run all execution routes tests
pytest backend/tests/api/routes/test_execution_routes_new_endpoints.py -v

# Run with coverage
pytest --cov=backend.services.execution_service --cov=backend.api.routes.execution_routes -v
```

### Frontend
```bash
cd frontend

# Run API client tests
npm test -- client.test.ts

# Run Analytics Dashboard tests
npm test -- AnalyticsPage.test.tsx

# Run ExecutionDetailsModal tests
npm test -- ExecutionDetailsModal.test.tsx

# Run with coverage
npm test -- --coverage
```

## Test Coverage Goals

- **Backend**: Target 90%+ coverage for new methods
- **Frontend**: Target 85%+ coverage for new components
- **Overall**: Maintain project coverage above 85%

## Notes

- All tests should follow existing test patterns in the codebase
- Use async/await for backend tests
- Mock external dependencies (database, API calls)
- Test both success and error paths
- Include edge cases (empty data, invalid inputs, etc.)
