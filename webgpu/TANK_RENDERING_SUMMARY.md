# Tank Refraction Rendering Implementation Summary

## Overview
Successfully ported the tank refraction/reflection rendering system from WebGL to WebGPU. This includes the inner tank (GlobeInner) with refraction effects and the outer tank (GlobeOuter) with reflection effects.

## Components Implemented

### 1. WGSL Shaders

#### `aquarium/shaders/inner.wgsl`
- **Purpose**: Inner tank shell with refraction effects
- **Features**:
  - Normal mapping with tangent-space transformation
  - Skybox cube texture sampling for refracted environment
  - Refraction calculation using configurable eta (refractive index)
  - Reflection map for masking refraction areas
  - Tank color fudge for brightening adjustments
  - Fog integration
- **Uniforms**:
  - `refractionFudge`: Adjusts normal perturbation (default: 3)
  - `eta`: Refractive index (default: 1)
  - `tankColorFudge`: Brightens diffuse color (default: 0.8)
  - `useNormalMap`: Enables/disables normal mapping
  - `useReflectionMap`: Enables/disables reflection masking

#### `aquarium/shaders/outer.wgsl`
- **Purpose**: Outer tank shell with reflection effects
- **Features**:
  - Normal mapping support
  - Skybox reflection sampling
  - View-dependent alpha for transparency falloff
  - Reflection map modulation
  - Blending between skybox and diffuse based on viewing angle
- **Uniforms**:
  - `useNormalMap`: Enables/disables normal mapping
  - `useReflectionMap`: Enables/disables reflection weighting
  - `outerFudge`: Reflection intensity adjustment (default: 0.2)

### 2. Pipeline Modules

#### `core/pipelines/inner.js`
```javascript
export async function createInnerPipeline(device, layouts, format, vertexBuffers)
```
- Opaque rendering (no alpha blending)
- Standard depth testing
- Uses tank material layout with 6 bindings:
  - Diffuse texture
  - Normal texture
  - Reflection mask texture
  - Skybox cube texture
  - Linear sampler
  - Tank uniform buffer

#### `core/pipelines/outer.js`
```javascript
export async function createOuterPipeline(device, layouts, format, vertexBuffers)
```
- Alpha blending enabled: `srcAlpha`, `oneMinusSrcAlpha`, `add`
- Depth write enabled for proper sorting
- Same material layout as inner pipeline
- Creates semi-transparent shell around aquarium

### 3. Texture System Updates

#### `core/texture-cache.js`
Added cube texture loading capability:
```javascript
async loadCubeTexture(urls, options = {})
```
- Loads 6 cube map faces (+X, -X, +Y, -Y, +Z, -Z)
- Creates cube texture with dimension `[width, height, 6]`
- Uses `cubeSampler` with clamp-to-edge addressing
- Returns record with `dimension: 'cube'` metadata

**Skybox URLs** (loaded in renderer):
- `assets/GlobeOuter_EM_positive_x.jpg`
- `assets/GlobeOuter_EM_negative_x.jpg`
- `assets/GlobeOuter_EM_positive_y.jpg`
- `assets/GlobeOuter_EM_negative_y.jpg`
- `assets/GlobeOuter_EM_positive_z.jpg`
- `assets/GlobeOuter_EM_negative_z.jpg`

### 4. Renderer Integration

#### Material Management
New method: `async getTankMaterial(textureNames, tankType)`
- Creates bind groups with all 6 tank bindings
- Loads diffuse, normal, and reflection textures
- Shares skybox cube texture across all tank materials
- Maintains per-material uniform buffers for dynamic updates
- Caches materials by key: `tank:{type}:{diffuse}:{normal}:{reflection}`

#### Uniform Updates
Tank material uniforms updated every frame in `updateFishResources()`:
- `refractionFudge` from `state.innerConst.refractionFudge`
- `eta` from `state.innerConst.eta`
- `tankColorFudge` from `state.innerConst.tankColorFudge`
- `useNormalMap` from `state.options.normalMaps`
- `useReflectionMap` from `state.options.reflection`

#### Rendering Order
1. Diffuse items (opaque environment)
2. Fish (instanced, alpha blended)
3. Seaweed (alpha blended, vertex animated)
4. **Inner tank** (opaque refraction) ← NEW
5. **Outer tank** (transparent reflection) ← NEW

Controlled by `state.options.tank` flag.

### 5. Scene Registry

Updated `core/scene-registry.js`:
```javascript
{ name: "GlobeInner", program: "inner" },
{ name: "GlobeOuter", program: "outer", blend: true },
```

### 6. UI Configuration

#### `aquarium/config.js`
Added `defaultInnerConst`:
```javascript
export const defaultInnerConst = {
  refractionFudge: 3,
  eta: 1,
  tankColorFudge: 0.8,
};
```

#### `aquarium/ui.js`
Added sliders for tank parameters:
- **Refraction Fudge**: 0-50, step 0.001
- **Eta**: 0-1.2, step 0.0001
- **Tank Color Fudge**: 0-2, step 0.0001

