# BTSPRO24 Hestia Panel + Nginx SEO Configuration

## Dynamic Sitemap Index (Like Rank Math)

Sitemap Index এবং sub-sitemaps automatically generated হয় database থেকে।

### Sitemap URLs:

| URL | Description |
|-----|-------------|
| `/sitemap_index.xml` | Main sitemap index (links to all sub-sitemaps) |
| `/sitemap-pages.xml` | Static pages (home, search, free-episodes) |
| `/sitemap-shows.xml` | All TV shows with images |
| `/sitemap-categories.xml` | Categories and sections |
| `/sitemap-episodes-1.xml` | Episodes (paginated, 1000 per file) |

### Nginx Sitemap Configuration

Add this to your Nginx config:

```nginx
# Sitemap Index
location = /sitemap_index.xml {
    proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/sitemap?type=index;
    proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
    proxy_ssl_server_name on;
    proxy_cache_valid 200 1h;
    add_header Cache-Control "public, max-age=3600";
}

# Legacy sitemap.xml redirect to index
location = /sitemap.xml {
    return 301 /sitemap_index.xml;
}

# Static Pages Sitemap
location = /sitemap-pages.xml {
    proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/sitemap?type=pages;
    proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
    proxy_ssl_server_name on;
    proxy_cache_valid 200 1h;
}

# Shows Sitemap
location = /sitemap-shows.xml {
    proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/sitemap?type=shows;
    proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
    proxy_ssl_server_name on;
    proxy_cache_valid 200 1h;
}

# Categories Sitemap
location = /sitemap-categories.xml {
    proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/sitemap?type=categories;
    proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
    proxy_ssl_server_name on;
    proxy_cache_valid 200 1h;
}

# Episodes Sitemaps (paginated)
location ~ ^/sitemap-episodes-(\d+)\.xml$ {
    proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/sitemap?type=episodes&page=$1;
    proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
    proxy_ssl_server_name on;
    proxy_cache_valid 200 1h;
}
```

---

# Hestia Panel - Static React App Hosting Guide

এই guide অনুসরণ করে তোমার React app Hestia VPS-এ হোস্ট করতে পারবে। যেহেতু app টি Supabase backend ব্যবহার করে, শুধু static files হোস্ট করলেই হবে।

## Quick Start Summary

1. Lovable থেকে GitHub-এ push করো
2. সার্ভারে clone করে `npm run build` দাও
3. Build files কে domain এর `public_html` এ কপি করো
4. Nginx config-এ SPA routing + SEO Bot handling যোগ করো

## Step 1: GitHub-এ Project Push করো

### Lovable থেকে GitHub Connect করো:
1. Lovable এ যাও → **Settings** → **GitHub**
2. **Connect to GitHub** ক্লিক করো
3. Repository তৈরি করো বা existing repo select করো
4. **Sync** করে code push করো

---

## Step 2: Server-এ SSH করো

```bash
ssh root@your-server-ip

# অথবা user হিসেবে
ssh btspro24@your-server-ip
```

---

## Step 3: Node.js Install করো (যদি না থাকে)

```bash
# Check করো Node আছে কিনা
node -v

# না থাকলে install করো
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v  # v20.x.x
npm -v   # 10.x.x
```

---

## Step 4: Project Clone ও Build করো

```bash
# Home directory তে যাও
cd /home/btspro24

# GitHub থেকে clone করো
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git react-app
cd react-app

# Dependencies install করো
npm install

# Production build করো
npm run build
```

---

## Step 5: Build Files Deploy করো

```bash
# Domain এর public_html এ build files কপি করো
cp -r dist/* /home/btspro24/web/btspro24.com/public_html/

# Permissions ঠিক করো
chown -R btspro24:btspro24 /home/btspro24/web/btspro24.com/public_html/
```

---

## Step 6: Nginx SPA Routing + SEO Bot Handling Configure করো

### Option A: Hestia Panel থেকে (Recommended)

1. **Hestia Panel** → **Web** → **btspro24.com** → **Edit**
2. **Advanced Options** expand করো
3. **Nginx Template** এ **Custom** select করো
4. নিচের config যোগ করো

### Option B: SSH দিয়ে Config Edit করো

```bash
# Custom template তৈরি করো
sudo nano /etc/nginx/conf.d/btspro24.com.conf
```

**Nginx Config with SEO Bot Pre-rendering:**

