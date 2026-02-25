# Security Guide

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This guide covers security best practices, vulnerabilities to watch for, and security measures implemented in the workflow engine.

## Real-World Security Scenarios

### Scenario 1: API Key Exposure Prevention

**Problem:** Developer accidentally commits API key to repository

**Prevention:**
```bash
# .gitignore
.env
*.key
secrets/

# Pre-commit hook
#!/bin/bash
if git diff --cached --name-only | grep -E '\.(env|key)$'; then
    echo "ERROR: Attempting to commit sensitive files"
    exit 1
fi
```

**Detection:**
```python
# CI/CD check
def check_for_secrets():
    """Scan code for potential secrets"""
    patterns = [
        r'sk-[a-zA-Z0-9]{32,}',
        r'api[_-]?key\s*=\s*["\'][^"\']+["\']',
    ]
    # Fail build if secrets found
```

### Scenario 2: SQL Injection Prevention

**Problem:** User input directly concatenated into SQL query

**Vulnerable Code:**
```python
# NEVER DO THIS
query = f"SELECT * FROM workflows WHERE name = '{user_input}'"
```

**Secure Code:**
```python
# Use parameterized queries (SQLAlchemy ORM)
result = await db.execute(
    select(WorkflowDB).where(WorkflowDB.name == user_input)
)
```

**Real Attack Example:**
```python
# Attacker input
user_input = "'; DROP TABLE workflows; --"

# Vulnerable: Would execute DROP TABLE
# Secure: Treated as literal string, safe
```

### Scenario 3: Rate Limiting Implementation

**Problem:** API endpoint vulnerable to brute force attacks

**Solution:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(request: Request, credentials: LoginRequest):
    # Login logic
    pass
```

**Result:** Prevents brute force attacks, limits to 5 attempts per minute per IP

**Security Checklist:**
- [ ] Authentication configured (JWT tokens)
- [ ] Authorization checks implemented
- [ ] Input validation on all endpoints
- [ ] API keys stored securely
- [ ] HTTPS/TLS enabled in production
- [ ] Security headers configured
- [ ] Dependencies updated regularly

**See Also:**
- [Error Codes Reference](./ERROR_CODES_REFERENCE.md) - Security-related errors
- [API Reference](./API_REFERENCE.md) - Secure API usage
- [Real-World Scenarios](#real-world-security-scenarios) - Practical security examples

## Security Principles

### Defense in Depth

Multiple layers of security:
1. **Input Validation**: Validate all inputs
2. **Authentication**: Verify user identity
3. **Authorization**: Control resource access
4. **Encryption**: Protect data in transit and at rest
5. **Monitoring**: Detect and respond to threats

### Least Privilege

- Users have minimum required permissions
- Services run with minimal privileges
- API keys have limited scopes

### Secure by Default

- Default configurations are secure
- Security features enabled by default
- Clear security warnings for risky operations

## Authentication

### Current Implementation

**JWT Tokens:**
- Access tokens: 30 minutes expiration
- Refresh tokens: 30 days expiration
- Signed with HS256 algorithm

**Password Security:**
- Bcrypt hashing (12 rounds)
- Never stored in plain text
- Password verification without timing attacks

### Best Practices

**Token Management:**
```python
# Secure token generation
SECRET_KEY = os.getenv("SECRET_KEY")  # Strong, random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Token validation
def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Password Requirements:**
- Minimum length: 8 characters
- Require complexity (future enhancement)
- Password reset tokens expire quickly
- Rate limit login attempts

### Security Headers

**Recommended Headers:**
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

## Authorization

### Resource Ownership

**Workflow Access:**
- Users own their workflows (`owner_id`)
- Public workflows accessible to all
- Sharing enables specific access

**Implementation:**
```python
async def get_workflow(
    workflow_id: str,
    current_user: UserDB
) -> WorkflowDB:
    workflow = await workflow_repository.get_by_id(workflow_id)
    
    # Check ownership or public access
    if workflow.owner_id != current_user.id and not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return workflow
```

### Role-Based Access Control (Future)

**Planned Roles:**
- Admin: Full system access
- User: Own resources only
- Viewer: Read-only access

## Input Validation

### Backend Validation

**Pydantic Models:**
```python
from pydantic import BaseModel, validator, Field

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    definition: Dict[str, Any]
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

**SQL Injection Prevention:**
- Use SQLAlchemy ORM (parameterized queries)
- Never concatenate user input into SQL
- Validate input types

**Example:**
```python
# Safe: Parameterized query
result = await db.execute(
    select(WorkflowDB).where(WorkflowDB.owner_id == user_id)
)

# Unsafe: String concatenation (NEVER DO THIS)
query = f"SELECT * FROM workflows WHERE owner_id = '{user_id}'"
```

### Frontend Validation

**Input Sanitization:**
```typescript
function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
```

**XSS Prevention:**
- React automatically escapes content
- Use `dangerouslySetInnerHTML` only when necessary
- Validate and sanitize user-generated content

## API Security

### Rate Limiting

**Implementation (Future):**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/workflows")
@limiter.limit("10/minute")
async def create_workflow(request: Request):
    # Endpoint logic
```

**Recommended Limits:**
- Authentication: 5 attempts/minute
- API endpoints: 100 requests/minute
- File uploads: 10 requests/minute

### CORS Configuration

