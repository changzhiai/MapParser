# Deployment Guide for MapParser

This guide explains how to deploy MapParser to your AWS server at `mapparser.travel-tracker.org`.

## Prerequisites

- SSH access to your AWS server.
- Node.js installed on the server (v18+ recommended).
- Nginx installed and running.
- Provide your Google Maps API Key.

## 1. Prepare the Server

Connect to your server:
```bash
ssh user@your-aws-ip
```

Navigate to your web apps directory (e.g., `/var/www` or `~/apps`):
```bash
cd ~/apps # or wherever you keep travel-tracker
```

## 2. Clone and Install

Clone the repository:
```bash
git clone https://github.com/changzhiai/MapParser.git map-parser
cd map-parser
```

Install dependencies:
```bash
npm install
```

## 3. Configure Environment

Create a `.env.local` file with your API key:
```bash
nano .env.local
```

Paste your environment variables:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

## 4. Build and Start

Build the application:
```bash
npm run build
```

Start the application using PM2 (on port 3002):
```bash
pm2 start ecosystem.config.js
pm2 save
```

## 5. Configure Nginx

Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/mapparser.travel-tracker.org
```

Paste the following configuration:

```nginx
server {
    server_name mapparser.travel-tracker.org;

    location / {
        proxy_pass http://localhost:3002; # Forward to the PM2 port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mapparser.travel-tracker.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL Configuration (HTTPS)

If you have Certbot installed:
```bash
sudo certbot --nginx -d mapparser.travel-tracker.org
```

## 7. DNS

Ensure you have created a valid DNS record (A Record or CNAME) for `mapparser` in your `travel-tracker.org` DNS settings pointing to your AWS server IP.
