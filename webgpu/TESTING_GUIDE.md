# Testing Guide - WebGPU Aquarium

## Quick Start

### 1. **Start the Development Server**

```powershell
cd webgpu
npm run serve
```

The server will start at: **http://127.0.0.1:8080**

### 2. **Open in WebGPU-Enabled Browser**

**Recommended Browsers:**
- **Chrome/Edge 113+** (WebGPU enabled by default)
- **Chrome Canary** (latest features)

**Check WebGPU Support:**
- Navigate to `chrome://gpu` and look for "WebGPU: Hardware accelerated"

### 3. **Verify Core Features**

Open the application and verify:

#### ✅ **Basic Rendering**
- [ ] Application loads without console errors
- [ ] Canvas renders the aquarium scene
- [ ] FPS counter shows in top-left
- [ ] Canvas resolution displays

#### ✅ **Environment**
- [ ] Floor tiles visible
- [ ] Rocks, coral, ruins render
- [ ] Sunken ship and submarine visible
- [ ] Arch structures present

#### ✅ **Fish Animation**
- [ ] Fish swim smoothly
- [ ] Tails wave naturally
- [ ] Different species visible (small, medium, big fish)
- [ ] Fish count can be changed (1, 100, 500, etc.)

#### ✅ **Seaweed**
- [ ] Seaweed plants wave gently
- [ ] Multiple seaweed types visible
- [ ] Animation is smooth and natural

#### ✅ **Tank Rendering (NEW!)**
- [ ] Inner tank shell visible (refractive glass)
- [ ] Outer tank shell visible (reflective, semi-transparent)
- [ ] Skybox environment visible in reflections
- [ ] Tank can be toggled on/off in options

#### ✅ **Effects**
- [ ] Fog fades distant objects
- [ ] Normal maps add surface detail (when enabled)
- [ ] Reflection maps on fish (when enabled)

#### ✅ **UI Controls**
- [ ] All sliders respond
- [ ] Toggle buttons work (Tank, Museum, Fog, Normal Maps, Reflection)
- [ ] Fish count presets work
- [ ] View preset button cycles views

---

## Detailed Tank Testing

### **Test 1: Tank Visibility**

1. Ensure "Tank" option is **enabled** (checkbox checked)
2. Look for:
   - **Inner shell**: Slightly distorted view through glass
   - **Outer shell**: Transparent with reflections on edges
3. Verify tank appears in all view presets

**Expected Result:** Tank should be visible and create a "glass sphere" effect around the scene.

### **Test 2: Refraction Effects (Inner Tank)**

1. Enable "Tank" option
2. Look through the inner tank at objects behind it
3. Observe distortion:
   - Objects should appear slightly bent/shifted
   - Effect is subtle but noticeable

**Controls to adjust:**
- **Refraction Fudge** (0-50): Higher values = more distortion
- **Eta** (0-1.2): Refractive index, typically 1.0 for water
- **Tank Color Fudge** (0-2): Brightens the tank

### **Test 3: Reflection Effects (Outer Tank)**

1. Enable "Tank" option
2. Look at the outer tank from different angles
3. Observe:
   - Edges show skybox reflection
   - Center becomes more transparent when viewed head-on (Fresnel effect)
   - Environment is visible in reflections

**Expected Result:** Outer tank should be semi-transparent with visible reflections, especially at grazing angles.

### **Test 4: Normal Mapping**

1. Enable "Tank" option
2. Enable "Normal Maps" option
3. Observe tank surface:
   - Should show surface imperfections
   - Detail changes as you rotate view
   - Refraction/reflection follows perturbed normals

**Expected Result:** Tank surface should have subtle bumps and imperfections.

### **Test 5: Reflection Maps**

1. Enable "Tank" option
2. Enable "Reflection" option
3. Observe:
   - Reflection map modulates refraction on inner tank
   - Certain areas show more skybox, others show more diffuse color

**Expected Result:** Non-uniform refraction/reflection based on texture map.

### **Test 6: Fog Integration**

1. Enable "Tank" option
2. Enable "Fog" option
3. Zoom out or adjust eye radius
4. Observe:
   - Inner tank fades with fog (has fog calculations)
   - Outer tank does NOT fog (renders last, no fog in shader)

**Expected Result:** Inner tank respects fog, outer tank remains clear.

### **Test 7: Toggle Tank On/Off**

1. Uncheck "Tank" option
2. Verify:
   - Both inner and outer tank disappear
   - Scene still renders normally
   - No errors in console

**Expected Result:** Tank should completely hide when disabled.

### **Test 8: View Presets**

