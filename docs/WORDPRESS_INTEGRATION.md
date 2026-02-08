# WordPress Integration Guide - BTSPRO24

## সারসংক্ষেপ

এই React frontend কে WordPress এর সাথে integrate করার জন্য নিচের পদ্ধতিগুলো অনুসরণ করুন।

---

## Option 1: Subdomain Approach (সবচেয়ে সহজ)

### Setup:
- **Main domain**: `btspro24.com` → WordPress (SEO ও Admin)
- **Subdomain**: `app.btspro24.com` → React Frontend

### সুবিধা:
- WordPress SEO অক্ষুণ্ণ থাকে
- React app আলাদাভাবে deploy করা যায়
- কোনো conflict নেই

### অসুবিধা:
- দুটি আলাদা URL
- User experience fragmented হতে পারে

---

## Option 2: Reverse Proxy (Recommended for URL Parity)

### Nginx Configuration:

```nginx
server {
    listen 80;
    server_name btspro24.com www.btspro24.com;
    
    # WordPress Admin - সরাসরি WordPress এ যাবে
    location /wp-admin {
        proxy_pass http://wordpress-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /wp-login.php {
        proxy_pass http://wordpress-server;
        proxy_set_header Host $host;
    }
    
    location /wp-json {
        proxy_pass http://wordpress-server;
        proxy_set_header Host $host;
        # CORS headers
        add_header Access-Control-Allow-Origin *;
    }
    
    location /wp-content {
        proxy_pass http://wordpress-server;
    }
    
    # সব Frontend routes → React App
    location / {
        proxy_pass http://react-app-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # SPA fallback
        try_files $uri $uri/ /index.html;
    }
}
```

### এই পদ্ধতিতে:
- `/wp-admin`, `/wp-json` → WordPress
- বাকি সব (`/`, `/post/*`, `/category/*`) → React

---

## Option 3: WordPress Theme হিসেবে (Complex but Best SEO)

### Step 1: React Build করুন
```bash
npm run build
```

### Step 2: WordPress Theme তৈরি করুন

**wp-content/themes/btspro24-react/style.css:**
```css
/*
Theme Name: BTSPRO24 React Frontend
Description: Headless React frontend for BTSPRO24
Version: 1.0
*/
```

**wp-content/themes/btspro24-react/index.php:**
```php
<?php
// Get the React app
get_header();
?>

<div id="root"></div>

<?php
// Include React build files
$manifest = json_decode(file_get_contents(get_template_directory() . '/react-build/.vite/manifest.json'), true);
?>

<script type="module" src="<?php echo get_template_directory_uri(); ?>/react-build/<?php echo $manifest['index.html']['file']; ?>"></script>

<?php
get_footer();
?>
```

**wp-content/themes/btspro24-react/header.php:**
```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <?php
    // SEO Meta from Yoast/RankMath
    if (function_exists('wpseo_head')) {
        // Yoast SEO meta
    }
    wp_head();
    ?>
    
    <!-- React CSS -->
    <link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/react-build/assets/index.css">
</head>
<body <?php body_class(); ?>>
```

### Step 3: functions.php এ SEO handling

```php
<?php
// functions.php

// Disable WordPress default theme output
remove_action('wp_head', 'wp_generator');

// Pass WordPress data to React
function btspro24_localize_script() {
    global $post;
    
    $data = array(
        'siteUrl' => home_url(),
        'apiUrl' => rest_url('wp/v2/'),
        'nonce' => wp_create_nonce('wp_rest'),
    );
    
    // If single post, add SEO data
    if (is_single() || is_page()) {
        $data['currentPost'] = array(
            'id' => $post->ID,
            'title' => get_the_title(),
            'seoTitle' => get_post_meta($post->ID, '_yoast_wpseo_title', true),
            'seoDescription' => get_post_meta($post->ID, '_yoast_wpseo_metadesc', true),
        );
    }
    
    echo '<script>window.wpData = ' . json_encode($data) . ';</script>';
}
add_action('wp_head', 'btspro24_localize_script');

// Rewrite rules for React routes
function btspro24_rewrite_rules() {
    add_rewrite_rule('^post/([^/]+)/?$', 'index.php?name=$matches[1]', 'top');
    add_rewrite_rule('^category/([^/]+)/?$', 'index.php?category_name=$matches[1]', 'top');
}
add_action('init', 'btspro24_rewrite_rules');

// Always load index.php for frontend
function btspro24_template_redirect() {
    if (!is_admin() && !is_login_page()) {
        include(get_template_directory() . '/index.php');
        exit;
    }
}
// add_action('template_redirect', 'btspro24_template_redirect');
```

