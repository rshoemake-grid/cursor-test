# Test Data Files

This directory contains sample JSON files for API testing.

## Files

- `sample_workflow.json` - Sample workflow definition with all node types
- `sample_llm_settings.json` - Sample LLM provider configuration
- `sample_execution_inputs.json` - Sample execution inputs
- `sample_user_registration.json` - Sample user registration data

## Usage

These files can be used with curl commands:

```bash
# Create workflow
curl -X POST "${BASE_URL}/api/workflows" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json

# Save LLM settings
curl -X POST "${BASE_URL}/api/settings/llm" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_llm_settings.json

# Execute workflow
curl -X POST "${BASE_URL}/api/workflows/{workflow_id}/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_execution_inputs.json
```

## Notes

- Replace placeholder API keys with real keys for testing
- Update workflow IDs and user IDs based on your test environment
- These are sample files - modify as needed for your test scenarios
