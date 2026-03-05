# Keys and Secrets

**Never commit secrets to the repository.** All sensitive values are loaded from environment variables.

## Where Keys Are Kept

| Key | Source | Used By |
|-----|--------|---------|
| `SECRET_KEY` | `.env` or environment | `backend/auth/auth.py` – JWT signing |
| `REFRESH_TOKEN_SECRET_KEY` | `.env` or environment | `backend/auth/auth.py` – refresh tokens |
| `OPENAI_API_KEY` | `.env` or environment | `backend/utils/env_config_utils.py` – LLM fallback |
| `ANTHROPIC_API_KEY` | `.env` or environment | `backend/utils/env_config_utils.py` – LLM fallback |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | `.env` or environment | `backend/utils/env_config_utils.py` – LLM fallback |
| LLM API keys (per provider) | Database (Settings) | `backend/services/settings_service.py` – primary source |
| GCP credentials | Database or config | `backend/inputs/input_sources.py` – GCP Bucket/PubSub |
| AWS credentials | Database or config | `backend/inputs/input_sources.py` – S3 |

## Protected from Check-in

The following are in `.gitignore` and will **not** be committed:

- `.env` – local environment file
- `.env.local`, `.env.*.local` – local overrides
- `*.pem` – certificate/key files
- `*credentials*.json` – GCP/AWS credential files
- `*secret*` – files with "secret" in the name

## Setup

1. Copy `.env.example` to `.env`
2. Fill in required values (see `.env.example` comments)
3. In production, set `SECRET_KEY` and `ENVIRONMENT=production`
4. Optionally set `LOCAL_FILE_BASE_PATH` to restrict file system access
