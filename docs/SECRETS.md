# Where Keys and Secrets Are Kept

**Never commit secrets to the repository.** All keys are loaded from environment variables or a local `.env` file.

## Storage Location

| Key Type | Source | File |
|---------|--------|------|
| `SECRET_KEY` | `os.getenv("SECRET_KEY")` | `.env` (gitignored) |
| `REFRESH_TOKEN_SECRET_KEY` | `os.getenv("REFRESH_TOKEN_SECRET_KEY")` | `.env` (gitignored) |
| `OPENAI_API_KEY` | `os.getenv("OPENAI_API_KEY")` | `.env` (gitignored) |
| `ANTHROPIC_API_KEY` | `os.getenv("ANTHROPIC_API_KEY")` | `.env` (gitignored) |
| `GEMINI_API_KEY` | `os.getenv("GEMINI_API_KEY")` | `.env` (gitignored) |
| `GOOGLE_API_KEY` | `os.getenv("GOOGLE_API_KEY")` | `.env` (gitignored) |
| `LOCAL_FILE_BASE_PATH` | `os.getenv("LOCAL_FILE_BASE_PATH")` | `.env` (optional) |

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your keys. **Do not commit `.env`.**

3. In production, set `SECRET_KEY` and `ENVIRONMENT=production`. The app will refuse to start without `SECRET_KEY` in production.

## Gitignore

The following are excluded from version control (see `.gitignore`):

- `.env`
- `.env.local`
- `.env.*.local`
- `*.pem`
- `*credentials*.json`
- `*secret*`

## Code References

- **Auth keys:** `backend/auth/auth.py` – loaded at import, never hardcoded
- **LLM keys:** `backend/utils/env_config_utils.py` – fallback when Settings UI not used
- **Config:** `backend/config.py` – Pydantic loads from `.env` via `env_file = ".env"`
