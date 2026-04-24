# Keys and secrets

**Never commit secrets.** Use environment variables, Kubernetes Secrets, or your cloud secret manager.

## Where values are read (Java API)

| Key / setting | Typical source | Used by |
|---------------|----------------|---------|
| `JWT_SECRET` (or configured property name) | Env / `.env` | `backend-java` — access & refresh token signing |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, etc. | Root `.env` | Fallback LLM keys when users have not saved keys in Settings |
| Per-user LLM keys | Database (`settings` / user settings) | Provider calls at execution time |
| GCP / AWS credentials for storage nodes | User or system config | Storage explorer and input nodes |

Exact property names are in `backend-java/src/main/resources/application*.properties` and the security configuration classes—search the Java tree for `jwt` and datasource settings.

## Protected from check-in

See root `.gitignore`:

- `.env`, `.env.*.local`
- `*.pem`, `*credentials*.json`, `*secret*`

## Local development

1. Copy `.env.example` → `.env` and fill values.  
2. For optional auto-login in dev, set `DEV_BOOTSTRAP_*` (see [Configuration Reference](./CONFIGURATION_REFERENCE.md#development-user-bootstrap-optional)).  
3. In production, load secrets from a vault or platform secret store—not from the repo.
