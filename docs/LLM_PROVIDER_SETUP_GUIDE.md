# LLM Provider Setup Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide explains how to configure and use different LLM (Large Language Model) providers in the workflow engine. The system supports multiple providers including OpenAI, Anthropic Claude, Google Gemini, and custom providers.

## Real-World Setup Scenarios

### Scenario 1: Single Provider (OpenAI)

**Use Case:** Small team, single LLM provider

```json
{
  "providers": [
    {
      "id": "openai-main",
      "name": "OpenAI Production",
      "type": "openai",
      "apiKey": "sk-proj-abc123...",
      "baseUrl": "https://api.openai.com/v1",
      "defaultModel": "gpt-4",
      "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
      "enabled": true
    }
  ],
  "default_model": "gpt-4"
}
```

**Workflow:** All agent nodes use GPT-4 by default, can switch to GPT-3.5-turbo for cost savings.

### Scenario 2: Multiple Providers (Cost Optimization)

**Use Case:** Use cheaper models for simple tasks, premium models for complex tasks

```json
{
  "providers": [
    {
      "id": "openai-premium",
      "name": "OpenAI GPT-4",
      "type": "openai",
      "apiKey": "sk-proj-premium...",
      "defaultModel": "gpt-4",
      "models": ["gpt-4", "gpt-4-turbo"],
      "enabled": true
    },
    {
      "id": "openai-standard",
      "name": "OpenAI GPT-3.5",
      "type": "openai",
      "apiKey": "sk-proj-standard...",
      "defaultModel": "gpt-3.5-turbo",
      "models": ["gpt-3.5-turbo"],
      "enabled": true
    }
  ],
  "default_model": "gpt-3.5-turbo"
}
```

**Workflow:** 
- Simple tasks → GPT-3.5-turbo (cheaper)
- Complex analysis → GPT-4 (better quality)
- Cost savings: ~90% reduction for simple tasks

### Scenario 3: Provider Failover

**Use Case:** High availability, automatic failover

```json
{
  "providers": [
    {
      "id": "openai-primary",
      "name": "OpenAI Primary",
      "type": "openai",
      "apiKey": "sk-primary...",
      "defaultModel": "gpt-4",
      "enabled": true
    },
    {
      "id": "anthropic-backup",
      "name": "Claude Backup",
      "type": "anthropic",
      "apiKey": "sk-ant-backup...",
      "defaultModel": "claude-3-sonnet-20240229",
      "enabled": true
    }
  ],
  "default_model": "gpt-4"
}
```

**Workflow:** If OpenAI rate limit exceeded, system automatically uses Claude as backup.

## Supported Providers

### OpenAI
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **API Endpoint**: `https://api.openai.com/v1`
- **Authentication**: API key (starts with `sk-`)

### Anthropic Claude
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **API Endpoint**: `https://api.anthropic.com`
- **Authentication**: API key (starts with `sk-ant-`)

### Google Gemini
- **Models**: Gemini Pro, Gemini Pro Vision
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1`
- **Authentication**: API key

### Custom Providers
- **Use Case**: Self-hosted models, other OpenAI-compatible APIs
- **Configuration**: Custom base URL and API key

## Configuration Methods

### Method 1: Settings UI (Recommended)

**Best for:** Most users, easiest setup

1. Navigate to **Settings** in the application
2. Click **Add Provider**
3. Fill in provider details:
   - **Name**: Display name (e.g., "OpenAI Production")
   - **Type**: Provider type (openai, anthropic, gemini, custom)
   - **API Key**: Your API key
   - **Base URL**: API endpoint (auto-filled for standard providers)
   - **Default Model**: Model to use by default
   - **Models**: List of available models
4. Enable the provider
5. Click **Sync Now** to save

**Note:** Settings are cached in memory. After saving, the cache is automatically updated.

### Method 2: API Configuration

**Best for:** Automation, programmatic setup, CI/CD

```bash
# POST /api/settings
curl -X POST http://localhost:8000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "providers": [
      {
        "id": "openai-1",
        "name": "OpenAI",
        "type": "openai",
        "apiKey": "sk-your-api-key",
        "baseUrl": "https://api.openai.com/v1",
        "defaultModel": "gpt-4",
        "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        "enabled": true
      }
    ],
    "iteration_limit": 10,
    "default_model": "gpt-4"
  }'
