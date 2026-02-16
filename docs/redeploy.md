# Redeployment and Branch Shifting Guide

This guide explains how to update the deployment on the AWS server or shift between branches (e.g., from `main` to `dev`).

## 1. Connect to the Server
```bash
ssh ubuntu@54.151.8.244
```

## 2. Navigate and Switch Branch
```bash
cd ~/map-parser  # Adjust path if different

# Update local git info
git fetch origin

# Switch to the desired branch (e.g., dev)
git checkout dev

# Pull latest changes
git pull origin dev
```

## 3. Update Environment Variables
If new features (like Apple Sign-In) were added, update the `.env.local` file:
```bash
nano .env.local
```
Ensure it contains all required keys from `.env.local.template`.

## 4. Install, Build, and Restart
```bash
# Install potential new dependencies
npm install

# Build the frontend (Next.js)
npm run build

# Restart the application and server using PM2
pm2 restart map-parser
```

## 5. Verify
Check the logs if something goes wrong:
```bash
pm2 logs map-parser
```