---

## Option 4: Prerendering for SEO (Recommended)

### Using prerender.io বা similar service:

1. **Deploy React app** (Vercel/Netlify)
2. **Setup prerender.io** - Googlebot এর জন্য prerendered HTML serve করবে
3. **Configure WordPress** - API only mode

### Cloudflare Workers দিয়ে:

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check if bot
  const isBot = /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot/i.test(userAgent)
  
  if (isBot) {
    // Serve prerendered version
    return fetch(`https://prerender.io/https://btspro24.com${url.pathname}`)
  }
  
  // Serve React app
  return fetch(request)
}
```

---

## URL Structure Mapping

| WordPress URL | React Route | Status |
|--------------|-------------|--------|
| `/` | `/` | ✅ Same |
| `/?p=123` → `/post-slug/` | `/post/post-slug` | ⚠️ Need redirect |
| `/category/bengali-movie/` | `/category/bengali-movie` | ✅ Same |
| `/wp-admin/` | WordPress | ✅ Separate |
| `/wp-json/` | WordPress API | ✅ API |

### 301 Redirects (WordPress এ):

```php
// functions.php এ যোগ করুন
function btspro24_old_url_redirects() {
    // Old permalink to new
    if (is_single()) {
        global $post;
        $new_url = home_url('/post/' . $post->post_name . '/');
        if ($_SERVER['REQUEST_URI'] !== '/post/' . $post->post_name . '/') {
            wp_redirect($new_url, 301);
            exit;
        }
    }
}
// add_action('template_redirect', 'btspro24_old_url_redirects');
```

---

## SEO Checklist

### ✅ Must Do:
1. **Yoast/RankMath রাখুন** - WordPress এ SEO plugin active রাখুন
2. **Server-side meta tags** - PHP দিয়ে `<head>` এ meta inject করুন
3. **Sitemap** - WordPress sitemap ব্যবহার করুন (`/sitemap.xml`)
4. **Canonical URLs** - প্রতিটি page এ canonical tag
5. **robots.txt** - WordPress এর robots.txt ব্যবহার করুন

### React এ SEO Component:

```tsx
// src/components/SEO.tsx
import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const SEO = ({ title, description, canonical, ogImage }: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) || 
                 document.querySelector(`meta[property="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      }
    };
    
    updateMeta('description', description);
    updateMeta('og:title', title);
    updateMeta('og:description', description);
    if (ogImage) updateMeta('og:image', ogImage);
    
    // Update canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (link && canonical) {
      link.setAttribute('href', canonical);
    }
  }, [title, description, canonical, ogImage]);
  
  return null;
};

export default SEO;
```

---

## Deploy Steps

### Vercel/Netlify তে Deploy:

1. **GitHub এ push করুন** (Lovable → Export to GitHub)
2. **Vercel/Netlify এ connect করুন**
3. **Environment variables সেট করুন:**
   ```
   VITE_WP_API_URL=https://btspro24.com/wp-json/wp/v2
   ```
4. **Custom domain configure করুন**

### WordPress Server এ:

1. **API enable আছে কিনা check করুন**
2. **CORS headers add করুন** (functions.php):
   ```php
   add_action('rest_api_init', function() {
       remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
       add_filter('rest_pre_serve_request', function($value) {
           header('Access-Control-Allow-Origin: *');
           header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
           header('Access-Control-Allow-Headers: Content-Type, Authorization');
           return $value;
       });
   });
   ```

---

## Recommended Approach for btspro24.com

### Phase 1: Parallel Deployment
1. React app deploy করুন `app.btspro24.com` এ
2. Testing করুন thoroughly
3. WordPress এ link দিন new frontend এর

### Phase 2: Full Migration
1. Reverse proxy setup করুন
2. `/wp-admin` WordPress এ রাখুন
3. বাকি সব React এ route করুন
4. SEO monitoring করুন (Google Search Console)

### Phase 3: Optimization
1. Prerendering add করুন (SEO এর জন্য)
2. CDN setup করুন
3. Caching optimize করুন

---

## Important Notes

⚠️ **SEO Warning**: 
- React (CSR) এ SEO fully depend করে Google এর JavaScript rendering এর উপর
- Critical pages এর জন্য prerendering recommend করা হচ্ছে
- Alternatively, Next.js এ migrate করলে SSR/SSG পাবেন (Lovable এর বাইরে)

✅ **URL Parity**: 
- WordPress permalinks: `Post name`
- React routes match করছে: `/post/[slug]`, `/category/[slug]`
- 301 redirects setup করুন পুরনো URLs এর জন্য
