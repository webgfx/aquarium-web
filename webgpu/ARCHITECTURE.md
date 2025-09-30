# WebGPU Aquarium - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Web Server                     │
│  http://yourserver.com/any/path/webgpu/aquarium/                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Entry Points                                │
├─────────────────────────────────────────────────────────────────┤
│  • index.html     → Main aquarium application                   │
│  • verify.html    → Deployment verification                     │
│  • test-tank.html → Automated test suite                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│                   (aquarium/main.js)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐      │
│  │ path-config.js│  │  config.js   │  │    ui.js       │      │
│  │ Auto-detect   │  │ Scene setup  │  │ UI controls    │      │
│  │ base URLs     │  │ Fish counts  │  │ Sliders        │      │
│  └───────┬───────┘  └──────┬───────┘  └────────┬───────┘      │
│          │                 │                    │               │
│          └─────────────────┴────────────────────┘               │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Core Engine                                │
│                    (core/renderer.js)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌─────────────┐  ┌────────────────┐      │
│  │  gpu-context.js│  │  loader.js  │  │ texture-cache  │      │
│  │  Setup WebGPU  │  │ Load assets │  │ Cache textures │      │
│  └────────┬───────┘  └──────┬──────┘  └────────┬───────┘      │
│           │                 │                   │               │
│           └─────────────────┴───────────────────┘               │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────┐        │
│  │         Animation & Scene Management               │        │
│  │                                                     │        │
│  │  ┌──────────────┐  ┌──────────────┐               │        │
│  │  │ fish-school  │  │scene-registry│               │        │
│  │  │ Flocking AI  │  │ Scene defs   │               │        │
│  │  └──────────────┘  └──────────────┘               │        │
│  └────────────────────────────────────────────────────┘        │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Rendering Pipelines                           │
│                   (core/pipelines/*.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌─────┐│
│  │ diffuse  │  │   fish   │  │ seaweed  │  │ inner │  │outer││
│  │ pipeline │  │ pipeline │  │ pipeline │  │ tank  │  │tank ││
│  │          │  │          │  │          │  │refract│  │refl ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘  └──┬──┘│
│       │             │             │            │         │    │
│       └─────────────┴─────────────┴────────────┴─────────┘    │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Shaders                                  │
│                   (aquarium/shaders/*.wgsl)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌─────┐│
│  │diffuse   │  │  fish    │  │ seaweed  │  │ inner │  │outer││
│  │.wgsl     │  │ .wgsl    │  │ .wgsl    │  │ .wgsl │  │.wgsl││
│  │          │  │          │  │          │  │       │  │     ││
│  │Lighting  │  │Instanced │  │Animated  │  │Refract│  │Refl ││
│  │PBR       │  │Transform │  │Vertices  │  │Skybox │  │Alpha││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬───┘  └──┬──┘│
│       │             │             │            │         │    │
└───────┼─────────────┼─────────────┼────────────┼─────────┼────┘
        │             │             │            │         │
        └─────────────┴─────────────┴────────────┴─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WebGPU API                                │
│                    (Browser Native)                              │
├─────────────────────────────────────────────────────────────────┤
│  • GPU Device                                                    │
│  • Command Encoder                                               │
│  • Render Pass                                                   │
│  • Bind Groups                                                   │
│  • Buffers & Textures                                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GPU Hardware                             │
│                   (Graphics Card)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization Flow

```
index.html
    ↓
main.js
    ↓
path-config.js ──→ Detect AQUARIUM_BASE URL
    ↓
gpu-context.js ──→ Initialize WebGPU device
    ↓
loader.js ──────→ Load assets (models, textures)
    ↓              ↓
    │         assets/*.js (3D models)
    │              ↓
renderer.js ←──── Receive asset package
    ↓
Create pipelines & bind groups
    ↓
Start render loop
```

### 2. Render Loop Flow

```
requestAnimationFrame
    ↓
Update simulation
    ├─→ fish-school.js (update fish positions)
    ├─→ Animate seaweed (time-based)
    └─→ Update uniforms (camera, lights)
    ↓
Begin render pass
    ↓
Draw scene objects (in order):
    ├─→ 1. Environment (skybox/background)
    ├─→ 2. Opaque objects (rocks, floor, etc.)
    ├─→ 3. Seaweed (with transparency)
    ├─→ 4. Fish (instanced rendering)
    ├─→ 5. Inner tank (refraction)
    └─→ 6. Outer tank (reflection)
    ↓
End render pass
    ↓
Submit command buffer to GPU
    ↓
Update FPS counter
    ↓
Loop back to requestAnimationFrame
```

### 3. Asset Loading Flow

```
loader.js
    ↓
Fetch assets/${ModelName}.js
    ↓
Parse JSON data
    ↓
Create typed arrays (Float32, Uint16, etc.)
    ↓
Create GPU buffers
    ↓
Store in AquariumModel
    ↓
Return asset package to renderer
```

### 4. Texture Loading Flow

```
renderer.js
    ↓
Request texture (URL)
    ↓
texture-cache.js
    ├─→ Check cache (already loaded?)
    │   YES → Return cached texture
    │   NO ↓
    ├─→ Fetch image file
    ├─→ Create ImageBitmap
    ├─→ Create GPU texture
    ├─→ Copy image data to texture
    ├─→ Generate mipmaps (optional)
    ├─→ Cache texture
    └─→ Return texture record
```

### 5. Pipeline Creation Flow

```
renderer.js
    ↓
Request pipeline (type: fish, seaweed, etc.)
    ↓
pipelines/fish.js (example)
    ↓
shader-loader.js
    ├─→ Fetch .wgsl file
    ├─→ Create shader module
    └─→ Return to pipeline
    ↓
Create pipeline layout
    ├─→ Frame bind group layout (camera, lights)
    ├─→ Model bind group layout (transform)
    └─→ Material bind group layout (textures)
    ↓
Create render pipeline
    ├─→ Set vertex shader entry point
    ├─→ Set fragment shader entry point
    ├─→ Configure blend mode
    ├─→ Configure depth testing
    └─→ Set topology (triangles, lines, etc.)
    ↓
Return pipeline to renderer
```

## Module Dependencies

```
aquarium/main.js
  ├── aquarium/path-config.js
  ├── aquarium/config.js
  ├── aquarium/ui.js
  ├── core/gpu-context.js
  ├── core/loader.js
  └── core/renderer.js
        ├── core/texture-cache.js
        ├── core/animation/fish-school.js
        ├── core/scene-registry.js
        ├── core/pipelines/diffuse.js
        ├── core/pipelines/fish.js
        ├── core/pipelines/seaweed.js
        ├── core/pipelines/inner.js
        ├── core/pipelines/outer.js
        └── core/shader-loader.js
              ├── aquarium/shaders/diffuse.wgsl
              ├── aquarium/shaders/fish.wgsl
              ├── aquarium/shaders/seaweed.wgsl
              ├── aquarium/shaders/inner.wgsl
              └── aquarium/shaders/outer.wgsl
```

## Key Design Patterns

### 1. Path Resolution Pattern

**Problem**: Application needs to work from any server location

**Solution**: Auto-detect base URL using `import.meta.url`

```javascript
// path-config.js
const scriptUrl = new URL(import.meta.url);
export const AQUARIUM_BASE = new URL('./', scriptUrl).href;
```

### 2. Cache Pattern

**Problem**: Loading same texture multiple times wastes bandwidth

**Solution**: Texture cache with URL-based lookup

```javascript
// texture-cache.js
if (this.cache.has(url)) {
  return this.cache.get(url);
}
// ... load texture ...
this.cache.set(url, record);
```

### 3. Pipeline Builder Pattern

**Problem**: Verbose WebGPU pipeline creation code

**Solution**: PipelineBuilder with fluent interface

```javascript
// base-pipeline.js
createPipeline(config) {
  return this.device.createRenderPipeline({
    // ... complex configuration ...
  });
}
```

### 4. Flyweight Pattern

**Problem**: Thousands of fish need same mesh data

**Solution**: Shared geometry, instanced rendering

```javascript
// renderer.js
drawInstanced(vertexCount, instanceCount);
// One mesh, many instances
```

### 5. Observer Pattern

**Problem**: UI changes need to update render settings

**Solution**: UI state observable by renderer

```javascript
// main.js
ui.onChange(() => {
  renderer.updateSettings(ui.getState());
});
```

## Performance Optimizations

### GPU-Side
- **Instanced Rendering**: 1000+ fish with single draw call
- **Texture Atlasing**: Multiple textures in one
- **Mipmapping**: Better texture sampling
- **Early-Z**: Depth test before fragment shader

### CPU-Side
- **Asset Caching**: Load once, reuse
- **Typed Arrays**: Direct buffer mapping
- **Frustum Culling**: Skip invisible objects
- **Object Pooling**: Reuse allocations

### Memory
- **Shared Buffers**: Uniform data shared across objects
- **Texture Compression**: (Future enhancement)
- **LOD System**: (Future enhancement)

---

**Last Updated**: September 30, 2025  
**Architecture Version**: 2.0 (Portable)
