# 🌐 WebGPU Aquarium - Server Deployment Guide

For basic deployment, see the main **[README.md](README.md)** - just copy the folder and it works!

This guide covers **specific web server configurations** for production deployments.

## 📋 Quick Deployment Checklist

✅ Copy `webgpu` folder to web server
✅ Ensure HTTPS (production) or localhost (development)
✅ Verify MIME types (usually automatic)
✅ Test with `verify.html`

## 🖥️ Web Server Configurations

### Apache 2.4

**Basic setup** (usually no config needed):

```apache
# .htaccess (optional - usually not needed)
<Files "*.js">
    Header set Content-Type "application/javascript"
</Files>

<Files "*.wgsl">
    Header set Content-Type "text/plain"
</Files>

# Enable HTTPS redirect (recommended)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Virtual Host Example**:

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Compression (optional but recommended)
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
</VirtualHost>
```

### Nginx

**Basic setup** (usually no config needed):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/html;
    index index.html;

    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # MIME Types (usually automatic)
    location ~* \.js$ {
        add_header Content-Type application/javascript;
    }

    location ~* \.wgsl$ {
        add_header Content-Type text/plain;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain application/javascript text/css image/svg+xml;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|wgsl)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### IIS 10 (Windows)

**web.config** in site root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <!-- MIME Types -->
        <staticContent>
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <mimeMap fileExtension=".wgsl" mimeType="text/plain" />
        </staticContent>

        <!-- Security Headers -->
        <httpProtocol>
            <customHeaders>
                <add name="X-Frame-Options" value="DENY" />
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
            </customHeaders>
        </httpProtocol>

        <!-- Compression -->
        <urlCompression doDynamicCompression="true" doStaticCompression="true" />

        <!-- HTTPS Redirect -->
        <rewrite>
            <rules>
                <rule name="HTTP to HTTPS redirect" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="off" ignoreCase="true" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}"
                            redirectType="Permanent" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

### Node.js (Development)

```bash
# Basic server
npx http-server ./webgpu -p 8080 --cors

# With HTTPS (for WebGPU testing)
npx http-server ./webgpu -p 8443 --ssl --cert cert.pem --key key.pem
```

### Python (Development)

```bash
# Basic server
cd webgpu
python -m http.server 8080

# With HTTPS (requires Python 3.x)
python -m http.server 8443 --bind 127.0.0.1
```

## 🔒 Security Considerations

### HTTPS Requirement

WebGPU **requires** a secure context:

- ✅ **HTTPS** in production
- ✅ **localhost** for development
- ❌ **HTTP** over network (will fail)

### Content Security Policy (CSP)

If using CSP, allow:

```
script-src 'self';
worker-src 'self';
connect-src 'self';
```

### CORS Headers

Only needed if serving assets from different domains:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

## ⚡ Performance Optimization

### Enable Compression

```
# Files to compress:
- .js (JavaScript modules)
- .html (HTML files)
- .css (stylesheets)
- .json (configuration files)

# Don't compress:
- .jpg/.png (already compressed)
- .wgsl (small files)
```

### Enable Caching

```
# Cache headers for static assets:
Cache-Control: public, max-age=31536000, immutable

# For HTML files:
Cache-Control: public, max-age=300
```

### HTTP/2

Use HTTP/2 for better loading performance with many small files.

## 🚨 Troubleshooting

### Common Issues

**"WebGPU not supported"**

- Ensure HTTPS (not HTTP)
- Use Chrome 113+, Edge 113+, Firefox 131+, or Safari 18.0+
- On older browsers, enable WebGPU: `chrome://flags/#enable-unsafe-webgpu`

**404 Errors on modules**

- Check file permissions (755 for directories, 644 for files)
- Verify `aquarium/` and `core/` folders are siblings
- Ensure no URL rewriting is affecting .js files

**CORS Errors**

- Add CORS headers if serving from different domain
- For development: use `--cors` flag with http-server

**Mixed Content Errors**

- Ensure all resources load over HTTPS
- Check browser console for specific blocked resources

### Debug Steps

1. **Check browser console** (F12) for specific errors
2. **Verify file structure**: `webgpu/aquarium/` and `webgpu/core/` must be siblings
3. **Test HTTPS**: WebGPU requires secure context
4. **Check WebGPU support**: Visit `chrome://gpu` to verify WebGPU is enabled
5. **Check MIME types**: Server must serve .js as `application/javascript`

## 📊 Testing Your Deployment

## 📊 Testing Your Deployment

### Manual Testing

1. Open: `https://yourserver.com/path/to/webgpu/aquarium/`
2. Should see fish swimming within 5 seconds
3. Test UI controls (sliders should work)
4. Check browser console (F12) for errors
5. Verify smooth animation (30+ FPS)

---

## 🎯 Production Checklist

Before going live:

- [ ] **HTTPS enabled** with valid certificate
- [ ] **Security headers** configured
- [ ] **Compression enabled** (gzip/brotli)
- [ ] **Caching configured** for static assets
- [ ] **Application loads** without console errors
- [ ] **Fish are swimming** smoothly
- [ ] **Browser console** has no errors
- [ ] **Performance** is acceptable on target devices (30+ FPS)

**Ready for production!** 🚀

---

**Need more help?** See the main [README.md](README.md) for basic deployment or [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for all guides.
