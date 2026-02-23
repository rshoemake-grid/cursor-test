# Apigee Integration Guide

## Quick Start

This guide provides step-by-step instructions for integrating the Agentic Workflow Builder API with Google Apigee.

## Prerequisites

- Google Cloud Platform account with Apigee enabled
- Apigee organization and environment created
- Backend API deployed and accessible
- OpenAPI schema exported

## Step 1: Export OpenAPI Schema

```bash
# Get OpenAPI schema from running API
curl http://localhost:8000/openapi.json > openapi-spec.json

# Or from production
curl https://api.yourdomain.com/openapi.json > openapi-spec.json
```

## Step 2: Create Apigee API Proxy

### Using Apigee UI

1. **Navigate to Apigee UI**
   - Go to https://apigee.google.com
   - Select your organization

2. **Create New API Proxy**
   - Click "API Proxies" → "Create New"
   - Select "OpenAPI" as source
   - Upload `openapi-spec.json`
   - Set proxy name: `workflow-builder-api`
   - Set base path: `/api/v1`

3. **Configure Target**
   - Target type: HTTP Target
   - Target URL: `https://your-backend-service.com`
   - SSL: Use system default

### Using Apigee API

```bash
# Create proxy from OpenAPI spec
curl -X POST \
  "https://apigee.googleapis.com/v1/organizations/{org}/apis?action=import&name=workflow-builder-api" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@openapi-spec.json"
```

## Step 3: Add Apigee Policies

### Required Policies

Add these policies to your proxy:

#### 1. Spike Arrest (Rate Limiting)

```xml
<SpikeArrest async="false" continueOnError="false" enabled="true" name="Spike-Arrest-1">
    <DisplayName>Spike Arrest 1</DisplayName>
    <Properties/>
    <Identifier ref="request.header.some-header-name"/>
    <MessageWeight ref="request.header.weight"/>
    <Rate>100ps</Rate>
</SpikeArrest>
```

#### 2. Quota Policy

```xml
<Quota async="false" continueOnError="false" enabled="true" name="Quota-1" type="calendar">
    <DisplayName>Quota 1</DisplayName>
    <Allow count="10000"/>
    <Interval>1</Interval>
    <TimeUnit>day</TimeUnit>
    <Distributed>true</Distributed>
    <Synchronous>false</Synchronous>
</Quota>
```

#### 3. CORS Policy (if not handled by backend)

```xml
<CORS>
    <AllowOrigins>
        <Origin>https://yourdomain.com</Origin>
    </AllowOrigins>
    <AllowMethods>
        <Method>GET</Method>
        <Method>POST</Method>
        <Method>PUT</Method>
        <Method>DELETE</Method>
        <Method>OPTIONS</Method>
    </AllowMethods>
    <AllowHeaders>
        <Header>Authorization</Header>
        <Header>Content-Type</Header>
    </AllowHeaders>
    <ExposeHeaders>
        <Header>X-RateLimit-Limit</Header>
        <Header>X-RateLimit-Remaining</Header>
    </ExposeHeaders>
</CORS>
```

#### 4. JSON Threat Protection

```xml
<JSONThreatProtection>
    <MaxObjectCount>100</MaxObjectCount>
    <MaxArrayCount>100</MaxArrayCount>
    <MaxStringLength>10000</MaxStringLength>
    <MaxDepth>10</MaxDepth>
    <MaxProperties>100</MaxProperties>
</JSONThreatProtection>
```

## Step 4: Configure Authentication

### Option 1: Pass-Through Authentication (Recommended)

Let the backend handle authentication. Apigee just proxies requests.

**No additional policy needed** - backend validates JWT tokens.

### Option 2: Apigee OAuth2 Validation

If you want Apigee to validate tokens:

```xml
<OAuthV2 async="false" continueOnError="false" enabled="true" name="OAuth-v20-1">
    <DisplayName>OAuth v2.0 1</DisplayName>
    <Operation>VerifyAccessToken</Operation>
    <GenerateResponse enabled="true"/>
</OAuthV2>
```

## Step 5: Deploy Proxy

### Using Apigee UI

1. Go to API Proxy → Deployments
2. Select environment (test/prod)
3. Click "Deploy"
4. Note the proxy URL

### Using Apigee API

```bash
curl -X POST \
  "https://apigee.googleapis.com/v1/organizations/{org}/environments/{env}/apis/workflow-builder-api/revisions/{rev}/deployments" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Step 6: Test Integration

### Test Health Check

```bash
export APIGEE_URL="https://your-org-test.apigee.net/api/v1"

curl -X GET "${APIGEE_URL}/health"
```

### Test Authentication

```bash
# Login through Apigee
curl -X POST "${APIGEE_URL}/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password"

# Save token
export TOKEN="your-token-here"
```

### Test Authenticated Endpoint

```bash
curl -X GET "${APIGEE_URL}/workflows" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Step 7: Monitor & Analytics

### View Analytics in Apigee UI

1. Go to "Analytics" → "API Proxies"
2. Select `workflow-builder-api`
3. View metrics:
   - Request count
   - Error rate
   - Response time
   - Traffic by endpoint

### Set Up Alerts

1. Go to "Analytics" → "Alerts"
2. Create alerts for:
   - High error rate (>5%)
   - High latency (>1s)
   - Rate limit exceeded

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS policy configuration
   - Verify allowed origins match frontend domain
   - Check backend CORS settings

2. **Authentication Failures**
   - Verify token is passed correctly
   - Check backend token validation
   - Verify OAuth2 policy (if used)

3. **Rate Limiting**
   - Check Spike Arrest policy
   - Verify quota limits
   - Check rate limit headers in response

4. **WebSocket Issues**
   - Apigee supports WebSocket proxying
   - May need special configuration
   - Check WebSocket upgrade headers

## Best Practices

1. **Use Environment-Specific Configs**
   - Different targets for test/prod
   - Environment-specific rate limits

2. **Enable Caching**
   - Cache GET requests
   - Set appropriate TTL

3. **Monitor Performance**
   - Set up dashboards
   - Configure alerts
   - Review analytics regularly

4. **Security**
   - Use HTTPS only
   - Validate all inputs
   - Implement proper authentication

## API Gateway Benefits

With Apigee, you get:

- ✅ **Rate Limiting**: Protect backend from overload
- ✅ **Analytics**: Detailed API usage metrics
- ✅ **Security**: Threat protection, OAuth2
- ✅ **Caching**: Reduce backend load
- ✅ **Monitoring**: Real-time monitoring and alerts
- ✅ **Developer Portal**: Self-service API access

## Support

For Apigee-specific issues:
- Apigee Documentation: https://cloud.google.com/apigee/docs
- Apigee Community: https://www.googlecloudcommunity.com/gc/Apigee/bd-p/apigee

For API issues:
- Check backend logs
- Review error responses
- See QA Testing Guide for endpoint details
