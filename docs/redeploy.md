# Redeployment and Branch Shifting

Follow these steps to shift from `dev` to `release` (or any other branch) on your AWS server.

## 1. Connect to the Server
```bash
ssh ubuntu@mapparser.travel-tracker.org
```

## 2. Shift Branch
Navigate to the app directory and switch branches:
```bash
cd ~/MapParser

# 1. Fetch latest changes from remote
git fetch origin

# 2. Switch to release branch
git checkout release

# 3. Pull the latest code
git pull origin release
```

## 3. Rebuild Application
Whenever you switch branches or pull new code, you must rebuild the frontend:
```bash
# Install any new dependencies
npm install

# Build the new production frontend
npm run build
```

## 4. Restart the Service
Restart the running PM2 process to pick up the new backend changes:
```bash
# Restart using the ecosystem file
pm2 restart ecosystem.config.cjs --env production

# Verify it is running
pm2 status
```

## 5. Troubleshooting
If the app doesn't start correctly:
- **Check Logs:** `pm2 logs map-parser`
- **Port Conflict:** If the port is busy, run `sudo fuser -k 3002/tcp` and then restart PM2.
- **Env Variables:** Ensure your `.env.local` is still present in the root folder.
