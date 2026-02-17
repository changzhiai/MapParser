# Redeployment and Branch Shifting Guide (Dual Port Setup)

This guide explains how to update the deployment on the AWS server (Port 3002 for Frontend, 4002 for Backend).

## 1. Connect to the Server
```bash
ssh ubuntu@54.151.8.244
```

## 2. Navigate and Switch Branch
```bash
cd ~/MapParser

# Update local git info
git fetch origin

# Switch to the desired branch (e.g., dev)
git checkout dev
git pull origin dev
```

## 3. Update Environment Variables
Ensure `.env.local` ON THE SERVER has these settings:
```bash
# Frontend Port
PORT=3002

# Backend Configuration
SERVER_PORT=4002
NEXT_PUBLIC_API_BASE_URL=https://mapparser.travel-tracker.org

# Apple Redirect (Must match dev portal)
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://mapparser.travel-tracker.org/api/apple-callback

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=changzhiai@gmail.com
EMAIL_PASS=your_app_password_here
```

## 4. Update Nginx Configuration
Your Nginx config (`/etc/nginx/sites-available/map-parser`) **must** include the API route handler. 
Edit with: `sudo nano /etc/nginx/sites-available/map-parser`

```nginx
server {
    server_name mapparser.travel-tracker.org;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Express Server)
    location /api/ {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # ... Certbot configuration follows
}
```
After editing, run:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Build and Restart
```bash
# Install & Build Frontend
npm install
npm run build

# Restart Everything
pm2 restart ecosystem.config.js --env production

# If starting for the first time:
# pm2 start ecosystem.config.js --env production
```

## 6. Verify
```bash
pm2 status
# You should see 'map-parser' (3002) and 'map-parser-backend' (4002) both 'online'

# Check logs if there are issues
pm2 logs
```