1. Click "Toggle View" button repeatedly
2. Cycle through all presets:
   - Inside (A)
   - Outside (A)
   - Inside (Original)
   - Outside (Original)
   - Center (LG)
   - Outside (LG)
3. Verify tank renders correctly in all views

**Expected Result:** Tank should be visible and properly positioned in all presets.

---

## Performance Testing

### **Test 9: Frame Rate**

1. Monitor FPS counter (top-left)
2. Test with different fish counts:
   - 100 fish: Should be smooth (60 FPS)
   - 1000 fish: Should be playable (30-60 FPS)
   - 10000+ fish: Depends on GPU
3. Enable/disable tank:
   - Note any FPS impact (should be minimal)

**Expected FPS Impact of Tank:** ~1-5 FPS drop (2 extra draw calls)

### **Test 10: Memory Usage**

1. Open browser DevTools (F12)
2. Go to Performance/Memory tab
3. Monitor GPU memory usage
4. Verify no memory leaks over time

**Expected Memory:** Stable, no increasing trend

---

## Visual Quality Checks

### **Checklist for Perfect Tank Rendering:**

- [ ] **No Z-fighting**: Tank doesn't flicker with scene geometry
- [ ] **Proper transparency**: Can see through outer tank clearly
- [ ] **Refraction visible**: Inner tank distorts background objects
- [ ] **Reflection visible**: Outer tank shows skybox reflections
- [ ] **Smooth edges**: No jagged edges on tank sphere
- [ ] **Correct depth ordering**: 
  - Inner tank in front of seaweed
  - Outer tank in front of inner tank
  - Fish render inside tank
- [ ] **No artifacts**: No black spots, texture errors, or missing faces
- [ ] **Smooth animation**: Camera rotation doesn't cause stuttering

---

## Automated Console Tests

### **Run in Browser DevTools Console:**

```javascript
// Test 1: Check WebGPU support
console.log('WebGPU supported:', !!navigator.gpu);

// Test 2: Check scene loaded
console.log('Scenes loaded:', window.aquariumAssets?.scenes?.length || 0);

// Test 3: Check tank items
console.log('Inner items:', window.renderer?.innerItems?.length || 0);
console.log('Outer items:', window.renderer?.outerItems?.length || 0);

// Test 4: Check skybox loaded
console.log('Skybox texture:', !!window.renderer?.skyboxTexture);

// Test 5: Check tank pipelines
console.log('Inner pipeline:', !!window.renderer?.innerPipeline);
console.log('Outer pipeline:', !!window.renderer?.outerPipeline);

// Test 6: Check tank materials
console.log('Tank materials cached:', window.renderer?.tankMaterials?.size || 0);

// Test 7: List all errors
console.log('Check for red error messages above');
```

**Expected Output:**
```
WebGPU supported: true
Scenes loaded: 28
Inner items: 1
Outer items: 1
Skybox texture: true
Inner pipeline: true
Outer pipeline: true
Tank materials cached: 2
Check for red error messages above
```

---

## Common Issues & Solutions

### **Issue 1: Tank not visible**

**Symptoms:** Can't see inner or outer tank shells

**Solutions:**
1. Check "Tank" option is enabled in UI
2. Verify in console: `window.renderer.currentState.options.tank === true`
3. Check console for texture loading errors
4. Verify GlobeInner.js and GlobeOuter.js exist in assets/

### **Issue 2: Black/missing textures**

**Symptoms:** Tank appears black or has missing faces

**Solutions:**
1. Check console for 404 errors on texture files
2. Verify these files exist in `webgpu/aquarium/assets/`:
   - GlobeInner_DM.png
   - GlobeInner_NM.png
   - GlobeInner_RM.jpg
   - GlobeOuter_DM.png
   - GlobeOuter_NM.png
   - GlobeOuter_RM.jpg
   - GlobeOuter_EM_positive_x.jpg
   - GlobeOuter_EM_negative_x.jpg
   - GlobeOuter_EM_positive_y.jpg
   - GlobeOuter_EM_negative_y.jpg
   - GlobeOuter_EM_positive_z.jpg
   - GlobeOuter_EM_negative_z.jpg

### **Issue 3: Console errors about cube texture**

**Symptoms:** Error loading skybox or cube texture

**Solutions:**
1. Ensure all 6 skybox faces exist
2. Check they have same dimensions
3. Verify CORS is enabled on server
4. Try hard refresh (Ctrl+F5)

### **Issue 4: No refraction visible**

**Symptoms:** Inner tank looks like plain textured sphere

