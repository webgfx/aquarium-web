# 📐 WebGPU Aquarium - Technical Architecture

Complete technical overview of the WebGPU aquarium architecture, design patterns, and implementation details.

## 🎯 Design Goals

- **WebGPU Migration**: Re-create the existing WebGL aquarium on the modern WebGPU API
- **Feature Parity**: Preserve all functionality - animated fish, lasers, bubbles, light rays, tank/museum modes, fog controls, camera presets, and VR support
- **Self-Contained**: Keep WebGPU code independent under `webgpu/` without importing WebGL helpers
- **Performance**: Leverage WebGPU's lower-level control for better performance than WebGL version

## 🏗️ System Architecture

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

## 📁 Project Structure

```
webgpu/
  aquarium/
    index.html             # Entry point & UI shell
    config.js              # Configuration shared across modules
    main.js                # Bootstraps app, handles render loop
    ui.js                  # Slider + options wiring
    path-config.js         # Auto-detect base URLs
    assets/
      *.js                 # JSON model data (Float32Arrays)
    static_assets/
      *.jpg, *.png         # Texture images
    shaders/
      *.wgsl               # WGSL programs for each material
  core/
    gpu-context.js         # WebGPU adapter/device/canvas helper
    loader.js              # Fetch JSON assets + build typed arrays
    texture-cache.js       # Image bitmap -> GPUTexture caching
    scene-registry.js      # Defines scene groups analogous to WebGL version
    bindings.js            # Bind group layouts and bind group builders
    renderer.js            # Main rendering orchestration
    math.js                # Minimal matrix/vector utilities
    shader-loader.js       # WGSL shader compilation
    pipelines/
      base-pipeline.js     # Shared pipeline factory utilities
      diffuse.js           # Diffuse shaded models
      normal-map.js        # Normal-mapped models
      reflection.js        # Reflection-mapped models
      fish.js              # Animated fish vertex logic
      laser.js             # Laser billboard pipeline
      light-ray.js         # Light ray billboard pipeline
      particles.js         # Bubble particle system
    animation/
      fish-school.js       # Fish position/tail animation logic
      light-rays.js        # Wiggling light rays
      bubbles.js           # Bubble triggers and emitters
    xr.js                  # WebXR integration (optional)
```

## 🔄 Data Flow

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

### 2. Render Loop Contract

`main.js` orchestrates initialization:

1. **Device Setup**: Acquire WebGPU device/swap chain via `gpu-context.js`
2. **Asset Loading**: Load all JSON model assets and textures through `loader.js` & `texture-cache.js`
3. **Pipeline Creation**: Build pipeline instances per shading type using `pipelines/*` helpers
4. **Animation Setup**: Instantiate animation managers (fish schools, bubbles, light rays)
5. **UI Registration**: Register UI callbacks (`ui.js`) to mutate shared state (`config.js`)
6. **Render Loop**: Enter RAF loop (or XR frame loop) calling `renderFrame(delta)`

**Render Frame Steps**:

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

## 🧩 Module Dependencies

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

## 🎨 Design Patterns

### 1. Path Resolution Pattern

**Problem**: Application needs to work from any server location

**Solution**: Auto-detect base URL using `import.meta.url`

