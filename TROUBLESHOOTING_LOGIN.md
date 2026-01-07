# Troubleshooting Login 401 Error

## Issue
Getting 401 Unauthorized when trying to log in with username `rshoemake` and password `abcd1234`.

## Verification
✅ Password is correctly set in database  
✅ Password verification works (tested with bcrypt directly)  
✅ API endpoint works via curl (returns 200 OK with access token)

## Solution

**The server needs to be restarted** to pick up the code changes.

### Steps to Fix:

1. **Stop the current server** (if running):
   ```bash
   # Find and kill the server process
   pkill -f "python.*main.py"
   ```

2. **Restart the server**:
   ```bash
   # Option 1: Use the start script
   ./start.sh
   
   # Option 2: Start manually
   python main.py
   ```

3. **Clear browser cache** (optional but recommended):
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - Or clear browser cache

4. **Try logging in again**:
   - Username: `rshoemake`
   - Password: `abcd1234`

## What Was Fixed

- Updated `verify_password()` to use bcrypt directly first (more reliable)
- Added better error logging to login endpoint
- Improved frontend error handling to show detailed error messages

## Test the API Directly

You can test if the API is working:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rshoemake","password":"abcd1234"}'
```

Expected response: `{"access_token":"...","token_type":"bearer","user":{...}}`

If this works but browser login doesn't, it's likely a server restart issue.