**Solutions:**
1. Enable "Normal Maps" option
2. Increase "Refraction Fudge" slider (try 10-20)
3. Adjust "Eta" slider (try 0.8-1.0)
4. Verify skybox loaded (check console)

### **Issue 5: Outer tank too opaque**

**Symptoms:** Can't see through outer tank

**Solutions:**
1. Check alpha blending is working
2. View from different angle (should be more transparent head-on)
3. This is expected behavior (Fresnel effect)

### **Issue 6: WebGPU not supported**

**Symptoms:** Error message "WebGPU is not supported"

**Solutions:**
1. Update Chrome/Edge to version 113+
2. Enable WebGPU flag: `chrome://flags/#enable-unsafe-webgpu`
3. Check GPU drivers are up to date
4. Try Chrome Canary

---

## Regression Testing

### **Before/After Comparison with WebGL Version**

To verify visual parity:

1. Open WebGL version: `webgl/aquarium/aquarium.html`
2. Open WebGPU version: `webgpu/aquarium/index.html`
3. Set same parameters in both (fish count, view preset, options)
4. Compare visually:
   - Tank refraction should look similar
   - Tank reflection should look similar
   - Overall scene should match

**Note:** Perfect pixel-for-pixel match is not expected due to:
- Different precision in calculations
- Different texture filtering
- Different blending modes
- But visual effect should be very close

---

## Performance Benchmarks

### **Target Performance Metrics:**

| Fish Count | Expected FPS | Notes |
|------------|--------------|-------|
| 100 | 60 | Smooth |
| 500 | 60 | Smooth |
| 1000 | 50-60 | Playable |
| 5000 | 30-50 | Depends on GPU |
| 10000 | 20-40 | High-end GPU |
| 30000 | 10-30 | Stress test |

**With Tank Enabled:** ~1-5 FPS drop expected

**Memory Usage:** ~100-300 MB GPU memory (depends on fish count)

---

## Automated Test Script