All view presets include tank parameters.

## Technical Details

### Refraction Physics
The inner shader uses WGSL's `refract()` function:
```wgsl
let eta = max(tankUniforms.params0.w, 0.0001);
var refractionDir = refract(surfaceToView, normal, eta);
```
- `eta` = ratio of refractive indices (typically 1.0 for air-to-water simulation)
- Falls back to reflection if total internal reflection occurs

### Normal Mapping
Both shaders support tangent-space normal mapping:
```wgsl
let tangentToWorld = mat3x3<f32>(tangent, binormal, normal);
var tangentNormal = normalSample.xyz - vec3<f32>(0.5, 0.5, 0.5);
tangentNormal = normalize(tangentNormal + vec3<f32>(0.0, 0.0, refractionFudge));
normal = normalize(tangentToWorld * tangentNormal);
```
The `refractionFudge` biases the normal toward the geometric normal to adjust refraction intensity.

### Skybox Sampling
Cube texture sampled with direction vectors:
```wgsl
let skySample = textureSample(skyboxTexture, linearSampler, refractionDir);
```
- Inner: samples refracted view direction
- Outer: samples reflected view direction

### Blending Strategy
**Inner**: Opaque, mixes skybox with diffuse using reflection mask
```wgsl
let mixedColor = mix(skyContribution, diffuseColor.rgb, refractionMask);
```

**Outer**: Transparent, computes view-dependent alpha
```wgsl
let alpha = clamp(1.0 - viewDot, 0.0, 1.0);
```
Edges become more transparent when viewed head-on (Fresnel-like effect).

## Asset Requirements

### GlobeInner Model
- **Diffuse**: `GlobeInner_DM.png`
- **Normal**: `GlobeInner_NM.png`
- **Reflection**: `GlobeInner_RM.jpg`

### GlobeOuter Model
- **Diffuse**: `GlobeOuter_DM.png`
- **Normal**: `GlobeOuter_NM.png`
- **Reflection**: `GlobeOuter_RM.jpg`

### Skybox
Six cube faces for environment mapping (shared):
- `GlobeOuter_EM_positive_x.jpg`
- `GlobeOuter_EM_negative_x.jpg`
- `GlobeOuter_EM_positive_y.jpg`
- `GlobeOuter_EM_negative_y.jpg`
- `GlobeOuter_EM_positive_z.jpg`
- `GlobeOuter_EM_negative_z.jpg`

All assets already present in `webgpu/aquarium/assets/`.

## Performance Considerations

1. **Cube Texture Loading**: Loads 6 images in parallel using `Promise.all`
2. **Material Caching**: Prevents duplicate bind group creation
3. **Uniform Updates**: Only updates tank uniforms when values change (done every frame for responsiveness)
4. **Depth Testing**: Maintains correct ordering without extra sorting passes

## Testing & Validation

### Rendering Checks
- [x] Inner tank renders after seaweed
- [x] Outer tank renders last (over inner)
- [x] Skybox cube texture loads correctly
- [x] Normal maps apply when option enabled
- [x] Reflection maps modulate correctly
- [x] UI sliders control tank parameters
- [x] Tank toggles on/off via options panel

### Visual Quality
- Refraction distorts background through inner shell
- Reflection shows environment on outer shell
- Transparency gradient on outer shell (view-dependent)
- Normal mapping adds surface detail
- Fog applies correctly to tank

## Future Enhancements

1. **Mipmap Generation**: Add mipmap support for cube textures
2. **Dynamic Skybox**: Allow runtime skybox switching
3. **Chromatic Aberration**: Add color separation for realistic refraction
4. **Caustics**: Project refracted light patterns onto floor
5. **Performance Profiling**: Measure GPU timings for tank passes

## Related Files

### Core Systems
- `core/renderer.js` - Main rendering loop and material management
- `core/texture-cache.js` - Texture loading and caching
- `core/pipelines/inner.js` - Inner tank pipeline
- `core/pipelines/outer.js` - Outer tank pipeline
- `core/scene-registry.js` - Scene definitions

### Shaders
- `aquarium/shaders/inner.wgsl` - Inner tank shader
- `aquarium/shaders/outer.wgsl` - Outer tank shader

### Configuration
- `aquarium/config.js` - Default constants and presets
- `aquarium/ui.js` - UI controls and state management
- `aquarium/main.js` - Application bootstrap

### Assets
- `aquarium/assets/GlobeInner.js` - Inner tank geometry
- `aquarium/assets/GlobeOuter.js` - Outer tank geometry
- `aquarium/assets/GlobeInner_*.{png,jpg}` - Inner textures
- `aquarium/assets/GlobeOuter_*.{png,jpg}` - Outer textures and skybox

## Conclusion

The tank refraction system is fully functional and matches the WebGL reference implementation. All visual effects (refraction, reflection, normal mapping, transparency) work correctly. The system integrates cleanly with the existing renderer architecture and provides full user control through the UI.

**Status**: ✅ Complete
