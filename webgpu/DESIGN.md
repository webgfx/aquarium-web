# Aquarium WebGPU Port Architecture

## Goals
- Re-create the existing WebGL aquarium experience on top of the WebGPU API.
- Preserve feature parity: animated fish schools, lasers, bubbles, light rays, tank/museum toggles, fog controls, slider-driven camera presets, and VR/multiview hooks.
- Keep WebGPU code self-contained under `webgpu/` without importing WebGL-era helpers.

## High-Level Layout
```
webgpu/
  aquarium/
    index.html             # Entry point & UI shell
    config.js              # Configuration shared across modules
    main.js                # Bootstraps app, handles render loop
    ui.js                  # Slider + options wiring
    assets/
      ...                  # JSON model data & textures (duplicated from WebGL tree)
    shaders/
      *.wgsl               # WGSL programs for each material
  core/
    gpu-context.js         # WebGPU adapter/device/canvas helper
    loader.js              # Fetch JSON assets + build typed arrays
    texture-cache.js       # Image bitmap -> GPUTexture caching
    scene-registry.js      # Defines scene groups analogous to WebGL version
    bindings.js            # Bind group layouts and bind group builders
    pipelines/
      base-pipeline.js     # Shared pipeline factory utilities
      diffuse.js           # Diffuse shaded models
      normal-map.js        # Normal-mapped models
      reflection.js        # Reflection-mapped models
      fish.js              # Animated fish vertex logic
      laser.js             # Laser billboard pipeline
      light-ray.js         # Light ray billboard pipeline
      particles.js         # Bubble particle system
    math.js                # Minimal matrix/vector utilities (gl-matrix subset)
    animation/fish-school.js   # Fish position/tail animation logic
    animation/light-rays.js    # Wiggling light rays
    animation/bubbles.js       # Bubble triggers and emitters
    xr.js                  # WebXR integration (optional, progressive enhancement)
```

## Render Loop Contract
- `main.js` orchestrates initialization:
  1. Acquire WebGPU device/swap chain via `gpu-context.js`.
  2. Load all JSON model assets and textures through `loader.js` & `texture-cache.js`.
  3. Build pipeline instances per shading type using `pipelines/*` helpers.
  4. Instantiate animation managers (fish schools, bubbles, light rays).
  5. Register UI callbacks (`ui.js`) to mutate shared state (`config.js`).
  6. Enter RAF loop (or XR frame loop) which calls `renderFrame(delta)`.

- `renderFrame` steps:
  1. Update animations (fish positions, bubble emitters, light ray offsets) with elapsed time and UI-configured multipliers.
  2. Recompute uniform buffers for view/projection and material constants.
  3. Encode commands: one render pass drawing opaque groups first, then transparent effects (lasers, light rays, bubbles) with proper blend state.
  4. Submit command buffer and resolve metrics (FPS overlay).

## Resource Handling
- Each model asset produces:
  - Vertex buffers per attribute (`position`, `normal`, `tangent`, `binormal`, `texCoord`).
  - Index buffer (`Uint16Array` or `Uint32Array`).
  - Bind group referencing textures (diffuse/normal/reflection/skybox) & shared sampler.
- Uniform buffers:
  - `FrameUniforms` (viewProjection, viewInverse, light data, fog constants).
  - `ModelUniforms` (world matrices + per-model scalars).
  - `FishInstanceUniforms` structured for N fish instances each frame.
- Dynamic uniforms implemented via `GPUBuffer` with `MAP_WRITE | COPY_DST` update per frame (triple buffered to avoid stalls).

## Shaders (WGSL)
- Diffuse/normal-map/reflection pipelines translate GLSL logic into WGSL, preserving fog math via togglable constants.
- Fish vertex shader reconstructs orientation from current and next position, applies bend animation identical to WebGL `fishVertexShader` (converted to vector math in WGSL).
- Fragment shaders sample textures, compute lighting, apply fog when enabled.
- Billboard-based effects (laser, light ray, bubbles) use instanced quads with per-instance uniforms to avoid per-draw CPU work.

## Feature Coverage
- **Fish animation**: CPU updates positions & uniforms, GPU handles vertex skinning per instance.
- **Tank & museum**: Render groups toggled via UI; pipelines simply skip groups when disabled.
- **Normal maps / reflections**: Controlled via boolean uniforms & pipeline specialization constants.
- **Fog**: Optional via pipeline constants; uniforms provide color, power, mult, offset.
- **Bubbles**: Particle system emits quads upward with additive blending.
- **Light rays**: Animated quads with sine-based alpha similar to WebGL.
- **Lasers**: Additional draw pass when enabled (Large fish only).
- **VR**: `xr.js` requests `immersive-vr` session when available, uses `XRWebGPULayer` & per-view projection matrices; falls back to mono/multi-view on desktop.
- **Performance**: Instance batching reduces draw calls relative to WebGL version.

## UI & Controls
- `ui.js` reproduces control panel using modern web components (no jQuery dependency). Sliders map to config entries and trigger uniform refresh.
- View presets stored in `config.js` and applied via UI buttons.
- Stereo demo toggle implemented via `config.js` flag; when active, renderer enters side-by-side mode.

## Asset Duplication
- Asset JSON files and textures are copied into `webgpu/aquarium/assets/` & `webgpu/aquarium/static_assets/` using a helper script (`webgpu/tools/clone-assets.mjs`) to respect the "no shared files" requirement.
- Build script re-run when assets update.

## Build & Dev Workflow
- Pure ES modules (no bundler). `index.html` loads modules with `<script type="module">`.
- When testing locally, use static server supporting `application/wasm` & `application/octet-stream` for binary textures.
- `README.md` documents launch steps (`npm install -g http-server; http-server webgpu/aquarium`).

## Open Items
- Shader translation validation vs WebGL outputs.
- Ensure VR fallback gracefully disabled on unsupported browsers.
- Investigate performance tuning (bind group reuse, instancing limits).
