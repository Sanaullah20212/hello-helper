# BTSPRO24 WordPress Theme

এই WordPress theme টি React app এর মতো দেখতে, কিন্তু native WordPress এ চলে।

## Installation (ইনস্টলেশন)

### Step 1: Theme ডাউনলোড করুন

এই repository থেকে `wordpress-theme/btspro24/` folder টি ডাউনলোড করুন।

### Step 2: WordPress এ আপলোড করুন

**Option A - FTP/File Manager:**
1. `btspro24` folder টি আপলোড করুন এখানে:
   ```
   /wp-content/themes/btspro24/
   ```

**Option B - WordPress Admin:**
1. `btspro24` folder টি ZIP করুন
2. WordPress Admin → Appearance → Themes → Add New → Upload Theme
3. ZIP file select করে Install করুন

### Step 3: Theme Activate করুন

WordPress Admin → Appearance → Themes → BTSPRO24 Modern → Activate

### Step 4: Logo সেট করুন

1. WordPress Admin → Appearance → Customize → Site Identity
2. Logo আপলোড করুন

### Step 5: Banner Text Customize করুন

WordPress Admin → Appearance → Customize থেকে:
- **Premium Banner**: Text, Button, Link customize করুন
- **Notice Banner**: Text, Link customize করুন

## Features

✅ **Exact same design** - React app এর মতো দেখায়
✅ **SEO Friendly** - Server-side rendered
✅ **URL unchanged** - `btspro24.com/post-slug/` একই থাকে
✅ **Mobile Responsive** - সব device এ কাজ করে
✅ **Download Links Auto Extract** - Post content থেকে download links automatically parse করে
✅ **Poster Auto Extract** - First image কে poster হিসেবে দেখায়
✅ **Category Badges** - Homepage এ category shortcuts
✅ **Related Posts** - Single post এ related content দেখায়
✅ **Pagination** - Numbered pagination with Previous/Next
✅ **Search** - Built-in search functionality

## File Structure

```
btspro24/
├── style.css          # Main stylesheet with all designs
├── functions.php      # Theme functions & helpers
├── header.php         # Header template
├── footer.php         # Footer template
├── index.php          # Home page template
├── single.php         # Single post template
├── archive.php        # Category/Archive template
├── search.php         # Search results template
├── 404.php            # 404 error page
└── assets/
    └── logo.png       # Site logo
```

## Customization

### Colors পরিবর্তন করতে

`style.css` এর `:root` section এ CSS variables আছে:

```css
:root {
  --primary: hsl(172, 66%, 50%);      /* Main cyan/teal color */
  --accent: hsl(38, 95%, 55%);        /* Orange/gold accent */
  --background: hsl(192, 50%, 6%);    /* Dark background */
  /* ... more variables */
}
```

### Navigation Links পরিবর্তন করতে

`header.php` file এ navigation links edit করুন।

## Requirements

- WordPress 5.0+
- PHP 7.4+

## Support

যেকোনো সমস্যায় GitHub Issues এ জানান।