```javascript
// path-config.js
const scriptUrl = new URL(import.meta.url);
export const AQUARIUM_BASE = new URL("./", scriptUrl).href;
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

## 🎮 Resource Management

### Asset Production

Each model asset produces:

- **Vertex buffers** per attribute (`position`, `normal`, `tangent`, `binormal`, `texCoord`)
- **Index buffer** (`Uint16Array` or `Uint32Array`)
- **Bind group** referencing textures (diffuse/normal/reflection/skybox) & shared sampler

### Uniform Buffers

- **`FrameUniforms`**: viewProjection, viewInverse, light data, fog constants
- **`ModelUniforms`**: world matrices + per-model scalars
- **`FishInstanceUniforms`**: structured for N fish instances each frame

### Dynamic Updates

Dynamic uniforms implemented via `GPUBuffer` with `MAP_WRITE | COPY_DST` update per frame (triple buffered to avoid stalls).

## 🎨 Shader Architecture (WGSL)

### Shader Translation

- **Diffuse/normal-map/reflection** pipelines translate GLSL logic into WGSL, preserving fog math via togglable constants
- **Fish vertex shader** reconstructs orientation from current and next position, applies bend animation identical to WebGL version
- **Fragment shaders** sample textures, compute lighting, apply fog when enabled
- **Billboard effects** (laser, light ray, bubbles) use instanced quads with per-instance uniforms

### Pipeline Specialization

```javascript
// Pipeline constants for feature toggling
constants: {
  'fog_enabled': fogEnabled,
  'normal_mapping': hasNormalMap,
  'reflection_enabled': hasReflectionMap
}
```

## ✨ Feature Implementation

### 🐠 Fish Animation

- **CPU**: Updates positions & uniforms using flocking algorithm
- **GPU**: Handles vertex skinning per instance with tail bend animation

### 🏛️ Tank & Museum Modes

- **Render groups** toggled via UI
- **Pipelines** skip groups when disabled via configuration

### 🌊 Normal Maps & Reflections

- **Controlled** via boolean uniforms & pipeline specialization constants
- **Tangent space** calculations for proper normal mapping

### 🌫️ Fog System

- **Optional** via pipeline constants
- **Uniforms** provide color, power, multiplier, offset

### 💫 Particle Effects

- **Bubbles**: Particle system emits quads upward with additive blending
- **Light rays**: Animated quads with sine-based alpha
- **Lasers**: Additional draw pass when enabled (Large fish only)

### 🥽 VR Support

- **`xr.js`** requests `immersive-vr` session when available
- **Uses** `XRWebGPULayer` & per-view projection matrices
- **Fallback** to mono/multi-view on desktop

## ⚡ Performance Optimizations

### GPU-Side Optimizations

- **Instanced Rendering**: 1000+ fish with single draw call
- **Texture Atlasing**: Multiple textures in one atlas
- **Mipmapping**: Better texture sampling performance
- **Early-Z**: Depth test before expensive fragment shader

### CPU-Side Optimizations

- **Asset Caching**: Load once, reuse everywhere
- **Typed Arrays**: Direct buffer mapping to GPU
- **Frustum Culling**: Skip invisible objects
- **Object Pooling**: Reuse allocations to minimize GC

### Memory Optimizations

- **Shared Buffers**: Uniform data shared across objects
- **Texture Compression**: Future enhancement opportunity
- **LOD System**: Future enhancement for distance-based detail

### Instance Batching

WebGPU's lower-level control allows for better batching than WebGL version:

```javascript
// Single draw call for 1000+ fish
renderPass.drawIndexed(indexCount, instanceCount, 0, 0, 0);
```

## 🔧 UI & Controls

### Modern Web Components

- **`ui.js`** reproduces control panel using modern web components (no jQuery dependency)
- **Sliders** map to config entries and trigger uniform refresh
- **View presets** stored in `config.js` and applied via UI buttons
- **Stereo demo** toggle via `config.js` flag; enables side-by-side mode

### Configuration System

```javascript
// config.js - Centralized state management
export const config = {
  fishCount: 1000,
  fogEnabled: true,
  tankMode: "aquarium", // or 'museum'
  // ... other settings
};
```

## 📦 Asset Management

### Asset Duplication Strategy

- Asset JSON files and textures copied into `webgpu/aquarium/assets/` & `webgpu/aquarium/static_assets/`
- Uses helper script (`webgpu/tools/clone-assets.mjs`)
- Respects "no shared files" requirement between WebGL and WebGPU versions
- Build script re-run when assets update

### Asset Format

```javascript
// Example asset structure
{
  "positions": [...],    // Float32Array vertex positions
  "normals": [...],      // Float32Array vertex normals
  "texCoords": [...],    // Float32Array UV coordinates
  "indices": [...],      // Uint16Array triangle indices
  "diffuseTexture": "path/to/texture.jpg",
  "normalTexture": "path/to/normal.png"
}
```

## 🛠️ Development Workflow

### Pure ES Modules

- **No bundler required** - uses native ES modules
- **`index.html`** loads modules with `<script type="module">`
- **Import maps** for clean module resolution

### Development Server

- **Static server** supporting `application/wasm` & `application/octet-stream`
- **HTTPS required** for WebGPU (or localhost for development)
- **Example**: `http-server webgpu/aquarium --cors`

### Testing & Validation

- **Browser DevTools** - Console logging for debugging shader compilation
- **Performance metrics** - Built-in FPS counter and frame timing
- **Error handling** - WebGPU error capture and reporting

## 🔍 Debugging & Monitoring

### Error Handling

```javascript
// WebGPU error capture
device.addEventListener("uncapturederror", (event) => {
  console.error("WebGPU error:", event.error);
});
```

### Performance Monitoring

- **FPS counter** with frame time statistics
- **GPU memory usage** tracking
- **Draw call counting** for optimization
- **Pipeline compilation time** measurement

---

**Architecture Version**: 2.0 (WebGPU Portable)
**Last Updated**: January 2025

For implementation details, see individual module documentation in the `core/` and `aquarium/` directories.
