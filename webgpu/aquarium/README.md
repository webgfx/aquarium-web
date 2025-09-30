# WebGPU Aquarium

A real-time underwater aquarium scene rendered using WebGPU, featuring:

- 🐠 **Animated Fish Schools** - Multiple fish species with flocking behavior
- 🌊 **Tank Refraction & Reflection** - Realistic water effects using cube maps
- 🌿 **Dynamic Seaweed** - Vertex-animated underwater plants
- 🎨 **Advanced Rendering** - PBR materials, normal mapping, and transparency
- 🎮 **Interactive Controls** - Adjust fish count, rendering options, and view settings

## Quick Start

### Option 1: Verify Deployment First (Recommended)

Open `verify.html` in your browser to check if everything is configured correctly:

```
http://yourserver.com/path/to/webgpu/aquarium/verify.html
```

This will run 7 automated checks and tell you if the deployment is ready.

### Option 2: Launch Directly

Open `index.html` in your browser:

```
http://yourserver.com/path/to/webgpu/aquarium/
```

Or for automated testing:

```
http://yourserver.com/path/to/webgpu/aquarium/test-tank.html
```

## Requirements

- **Browser**: Chrome/Edge 113+ or Firefox Nightly with WebGPU enabled
- **Connection**: HTTPS (or localhost for development)
- **GPU**: Modern graphics card with WebGPU support

## Files

- `index.html` - Main aquarium application
- `verify.html` - Deployment verification page
- `test-tank.html` - Automated test suite
- `main.js` - Application entry point
- `path-config.js` - Automatic path resolution
- `config.js` - Scene and rendering configuration
- `ui.js` - User interface controls
- `assets/` - 3D models and textures
- `shaders/` - WGSL shader programs

## Deployment

This aquarium can be deployed to **any location** on your web server. Just copy the entire `webgpu` folder and it will work automatically.

See `../DEPLOYMENT.md` for detailed deployment instructions.

## Controls

- **Fish Presets**: Buttons to quickly set fish count (Few, Some, Many, Lots)
- **Toggle Options**: Enable/disable individual scene elements
- **Toggle Advanced**: Advanced rendering options
- **Change View**: Cycle through different camera views
- **Sliders**: Adjust tank parameters and animation speed

## Features

### Rendering Techniques

1. **Tank System**
   - Inner shell with refraction (bends skybox through water)
   - Outer shell with reflection (mirrors environment)
   - Environment cube mapping for realistic lighting

2. **Fish Animation**
   - Flocking behavior (separation, alignment, cohesion)
   - Species-specific swimming patterns
   - Instanced rendering for performance

3. **Seaweed Animation**
   - Vertex shader animation
   - Wave-based motion
   - Per-blade randomization

4. **Lighting**
   - Directional lighting
   - Ambient occlusion
   - Specular highlights

### Performance

- **Optimized Rendering**: Efficient WebGPU pipelines
- **Instanced Drawing**: Handles thousands of fish
- **Texture Caching**: Reuses loaded textures
- **Frustum Culling**: Only renders visible objects

## Troubleshooting

### Black screen or no rendering

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed file loads
4. Verify WebGPU support: Visit `chrome://gpu` (Chrome/Edge)

### "WebGPU is not supported"

- Update your browser to the latest version
- Enable WebGPU: `chrome://flags/#enable-unsafe-webgpu` (Chrome)
- Try a different browser (Chrome/Edge recommended)
- Check if your GPU supports WebGPU

### 404 errors for files

- Verify all files were copied correctly
- Check web server is serving JavaScript files
- Ensure `aquarium/` and `core/` are siblings
- See `../DEPLOYMENT.md` for server configuration

### Performance issues

- Reduce fish count using presets (Few or Some)
- Disable advanced rendering options
- Update graphics drivers
- Close other GPU-intensive applications

## Documentation

- `../DEPLOYMENT.md` - Deployment guide for any web server
- `../PORTABLE_DEPLOYMENT.md` - Technical implementation details
- `../TESTING_GUIDE.md` - Manual and automated testing procedures
- `../VERIFICATION.md` - Quick verification guide
- `../TANK_RENDERING_SUMMARY.md` - Tank rendering technical details

## Project Structure

```
webgpu/
├── aquarium/         ← You are here
│   ├── index.html    ← Main entry point
│   ├── verify.html   ← Deployment checker
│   └── ...
└── core/             ← Rendering engine
    ├── renderer.js   ← Main renderer
    ├── loader.js     ← Asset loader
    └── pipelines/    ← Render pipelines
```

## License

Based on the classic WebGL Aquarium demo, ported to WebGPU.

## Credits

- Original WebGL Aquarium by Google
- WebGPU port and enhancements
- 3D models and textures from original demo

---

**Need Help?**

1. Run `verify.html` to diagnose issues
2. Run `test-tank.html` to test all features
3. Check browser console for specific errors
4. Review documentation in parent directory

**Enjoy the aquarium! 🐠🌊**
