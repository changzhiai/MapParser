# AWS Deployment Guide (EC2 + Nginx)

This guide provides step-by-step instructions for deploying the **MapParser** application to an AWS EC2 instance (Ubuntu 22.04 LTS).

## 1. AWS Security Group Configuration

Ensure your EC2 instance's Security Group allows the following inbound traffic:
- **Port 80 (HTTP):** Required for initial setup and Certbot.
- **Port 443 (HTTPS):** Required for secure access and social login.
- **Port 22 (SSH):** For remote access.
- **Port 3002 (Optional):** If you want to test the Node server directly via IP.

---

## 2. Server Environment Setup

Connect to your instance:
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### Install Node.js & NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Global Utilities
```bash
sudo npm install -g pm2
```

### Install Puppeteer Dependencies (CRITICAL)
Puppeteer requires several Linux libraries to run the headless browser on Ubuntu. Run this command:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

---

## 3. Application Deployment

### Clone and Install
```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/changzhiai/MapParser.git
cd MapParser
npm install
```

### Configure Environment Variables
Create the production environment file:
```bash
nano .env.local
```

Paste your production values (ensure no spaces around `=`):
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
VITE_GOOGLE_CLIENT_ID=...
VITE_IOS_GOOGLE_CLIENT_ID=...
VITE_APPLE_CLIENT_ID=org.traveltracker.mapparser
VITE_APPLE_REDIRECT_URI=https://mapparser.travel-tracker.org/api/apple-callback
VITE_API_BASE_URL=https://mapparser.travel-tracker.org

EMAIL_SERVICE=gmail
EMAIL_USER=changzhiai@gmail.com
EMAIL_PASS=your_app_password
```

### Build the Frontend
```bash
npm run build
```

---

## 4. Run Backend with PM2

The backend serves both the API and the built static files.
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

---

## 5. Reverse Proxy with Nginx (SSL)

### Install Nginx
```bash
sudo apt install nginx -y
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/mapparser
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name mapparser.travel-tracker.org;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/mapparser /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Secure with HTTPS (Certbot)

Google and Apple Sign-in **require** HTTPS.
```bash
sudo apt install python3-certbot-nginx -y
sudo certbot --nginx -d mapparser.travel-tracker.org
```
*Choose option '2' to redirect all HTTP traffic to HTTPS.*

---

## 7. Troubleshooting

- **Check Logs:** `pm2 logs map-parser`
- **Puppeteer Errors:** If you see "Timed out" or "Failed to launch", re-run the dependencies install in Step 2.
- **Port 3002 occupied:** Run `sudo fuser -k 3002/tcp` and restart PM2.
