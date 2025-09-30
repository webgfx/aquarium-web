# WebGPU Aquarium - Deployment Guide

## Overview

The WebGPU Aquarium is designed to work from **any location** on your web server. You can place the `webgpu` folder anywhere, and it will automatically resolve all paths correctly.

## How It Works

The application uses **relative imports** and **dynamic path resolution** to work from any server location:

1. **Path Configuration**: `aquarium/path-config.js` detects the current script location using `import.meta.url`
2. **Base URL Resolution**: The aquarium base URL is automatically passed to the asset loader
3. **Relative Module Imports**: All JavaScript modules use relative imports (`../core/`, `./`) that resolve correctly regardless of server path
4. **Dynamic Asset Loading**: Assets (models, textures) are loaded relative to the detected aquarium base URL

## Deployment Steps

### 1. Copy the webgpu Folder

Copy the entire `webgpu` folder to your web server. You can place it:

- At the root: `http://yourserver.com/webgpu/`
- In a subdirectory: `http://yourserver.com/projects/aquarium/webgpu/`
- In a deep path: `http://yourserver.com/demos/graphics/examples/webgpu/`

**The application will work from any location!**

### 2. Ensure HTTPS (Recommended)

WebGPU requires a secure context. Use HTTPS in production:

```
https://yourserver.com/webgpu/aquarium/
```

For local development, `http://localhost` or `http://127.0.0.1` also work.

### 3. Configure MIME Types

Ensure your web server serves files with correct MIME types:

- `.js` → `application/javascript` or `text/javascript`
- `.wgsl` → `text/plain` or `application/wgsl`
- `.html` → `text/html`
- `.jpg`, `.png` → `image/jpeg`, `image/png`

### 4. Enable CORS (If Needed)

If you're loading assets from a different domain, enable CORS headers:

```
Access-Control-Allow-Origin: *
```

## Directory Structure

The deployment requires this structure to be maintained:

```
webgpu/
├── aquarium/              ← Main application entry point
│   ├── index.html        ← Open this file in browser
│   ├── test-tank.html    ← Automated test suite
│   ├── main.js
│   ├── ui.js
│   ├── config.js
│   ├── path-config.js    ← Automatic path resolution
│   ├── assets/           ← 3D models and textures
│   └── shaders/          ← WGSL shader files
└── core/                  ← Rendering engine (sibling to aquarium/)
    ├── gpu-context.js
    ├── loader.js
    ├── renderer.js
    ├── shader-loader.js
    ├── pipelines/
    └── ...
```

**Important**: The `aquarium/` and `core/` folders must remain **siblings** (in the same parent directory).

## Testing Your Deployment

### Method 1: Manual Testing

1. Open your browser to: `https://yourserver.com/path/to/webgpu/aquarium/`
2. Check the browser console (F12) for errors
3. You should see the aquarium rendering with fish swimming

### Method 2: Automated Testing

1. Navigate to: `https://yourserver.com/path/to/webgpu/aquarium/test-tank.html`
2. The automated test suite will run
3. You should see "10 / 10 tests passed" with all green checkmarks

## Common Issues

### Issue: 404 Not Found for `.js` files

**Cause**: Server is not serving JavaScript files or MIME type is incorrect

**Solution**:
- Check web server configuration
- Verify `.js` files have MIME type `application/javascript` or `text/javascript`

### Issue: "WebGPU is not supported"

**Cause**: Browser doesn't support WebGPU or not using secure context

**Solution**:
- Use Chrome/Edge 113+ or Firefox Nightly
- Ensure HTTPS (or localhost for development)
- Check browser flags: `chrome://flags/#enable-unsafe-webgpu`

### Issue: Black screen, no fish

**Cause**: Assets failed to load or GPU initialization failed

**Solution**:
- Open browser console and check for errors
- Verify all files in `aquarium/assets/` are accessible
- Check network tab for failed requests

### Issue: Shaders fail to compile

**Cause**: Shader files not loading or GPU doesn't support features

**Solution**:
- Verify `aquarium/shaders/*.wgsl` files are accessible
- Check GPU supports WebGPU (integrated graphics may have issues)
- Update graphics drivers

## Web Server Examples

### Apache

```apache
<Directory "/path/to/webgpu">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
    
    # Enable MIME types
    AddType application/javascript .js
    AddType text/plain .wgsl
</Directory>
```

### Nginx

```nginx
location /webgpu/ {
    alias /path/to/webgpu/;
    
    # Enable MIME types
    types {
        application/javascript js;
        text/plain wgsl;
    }
    
    # Enable CORS (if needed)
    add_header Access-Control-Allow-Origin *;
}
```

### IIS

```xml
<configuration>
    <system.webServer>
        <staticContent>
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <mimeMap fileExtension=".wgsl" mimeType="text/plain" />
        </staticContent>
    </system.webServer>
</configuration>
```

### Python Simple HTTP Server (Development)

```bash
cd webgpu
python -m http.server 8080
# Open: http://localhost:8080/aquarium/
```

### Node.js http-server (Development)

```bash
cd webgpu
npx http-server . -p 8080 --cors
# Open: http://localhost:8080/aquarium/
```

## Performance Tips

1. **Enable Gzip/Brotli Compression**: JavaScript and asset files compress well
2. **Use HTTP/2**: Improves loading of multiple small files
3. **Set Cache Headers**: Cache static assets (models, textures) for better performance
4. **CDN**: Consider using a CDN for static assets if serving globally

## Security Considerations

1. **HTTPS Required**: WebGPU requires secure context in production
2. **Content Security Policy**: If using CSP, allow `'unsafe-eval'` for WebGPU
3. **CORS**: Only enable if cross-origin loading is required
4. **Input Validation**: The application accepts URL parameters; ensure server validates inputs

## Troubleshooting Checklist

- [ ] All files accessible via browser (check network tab)
- [ ] JavaScript MIME type is correct
- [ ] Browser supports WebGPU
- [ ] Using HTTPS or localhost
- [ ] Console shows no errors
- [ ] Directory structure maintained (`aquarium/` and `core/` are siblings)
- [ ] All asset files present in `aquarium/assets/`
- [ ] All shader files present in `aquarium/shaders/`

## Support

For issues or questions:
1. Check browser console for specific errors
2. Run the automated test suite (`test-tank.html`)
3. Review the testing guide (`TESTING_GUIDE.md`)
4. Verify your deployment follows this guide

---

**Last Updated**: September 30, 2025  
**Tested Browsers**: Chrome 113+, Edge 113+, Firefox Nightly
