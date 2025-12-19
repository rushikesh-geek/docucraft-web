# 🚀 Deployment Guide

This guide covers multiple ways to deploy your Smart Document Editor to the web.

---

## 📋 Table of Contents
1. [GitHub Pages (Free)](#github-pages)
2. [Netlify (Free)](#netlify)
3. [Vercel (Free)](#vercel)
4. [Traditional Web Hosting](#traditional-hosting)
5. [Customization Before Deploy](#customization)

---

## 🌐 GitHub Pages (Recommended)

**Best For:** Free hosting with version control

### Steps:

1. **Create GitHub Repository**
   ```bash
   # Initialize git (if not already)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit: Smart Document Editor"
   
   # Create repo on GitHub (github.com/new)
   # Then connect and push:
   git remote add origin https://github.com/yourusername/doc-editor.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Source: Deploy from branch
   - Branch: `main`, Folder: `/ (root)`
   - Click Save

3. **Access Your Site**
   - URL: `https://yourusername.github.io/doc-editor/`
   - Takes 2-5 minutes to deploy

### Custom Domain (Optional)
```
1. Buy domain (Namecheap, Google Domains)
2. Add CNAME file to repository root:
   echo "yourdomain.com" > CNAME
3. Configure DNS:
   Type: CNAME
   Name: www
   Value: yourusername.github.io
```

---

## ⚡ Netlify

**Best For:** Instant deploys with preview URLs

### Method 1: Drag & Drop (Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Sign up (free)
3. Drag your entire `doc-editor` folder to Netlify
4. Done! Live in 30 seconds

### Method 2: GitHub Integration (Better)

1. Push code to GitHub (see above)
2. Go to Netlify Dashboard
3. Click "New site from Git"
4. Connect GitHub → Select repository
5. Build settings:
   - Build command: (leave empty)
   - Publish directory: `/`
6. Click "Deploy site"

**Your site is live at:** `random-name-12345.netlify.app`

### Custom Domain on Netlify
```
1. Dashboard → Domain settings
2. Add custom domain
3. Follow DNS instructions
```

### Environment Variables (Future)
```
# netlify.toml
[build]
  publish = "/"

[build.environment]
  NODE_VERSION = "18"
```

---

## 🔺 Vercel

**Best For:** Next.js projects (also works for static sites)

### Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd doc-editor
   vercel
   ```

3. **Follow prompts:**
   - Setup and deploy? Yes
   - Link to existing project? No
   - Project name: doc-editor
   - Directory: `./`
   - Override settings? No

4. **Done!** Live at `doc-editor-xyz.vercel.app`

### Deploy via GitHub

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com/new)
3. Select repository
4. Click Deploy

---

## 🌍 Traditional Web Hosting

**Best For:** Existing hosting accounts (cPanel, etc.)

### Via FTP

1. **Connect to FTP** (FileZilla, Cyberduck)
   - Host: `ftp.yourdomain.com`
   - Username: [your username]
   - Password: [your password]

2. **Upload Files**
   ```
   Upload entire doc-editor folder to:
   /public_html/doc-editor/
   ```

3. **Access**
   - URL: `https://yourdomain.com/doc-editor/`

### Via cPanel File Manager

1. Login to cPanel
2. File Manager → public_html
3. Upload → Select all files
4. Extract if zipped
5. Set permissions (755 for folders, 644 for files)

---

## 🎨 Customization Before Deploy

### 1. Update Meta Tags (SEO)

Edit `index.html`:

```html
<head>
    <title>Your Name - Document Editor</title>
    <meta name="description" content="Professional web document editor">
    <meta name="author" content="Your Name">
    
    <!-- Open Graph (social sharing) -->
    <meta property="og:title" content="Smart Document Editor">
    <meta property="og:description" content="A web-based Word alternative">
    <meta property="og:image" content="https://yourdomain.com/preview.png">
    
    <!-- Favicon -->
    <link rel="icon" href="assets/favicon.ico">
</head>
```

### 2. Create Favicon

```bash
# Create a 32x32 PNG icon
# Convert to .ico using online tool
# Save as assets/favicon.ico
```

### 3. Add Google Analytics (Optional)

```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. Add Privacy Policy (If collecting data)

Create `privacy.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Policy</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>This app stores documents locally in your browser.</p>
    <p>No data is sent to any server.</p>
    <p>We do not collect personal information.</p>
</body>
</html>
```

### 5. Create robots.txt

```txt
# /robots.txt
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

### 6. Performance: Minify Files (Optional)

```bash
# Minify CSS
npx clean-css-cli assets/css/style.css -o assets/css/style.min.css

# Minify JS
npx terser assets/js/editor.js -o assets/js/editor.min.js --compress --mangle
```

Then update HTML:
```html
<link rel="stylesheet" href="assets/css/style.min.css">
<script src="assets/js/editor.min.js"></script>
```

---

## 🔒 Security Considerations

### Content Security Policy

Add to `<head>`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.quilljs.com https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline' https://cdn.quilljs.com;">
```

### HTTPS

- GitHub Pages: Automatic ✅
- Netlify: Automatic ✅
- Vercel: Automatic ✅
- Traditional: Use Let's Encrypt (free SSL)

---

## 📊 Monitoring & Analytics

### 1. Uptime Monitoring
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Pingdom](https://pingdom.com)

### 2. Performance Monitoring
- Google Lighthouse (built into Chrome DevTools)
- [WebPageTest](https://webpagetest.org)

### 3. Error Tracking
```javascript
// Add to editor.js
window.onerror = function(msg, url, line, col, error) {
    console.error('Error:', msg, 'at', url, line, col);
    // Send to error tracking service
};
```

---

## 🎯 Post-Deployment Checklist

- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify all buttons work
- [ ] Test save/load functionality
- [ ] Test PDF export
- [ ] Check page load speed (< 3 seconds)
- [ ] Verify SSL certificate (HTTPS)
- [ ] Test accessibility (screen reader)
- [ ] Add to portfolio/resume
- [ ] Share on social media

---

## 🐛 Troubleshooting

### Issue: "Page not found" on GitHub Pages
**Solution:** 
- Check repository is public
- Wait 5 minutes for deployment
- Ensure index.html is in root

### Issue: LocalStorage not working on deployed site
**Solution:**
- Must use HTTPS (not HTTP)
- Check browser privacy settings
- Clear browser cache

### Issue: PDF export fails on deployed site
**Solution:**
- Check CDN links are HTTPS
- Verify html2pdf.js loaded (check Console)
- Test with smaller document first

### Issue: Dark mode not persisting
**Solution:**
- LocalStorage requires HTTPS
- Check browser doesn't block localStorage
- Verify no CORS issues in Console

---

## 💡 Pro Tips

1. **Use a subdomain** for cleaner URLs:
   - `editor.yourdomain.com` vs `yourdomain.com/doc-editor`

2. **Add to Google Search Console**:
   - Submit sitemap
   - Monitor search traffic

3. **Create a landing page**:
   - Showcase features
   - Add screenshots
   - Include demo video

4. **Mobile app wrapper** (advanced):
   - Use Cordova/Capacitor to create mobile app
   - Deploy to App Store/Play Store

---

**🎉 Congratulations! Your editor is now live and accessible worldwide!**

Share your deployment URL and add it to your portfolio! 🚀