```nginx
# Define bot user agents for pre-rendering
map $http_user_agent $is_bot {
    default 0;
    ~*googlebot 1;
    ~*bingbot 1;
    ~*yandexbot 1;
    ~*duckduckbot 1;
    ~*slurp 1;
    ~*baiduspider 1;
    ~*facebookexternalhit 1;
    ~*twitterbot 1;
    ~*rogerbot 1;
    ~*linkedinbot 1;
    ~*embedly 1;
    ~*quora\ link\ preview 1;
    ~*showyoubot 1;
    ~*outbrain 1;
    ~*pinterest 1;
    ~*slackbot 1;
    ~*vkshare 1;
    ~*w3c_validator 1;
    ~*redditbot 1;
    ~*applebot 1;
    ~*whatsapp 1;
    ~*flipboard 1;
    ~*tumblr 1;
    ~*bitlybot 1;
    ~*skypeuripreview 1;
    ~*nuzzel 1;
    ~*discordbot 1;
    ~*qwantify 1;
    ~*pinterestbot 1;
    ~*chrome-lighthouse 1;
    ~*telegrambot 1;
}

server {
    listen 80;
    server_name btspro24.com www.btspro24.com;
    root /home/btspro24/web/btspro24.com/public_html;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static Assets - Long Cache
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Fonts & Icons
    location ~* \.(ico|svg|woff|woff2|ttf|eot|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SEO Bot Pre-rendering - Redirect bots to Edge Function
    location / {
        if ($is_bot = 1) {
            # Proxy bot requests to Supabase Edge Function for pre-rendered HTML
            rewrite ^(.*)$ /seo-render?path=$1 last;
        }
        
        # SPA Routing - All routes go to index.html
        try_files $uri $uri/ /index.html;
    }

    # SEO Render Proxy
    location /seo-render {
        internal;
        proxy_pass https://kymzvgirngoeatuiafan.supabase.co/functions/v1/seo-render;
        proxy_set_header Host kymzvgirngoeatuiafan.supabase.co;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;
        
        # Pass original path
        proxy_set_header X-Original-Path $request_uri;
        
        # Cache bot responses for 1 hour
        proxy_cache_valid 200 1h;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

---

## Step 7: SSL Certificate Setup (HTTPS)

### Hestia Panel থেকে:
1. **Web** → **btspro24.com** → **Edit**
2. **SSL Support** enable করো
3. **Let's Encrypt SSL** enable করো
4. Save করো

### CLI থেকে:
```bash
sudo /usr/local/hestia/bin/v-add-letsencrypt-domain btspro24 btspro24.com
```

---

## Step 8: Nginx Restart করো

```bash
# Nginx config test করো
sudo nginx -t

# ঠিক থাকলে restart করো
sudo systemctl restart nginx

# অথবা Hestia command ব্যবহার করো
sudo /usr/local/hestia/bin/v-rebuild-web-domains btspro24
```

---

## Step 9: Auto-Deploy Script (Optional)

যখন GitHub এ code update হবে, automatically deploy করার জন্য:

```bash
# Deploy script তৈরি করো
cat > /home/btspro24/deploy.sh << 'EOF'
#!/bin/bash
cd /home/btspro24/react-app
git pull origin main
npm install
npm run build
cp -r dist/* /home/btspro24/web/btspro24.com/public_html/
echo "Deployed at $(date)"
EOF

# Executable বানাও
chmod +x /home/btspro24/deploy.sh
```

### Manual Deploy:
```bash
/home/btspro24/deploy.sh
```

### Cron Job (Auto-check every hour):
```bash
crontab -e
# যোগ করো:
0 * * * * /home/btspro24/deploy.sh >> /home/btspro24/deploy.log 2>&1
```

---

## Google Search Console Setup

### Step 1: Site Verify করো
1. [Google Search Console](https://search.google.com/search-console) এ যাও
2. **Add Property** → **URL prefix** → `https://www.btspro24.com`
3. HTML file verification method select করো
4. File download করে `public_html` এ রাখো

### Step 2: Sitemap Submit করো
1. **Sitemaps** menu তে যাও
2. `sitemap.xml` submit করো
3. Status check করো

### Step 3: Index Request করো
1. **URL Inspection** tool ব্যবহার করো
2. Important pages manually request করো
3. Mobile usability check করো

---

## Troubleshooting

### Page Refresh এ 404 Error
- Nginx config এ `try_files $uri $uri/ /index.html;` আছে কিনা দেখো
- Config reload করো: `sudo systemctl reload nginx`

### Assets Load হচ্ছে না
- File permissions চেক করো: `ls -la /home/btspro24/web/btspro24.com/public_html/`
- `chown -R btspro24:btspro24` দাও

### API Connection Error
- Browser console এ CORS error আছে কিনা দেখো
- Supabase URL সঠিক আছে কিনা verify করো

### SEO Bot Pre-rendering Not Working
- Edge function logs check করো
- `curl -A "Googlebot" https://btspro24.com/` দিয়ে test করো
- Nginx proxy_pass URL সঠিক কিনা verify করো

### Check Logs
```bash
# Nginx error log
tail -f /var/log/nginx/domains/btspro24.com.error.log

# Nginx access log  
tail -f /var/log/nginx/domains/btspro24.com.log
```

---

## Final Checklist

- [ ] Node.js v20+ installed
- [ ] Project cloned from GitHub
- [ ] `npm run build` successful
- [ ] Build files copied to public_html
- [ ] Nginx SPA routing configured
- [ ] SEO bot pre-rendering configured
- [ ] SSL certificate installed
- [ ] Site loads at https://btspro24.com
- [ ] All routes work on page refresh
- [ ] Admin panel accessible at /admin
- [ ] Google Search Console verified
- [ ] Sitemap submitted

---

## Quick Commands Reference

```bash
# Deploy latest changes
cd /home/btspro24/react-app && git pull && npm run build && cp -r dist/* /home/btspro24/web/btspro24.com/public_html/

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Rebuild Hestia domain
sudo /usr/local/hestia/bin/v-rebuild-web-domain btspro24 btspro24.com

# Test bot pre-rendering
curl -A "Googlebot" https://btspro24.com/

# Check disk space
df -h

# Check running processes
htop
```