```

**Note:** Requires authentication token. Settings are automatically cached after API call.

### Method 3: Environment Variables (Fallback)

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key
ANTHROPIC_API_KEY=sk-ant-your-api-key
GEMINI_API_KEY=your-gemini-key
```

**Note**: Environment variables are fallback only. Settings UI configuration takes precedence.

## Provider-Specific Setup

### OpenAI Setup

#### 1. Get API Key

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys**
3. Click **Create new secret key**
4. Copy the key (starts with `sk-`)

#### 2. Configure Provider

**Via Settings UI:**
- Type: `openai`
- API Key: `sk-...`
- Base URL: `https://api.openai.com/v1` (auto-filled)
- Models: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

**Via API:**
```json
{
  "id": "openai-1",
  "name": "OpenAI",
  "type": "openai",
  "apiKey": "sk-your-key",
  "baseUrl": "https://api.openai.com/v1",
  "defaultModel": "gpt-4",
  "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  "enabled": true
}
```

#### 3. Verify Configuration

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

### Anthropic Claude Setup

#### 1. Get API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-`)

#### 2. Configure Provider

**Via Settings UI:**
- Type: `anthropic`
- API Key: `sk-ant-...`
- Base URL: `https://api.anthropic.com` (auto-filled)
- Models: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

**Via API:**
```json
{
  "id": "anthropic-1",
  "name": "Anthropic Claude",
  "type": "anthropic",
  "apiKey": "sk-ant-your-key",
  "baseUrl": "https://api.anthropic.com",
  "defaultModel": "claude-3-opus-20240229",
  "models": [
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ],
  "enabled": true
}
```

#### 3. Verify Configuration

```bash
# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-your-key" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
```

### Google Gemini Setup

#### 1. Get API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key

#### 2. Configure Provider

**Via Settings UI:**
- Type: `gemini`
- API Key: Your Gemini API key
- Base URL: `https://generativelanguage.googleapis.com/v1` (auto-filled)
- Models: `gemini-pro`, `gemini-pro-vision`

**Via API:**
```json
{
  "id": "gemini-1",
  "name": "Google Gemini",
  "type": "gemini",
  "apiKey": "your-gemini-key",
  "baseUrl": "https://generativelanguage.googleapis.com/v1",
  "defaultModel": "gemini-pro",
  "models": ["gemini-pro", "gemini-pro-vision"],
  "enabled": true
}
```

#### 3. Verify Configuration

```bash
# Test API key
curl "https://generativelanguage.googleapis.com/v1/models?key=your-key"
```

### Custom Provider Setup

Custom providers allow you to use self-hosted models or other OpenAI-compatible APIs.

#### 1. Configure Provider

**Via Settings UI:**
- Type: `custom`
- API Key: Your API key (if required)
- Base URL: Your API endpoint (e.g., `https://api.example.com/v1`)
- Models: List of available models
- Default Model: Default model name

**Via API:**
```json
{
  "id": "custom-1",
  "name": "Self-Hosted LLM",
  "type": "custom",
  "apiKey": "your-api-key",
  "baseUrl": "https://api.example.com/v1",
  "defaultModel": "llama-2-70b",
  "models": ["llama-2-70b", "llama-2-13b"],
  "enabled": true
}
```

#### 2. Requirements

Custom providers must implement OpenAI-compatible API:
- Chat completions endpoint: `POST /chat/completions`
- Models endpoint: `GET /models`
- Authentication via `Authorization: Bearer {api_key}` header

## Multiple Providers

### Configuring Multiple Providers

You can configure multiple providers and switch between them:

```json
{
  "providers": [
    {
      "id": "openai-1",
      "name": "OpenAI Production",
      "type": "openai",
      "apiKey": "sk-prod-key",
      "enabled": true
    },
    {
      "id": "openai-2",
      "name": "OpenAI Development",
      "type": "openai",
      "apiKey": "sk-dev-key",
      "enabled": false
    },
    {
      "id": "anthropic-1",
      "name": "Claude Backup",
      "type": "anthropic",
      "apiKey": "sk-ant-key",
      "enabled": true
    }
  ]
}
```