### **Save as `test-tank.html` in webgpu/aquarium/:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tank Rendering Test</title>
    <script type="module">
        import { createContext } from "../core/gpu-context.js";
        import { loadAquariumAssets } from "../core/loader.js";
        import { AquariumRenderer } from "../core/renderer.js";
        import { setupUI } from "./ui.js";
        import { defaultGlobals, defaultFish, defaultInnerConst, optionDefinitions, fishCountPresets, aquariumConfig } from "./config.js";

        async function runTests() {
            const results = [];
            
            console.log("🧪 Starting Tank Rendering Tests...");
            
            // Test 1: WebGPU Support
            console.log("\n✅ Test 1: WebGPU Support");
            const hasWebGPU = !!navigator.gpu;
            results.push({ test: "WebGPU Support", passed: hasWebGPU });
            console.log(hasWebGPU ? "PASS" : "FAIL");
            
            if (!hasWebGPU) {
                console.error("❌ WebGPU not supported. Aborting tests.");
                return;
            }
            
            // Test 2: Initialize Context
            console.log("\n✅ Test 2: Initialize WebGPU Context");
            const canvas = document.createElement("canvas");
            canvas.width = 800;
            canvas.height = 600;
            let context, assets, renderer;
            try {
                context = await createContext(canvas);
                results.push({ test: "Context Creation", passed: true });
                console.log("PASS");
            } catch (err) {
                results.push({ test: "Context Creation", passed: false, error: err.message });
                console.error("FAIL:", err);
                return;
            }
            
            // Test 3: Load Assets
            console.log("\n✅ Test 3: Load Assets");
            try {
                assets = await loadAquariumAssets(aquariumConfig, context.device);
                results.push({ test: "Asset Loading", passed: true });
                console.log("PASS - Loaded", assets.scenes.length, "scenes");
            } catch (err) {
                results.push({ test: "Asset Loading", passed: false, error: err.message });
                console.error("FAIL:", err);
                return;
            }
            
            // Test 4: Create Renderer
            console.log("\n✅ Test 4: Create Renderer");
            try {
                const uiState = setupUI({
                    globals: structuredClone(defaultGlobals),
                    fish: structuredClone(defaultFish),
                    innerConst: structuredClone(defaultInnerConst),
                    options: Object.fromEntries(optionDefinitions.map(opt => [opt.id, opt.defaultValue])),
                    fishCount: 100,
                });
                renderer = new AquariumRenderer({ context, assets, ui: uiState });
                results.push({ test: "Renderer Creation", passed: true });
                console.log("PASS");
            } catch (err) {
                results.push({ test: "Renderer Creation", passed: false, error: err.message });
                console.error("FAIL:", err);
                return;
            }
            
            // Test 5: Initialize Renderer
            console.log("\n✅ Test 5: Initialize Renderer (load textures, create pipelines)");
            try {
                await renderer.initialize();
                results.push({ test: "Renderer Initialization", passed: true });
                console.log("PASS");
            } catch (err) {
                results.push({ test: "Renderer Initialization", passed: false, error: err.message });
                console.error("FAIL:", err);
                return;
            }
            
            // Test 6: Check Tank Pipelines
            console.log("\n✅ Test 6: Tank Pipelines Created");
            const hasInnerPipeline = !!renderer.innerPipeline;
            const hasOuterPipeline = !!renderer.outerPipeline;
            results.push({ test: "Inner Pipeline", passed: hasInnerPipeline });
            results.push({ test: "Outer Pipeline", passed: hasOuterPipeline });
            console.log("Inner Pipeline:", hasInnerPipeline ? "PASS" : "FAIL");
            console.log("Outer Pipeline:", hasOuterPipeline ? "PASS" : "FAIL");
            
            // Test 7: Check Skybox Texture
            console.log("\n✅ Test 7: Skybox Cube Texture Loaded");
            const hasSkybox = !!renderer.skyboxTexture;
            results.push({ test: "Skybox Texture", passed: hasSkybox });
            console.log(hasSkybox ? "PASS" : "FAIL");
            
            // Test 8: Check Tank Items
            console.log("\n✅ Test 8: Tank Items Prepared");
            const hasInnerItems = renderer.innerItems.length > 0;
            const hasOuterItems = renderer.outerItems.length > 0;
            results.push({ test: "Inner Tank Items", passed: hasInnerItems });
            results.push({ test: "Outer Tank Items", passed: hasOuterItems });
            console.log("Inner Items:", renderer.innerItems.length, hasInnerItems ? "PASS" : "FAIL");
            console.log("Outer Items:", renderer.outerItems.length, hasOuterItems ? "PASS" : "FAIL");
            
            // Test 9: Check Tank Materials
            console.log("\n✅ Test 9: Tank Materials Cached");
            const tankMaterialCount = renderer.tankMaterials.size;
            results.push({ test: "Tank Materials", passed: tankMaterialCount > 0 });
            console.log("Materials:", tankMaterialCount, tankMaterialCount > 0 ? "PASS" : "FAIL");
            
            // Test 10: Render One Frame
            console.log("\n✅ Test 10: Render Test Frame");
            try {
                renderer.render(0.016); // 16ms frame
                results.push({ test: "Render Frame", passed: true });
                console.log("PASS");
            } catch (err) {
                results.push({ test: "Render Frame", passed: false, error: err.message });
                console.error("FAIL:", err);
            }
            
            // Summary
            console.log("\n" + "=".repeat(50));
            console.log("📊 TEST SUMMARY");
            console.log("=".repeat(50));
            const passed = results.filter(r => r.passed).length;
            const total = results.length;
            console.log(`Passed: ${passed}/${total}`);
            results.forEach(r => {
                const status = r.passed ? "✅ PASS" : "❌ FAIL";
                console.log(`${status} - ${r.test}${r.error ? ` (${r.error})` : ""}`);
            });
            console.log("=".repeat(50));
            
            if (passed === total) {
                console.log("🎉 ALL TESTS PASSED!");
            } else {
                console.error("⚠️ SOME TESTS FAILED");
            }
        }
        
        runTests().catch(console.error);
    </script>
</head>
<body>
    <h1>Tank Rendering Test</h1>
    <p>Open browser console to see test results.</p>
</body>
</html>
```

### **Run Automated Tests:**

```powershell
# Start server
cd webgpu
npm run serve

# Open in browser
# Navigate to: http://127.0.0.1:8080/test-tank.html
# Check console for test results
```

---

## Success Criteria

### **✅ All Tests Pass When:**

1. ✅ WebGPU is supported
2. ✅ Application loads without errors
3. ✅ Tank is visible when enabled
4. ✅ Refraction effects work on inner tank
5. ✅ Reflection effects work on outer tank
6. ✅ Skybox loads and renders in reflections
7. ✅ Normal maps add surface detail
8. ✅ UI controls update tank parameters
9. ✅ Tank can be toggled on/off
10. ✅ Performance is acceptable (30+ FPS)

---

## Next Steps After Successful Testing

Once all tests pass:

1. **Document any issues found**
2. **Take screenshots for documentation**
3. **Test on multiple GPUs/browsers**
4. **Consider implementing remaining features:**
   - Bubble particles
   - Laser effects
   - Light rays
   - VR support

---

**Last Updated:** September 30, 2025  
**Test Status:** Ready for execution