**Production Settings:**
```python
# backend/config.py
cors_origins: List[str] = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
cors_allow_credentials: bool = True
```

**Development:**
```python
cors_origins: List[str] = ["*"]  # Only for development
```

### API Key Security

**Storage:**
- API keys stored in database
- Encrypted at rest (future enhancement)
- Never logged or exposed in errors

**Validation:**
```python
def validate_api_key(api_key: str) -> bool:
    # Check for placeholder values
    if is_placeholder_key(api_key):
        return False
    
    # Validate format (provider-specific)
    if not api_key.startswith("sk-"):
        return False
    
    return True
```

## Data Protection

### Encryption

**At Rest (Future):**
- Encrypt sensitive fields in database
- Use AES-256 encryption
- Store encryption keys securely

**In Transit:**
- Use HTTPS/TLS 1.2+
- Enforce SSL in production
- Use secure WebSocket (WSS)

### Sensitive Data Handling

**Never Log:**
- Passwords
- API keys
- Tokens
- Personal information

**Safe Logging:**
```python
logger.info(
    "API call made",
    extra={
        "provider": "openai",
        "model": "gpt-4",
        # Don't log: api_key
    }
)
```

### Data Retention

**Policies:**
- Execution logs: 90 days
- User data: Until account deletion
- Audit logs: 1 year (future)

## WebSocket Security

### Authentication

**Token-Based:**
```javascript
const token = localStorage.getItem('auth_token');
const ws = new WebSocket(
  `wss://api.example.com/ws/executions/${id}?token=${token}`
);
```

**Server Validation:**
```python
@router.websocket("/ws/executions/{execution_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    execution_id: str,
    token: str = Query(...)
):
    # Validate token
    user = await verify_token(token)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    await manager.connect(websocket, execution_id)
```

### Message Validation

**Validate All Messages:**
```python
async def handle_websocket_message(message: dict):
    # Validate message structure
    if "type" not in message:
        raise ValueError("Invalid message format")
    
    # Validate message content
    if message["type"] == "command":
        validate_command(message["command"])
```

## Dependency Security

### Dependency Management

**Regular Updates:**
```bash
# Check for vulnerabilities
pip list --outdated
npm audit

# Update dependencies
pip install --upgrade package-name
npm update
```

**Security Scanning:**
- Use `safety` for Python: `safety check`
- Use `npm audit` for Node.js
- Use Dependabot for automated updates

### Known Vulnerabilities

**Monitor:**
- CVE databases
- Security advisories
- Dependency update notifications

**Response:**
1. Assess severity
2. Update dependency
3. Test thoroughly
4. Deploy fix

## Environment Security

### Environment Variables

**Secure Storage:**
```bash
# .env file (never commit)
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

# Use secrets manager in production
# AWS Secrets Manager, HashiCorp Vault, etc.
```

**Access Control:**
- Restrict file permissions: `chmod 600 .env`
- Use secrets manager in production
- Rotate secrets regularly

### Configuration Security

**Sensitive Config:**
- Never commit secrets
- Use environment variables
- Validate configuration on startup
- Fail securely on missing config

## Monitoring and Logging

### Security Logging

**Log Security Events:**
- Authentication attempts
- Authorization failures
- API key usage
- Suspicious activity

**Example:**
```python
logger.warning(
    "Failed authentication attempt",
    extra={
        "username": username,
        "ip_address": request.client.host,
        "timestamp": datetime.utcnow()
    }
)
```

### Intrusion Detection

**Monitor:**
- Multiple failed login attempts
- Unusual API usage patterns
- Unauthorized access attempts
- Data exfiltration attempts

## Incident Response

### Security Incident Procedure

1. **Identify**: Detect security issue
2. **Contain**: Limit impact
3. **Eradicate**: Remove threat
4. **Recover**: Restore services
5. **Learn**: Post-incident review

### Reporting Security Issues

**Responsible Disclosure:**
- Email: security@example.com
- Include: Description, steps to reproduce, impact
- Allow time for fix before public disclosure

## Security Checklist

### Development

- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks implemented
- [ ] SQL injection prevented (ORM usage)
- [ ] XSS prevented (React escaping)
- [ ] CSRF protection (if applicable)
- [ ] Secure password storage
- [ ] API keys never logged
- [ ] HTTPS enforced in production
- [ ] Security headers configured

### Deployment

- [ ] Strong SECRET_KEY configured
- [ ] Database credentials secure
- [ ] CORS restricted to trusted origins
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] Security updates applied
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates valid

### Ongoing

- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Log review
- [ ] Penetration testing (periodic)
- [ ] Security training for team

## Common Vulnerabilities

### OWASP Top 10

1. **Broken Access Control**: Implement proper authorization
2. **Cryptographic Failures**: Use strong encryption
3. **Injection**: Validate and sanitize inputs
4. **Insecure Design**: Follow security principles
5. **Security Misconfiguration**: Secure defaults
6. **Vulnerable Components**: Update dependencies
7. **Authentication Failures**: Strong authentication
8. **Software and Data Integrity**: Verify integrity
9. **Security Logging Failures**: Comprehensive logging
10. **SSRF**: Validate external requests

## Related Documentation

- [Error Codes Reference](./ERROR_CODES_REFERENCE.md) - Security-related errors
- [API Reference](./API_REFERENCE.md) - Secure API usage
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Security patterns