### Provider Selection

The system selects providers based on:

1. **Model Name**: If a specific model is requested, the provider that owns that model is used
2. **Enabled Status**: Only enabled providers are considered
3. **Default Provider**: First enabled provider is used as default

### Model-to-Provider Mapping

When executing a workflow with a specific model:
- System finds the provider that owns the model
- Uses that provider's API key and configuration
- Falls back to default provider if model not found

## Settings Cache

### How It Works

Settings are cached in memory for performance:
- Loaded on server startup
- Updated when settings are saved via API
- Per-user caching (anonymous users share a cache)

### Cache Refresh

**Automatic:**
- Settings saved via API automatically update cache
- Server restart reloads cache from database

**Manual:**
```bash
# Via API (if endpoint exists)
POST /api/settings/sync
```

## Security Best Practices

### API Key Storage

**Current Implementation:**
- API keys stored in database (`settings` table)
- Encrypted at rest (future enhancement)
- User-specific storage

**Best Practices:**
- Never commit API keys to version control
- Use environment variables for development
- Rotate API keys regularly
- Use separate keys for development/production
- Monitor API key usage

### Key Validation

The system validates API keys:
- Checks for placeholder values
- Validates key format (when possible)
- Provides helpful error messages

**Placeholder Detection:**
```python
# System detects placeholder keys like:
# "sk-test-key-replace-with-real-key"
# "your-api-key-here"
```

### Error Messages

Invalid API keys produce helpful errors:
```
Invalid API key detected. Please go to Settings, add an LLM provider 
with a valid API key, enable it, and click 'Sync Now'.
```

## Troubleshooting

### Common Issues

**Error: "API key not configured"**
- Verify provider is enabled
- Check API key is not a placeholder
- Ensure "Sync Now" was clicked after configuration

**Error: "Invalid API key"**
- Verify API key is correct
- Check key hasn't expired
- Ensure key has required permissions

**Error: "Model not found"**
- Verify model name is correct
- Check model is in provider's model list
- Ensure provider is enabled

**Error: "Rate limit exceeded"**
- Reduce request frequency
- Upgrade API plan
- Use multiple providers for load balancing

### Debugging

**Enable Debug Logging:**
```python
# backend/config.py
log_level: str = "DEBUG"
```

**Check Provider Configuration:**
```python
# Via API
GET /api/settings

# Response shows all configured providers
```

**Test API Key Directly:**
```bash
# OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"

# Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-your-key" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
```

## Cost Management

### Usage Monitoring

Monitor API usage:
- Check provider dashboard (OpenAI, Anthropic, etc.)
- Review execution logs
- Set up usage alerts

### Cost Optimization

**Strategies:**
- Use cheaper models for simple tasks (GPT-3.5 vs GPT-4)
- Cache common responses
- Batch requests when possible
- Set iteration limits in workflows
- Use multiple providers for cost comparison

### Budget Limits

**Recommended:**
- Set monthly budget limits in provider dashboards
- Monitor usage daily
- Use development keys for testing
- Separate production and development accounts

## Provider-Specific Notes

### OpenAI

**Rate Limits:**
- Varies by plan (free, paid, enterprise)
- Check dashboard for current limits

**Model Availability:**
- Some models require API access approval
- Check model availability in dashboard

### Anthropic

**Rate Limits:**
- Based on subscription tier
- Check console for current limits

**Model Access:**
- Claude 3 Opus may require approval
- Sonnet and Haiku generally available

### Gemini

**Rate Limits:**
- Free tier: 60 requests/minute
- Paid tier: Higher limits

**Quotas:**
- Check quotas in Google Cloud Console
- May require billing account

## Related Documentation

- [Settings API Reference](./API_REFERENCE.md) - Settings endpoints
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - LLM client implementation
- [Technical Design](./TECHNICAL_DESIGN.md) - Provider architecture
