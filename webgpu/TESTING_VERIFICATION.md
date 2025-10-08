# 🧪 WebGPU Aquarium - Testing & Verification Guide

Complete guide for testing the WebGPU aquarium implementation, from quick verification to comprehensive testing procedures.

## 🚀 Quick Start - 30 Second Verification

### Method 1: Automated Test Suite (RECOMMENDED)

**Get instant pass/fail status in under 30 seconds:**

1. **Start the development server**:

   ```powershell
   cd webgpu
   npm run serve
   ```

2. **Open the automated test page**:

   - Navigate to: **http://127.0.0.1:8080/test-tank.html**

3. **Watch tests run automatically**:

   - Tests run in ~10 seconds
   - Visual feedback shows pass/fail status
   - Check console (F12) for detailed logs

4. **Expected result**:

   ```
   🎉 ALL TESTS PASSED!
   10/10 tests passed
   ```

   **Validates**: WebGPU support, context creation, asset loading, renderer initialization, tank pipelines, skybox texture, tank materials, and rendering capability.

---

### Method 2: Visual Quick Check

1. **Open main application**: http://127.0.0.1:8080/
2. **5-second checklist**:
   - [ ] Scene renders (no black screen)
   - [ ] Fish are swimming
   - [ ] **Tank is visible** (glass sphere around scene)
   - [ ] FPS counter shows in top-left (typically 30-60)
   - [ ] No console errors (F12 → Console tab)

**Success = All boxes checked ✅**

---

### Method 3: Console Quick Check

**Paste into browser console (F12) for instant status:**

```javascript
// Quick Tank Rendering Verification
console.log("🔍 Tank Rendering Status Check\n");
console.log("WebGPU:", !!navigator.gpu ? "✅" : "❌");
console.log("Renderer:", typeof renderer !== "undefined" ? "✅" : "❌");

if (typeof renderer !== "undefined") {
  console.log("Inner Pipeline:", renderer.innerPipeline ? "✅" : "❌");
  console.log("Outer Pipeline:", renderer.outerPipeline ? "✅" : "❌");
  console.log("Skybox Texture:", renderer.skyboxTexture ? "✅" : "❌");
  console.log("Inner Items:", renderer.innerItems?.length || 0);
  console.log("Outer Items:", renderer.outerItems?.length || 0);
  console.log("Tank Materials:", renderer.tankMaterials?.size || 0);
  console.log(
    "Tank Enabled:",
    renderer.currentState?.options?.tank ? "✅" : "❌"
  );

  const allGood =
    renderer.innerPipeline &&
    renderer.outerPipeline &&
    renderer.skyboxTexture &&
    renderer.innerItems.length > 0 &&
    renderer.outerItems.length > 0;

  console.log("\n" + (allGood ? "🎉 ALL SYSTEMS GO!" : "⚠️ ISSUES DETECTED"));
} else {
  console.log("⚠️ Renderer not initialized yet");
}
```

**Expected output**: All ✅ marks with "🎉 ALL SYSTEMS GO!"

---

## 🔧 Setup & Requirements

### Browser Requirements

**Supported Browsers:**

- **Chrome/Edge 113+** (WebGPU enabled by default)
- **Chrome Canary** (latest features)
- **Firefox Nightly** (experimental support)

**Check WebGPU Support:**

- Navigate to `chrome://gpu`
- Look for "WebGPU: Hardware accelerated"
- If missing, enable: `chrome://flags/#enable-unsafe-webgpu`

### Development Server Setup

```powershell
# Method 1: Using npm (if package.json exists)
cd webgpu
npm install
npm run serve

# Method 2: Using http-server globally
npm install -g http-server
cd webgpu
http-server . -p 8080 --cors

# Method 3: Using Python
cd webgpu
python -m http.server 8080
```

**Server should start at**: http://127.0.0.1:8080

---

## 📋 Comprehensive Testing Procedures

### Core Feature Verification

#### ✅ **Basic Rendering**

- [ ] Application loads without console errors
- [ ] Canvas renders the aquarium scene
- [ ] FPS counter shows in top-left corner
- [ ] Canvas resolution displays correctly
- [ ] No black screen or WebGPU errors

#### ✅ **Environment Objects**

- [ ] Floor tiles visible and textured
- [ ] Rocks, coral, ruins render properly
- [ ] Sunken ship and submarine visible
- [ ] Arch structures present and detailed
- [ ] Skybox/environment visible in background

#### ✅ **Fish Animation**

- [ ] Fish swim smoothly with natural movement
- [ ] Tails wave naturally with swimming motion
- [ ] Different species visible (small, medium, big fish)
- [ ] Fish count can be changed (1, 100, 500, etc.)
- [ ] Fish respect collision with environment
- [ ] Schooling behavior works (fish group together)

#### ✅ **Seaweed Animation**

- [ ] Seaweed plants wave gently in current
- [ ] Multiple seaweed types visible
- [ ] Animation is smooth and natural
- [ ] Seaweed doesn't clip through other objects

#### ✅ **Tank Rendering (Core Feature)**

- [ ] Inner tank shell visible (refractive glass effect)
- [ ] Outer tank shell visible (reflective, semi-transparent)
- [ ] Skybox environment visible in reflections
- [ ] Tank can be toggled on/off via UI
- [ ] Tank appears in all camera view presets

#### ✅ **Visual Effects**

- [ ] Fog fades distant objects appropriately
- [ ] Normal maps add surface detail (when enabled)
- [ ] Reflection maps work on fish (when enabled)
- [ ] Lighting and shadows render correctly

#### ✅ **UI Controls**

- [ ] All sliders respond and update visuals
- [ ] Toggle buttons work (Tank, Museum, Fog, Normal Maps, Reflection)
- [ ] Fish count presets work (1, 100, 1000, etc.)
- [ ] View preset button cycles through camera positions
- [ ] Settings persist during session

---

## 🎯 Detailed Tank Testing

### **Test 1: Tank Visibility & Toggling**

**Procedure:**

1. Ensure "Tank" option is **enabled** (checkbox checked)
2. Observe tank shells:
   - **Inner shell**: Slightly distorted view through refractive glass
   - **Outer shell**: Transparent with reflections, especially at edges
3. **Toggle tank off** → both shells disappear
4. **Toggle tank on** → both shells reappear
5. Verify tank appears correctly in all view presets

**Expected Result**: Tank creates visible "glass sphere" effect around scene, toggles cleanly on/off.

### **Test 2: Refraction Effects (Inner Tank)**

**Procedure:**

1. Enable "Tank" option
2. Look through inner tank at objects behind it
3. Observe subtle distortion of background objects
4. Adjust controls:
   - **Refraction Fudge** (0-50): Increase → more distortion
   - **Eta** (0-1.2): Adjust refractive index (try 0.8-1.0)
   - **Tank Color Fudge** (0-2): Adjust brightness

**Expected Result**: Objects behind inner tank appear slightly bent/shifted. Effect is subtle but noticeable.

### **Test 3: Reflection Effects (Outer Tank)**

**Procedure:**

1. Enable "Tank" option
2. Rotate camera around outer tank
3. Observe Fresnel effect:
   - **Grazing angles**: More reflective (shows skybox clearly)
   - **Head-on view**: More transparent (see through to inside)
4. Verify skybox/environment visible in reflections

**Expected Result**: Outer tank shows angle-dependent transparency with skybox reflections.

### **Test 4: Normal Mapping Integration**

**Procedure:**

1. Enable "Tank" + "Normal Maps" options
2. Observe tank surface detail:
   - Surface should show subtle bumps/imperfections
   - Detail changes as camera rotates
   - Refraction/reflection follows perturbed surface normals
3. Toggle Normal Maps on/off to compare

**Expected Result**: Tank surface shows enhanced detail when normal mapping enabled.

### **Test 5: Reflection Map Modulation**

**Procedure:**

1. Enable "Tank" + "Reflection" options
2. Observe non-uniform refraction effects:
   - Some areas show more skybox reflection
   - Other areas show more diffuse color
   - Pattern matches reflection texture map

**Expected Result**: Reflection map creates varied refraction/reflection intensity across tank surface.

### **Test 6: Fog Integration**

**Procedure:**

1. Enable "Tank" + "Fog" options
2. Adjust camera distance (zoom out)
3. Observe fog behavior:
   - **Inner tank**: Fades with fog (has fog calculations)
   - **Outer tank**: Does NOT fog (renders last, no fog in shader)

**Expected Result**: Inner tank respects fog settings, outer tank remains clear at all distances.

---

## ⚡ Performance Testing

### **Frame Rate Benchmarks**

**Test different fish counts and measure FPS:**

| Fish Count | Target FPS | Performance Level |
| ---------- | ---------- | ----------------- |
| 100        | 60         | Smooth            |
| 500        | 60         | Smooth            |
| 1000       | 50-60      | Playable          |
| 5000       | 30-50      | GPU Dependent     |
| 10000      | 20-40      | High-end GPU      |
| 30000+     | 10-30      | Stress Test       |

**Tank Performance Impact:**

- Expected FPS drop with tank enabled: ~1-5 FPS
- Two additional draw calls (inner + outer tank)

**Procedure:**

1. Monitor FPS counter in top-left
2. Test each fish count level
3. Enable/disable tank and note FPS difference
4. Record results for your hardware

### **Memory Usage Testing**

**Procedure:**

1. Open browser DevTools (F12) → Performance/Memory tab
2. Monitor GPU memory usage over time
3. Test with different settings:
   - Various fish counts
   - Tank enabled/disabled
   - Normal maps enabled/disabled
4. Verify no memory leaks (usage should stabilize)

**Expected Memory**: 100-300 MB GPU memory (depends on fish count), stable usage pattern.

---

## 🎨 Visual Quality Validation

### **Perfect Tank Rendering Checklist:**

Visual inspection for production quality:

- [ ] **No Z-fighting**: Tank doesn't flicker with scene geometry
- [ ] **Proper transparency**: Can see through outer tank clearly
- [ ] **Refraction visible**: Inner tank distorts background objects appropriately
- [ ] **Reflection visible**: Outer tank shows skybox reflections
- [ ] **Smooth geometry**: No jagged edges on tank sphere
- [ ] **Correct depth ordering**:
  - Scene objects render first
  - Inner tank renders over scene
  - Outer tank renders last (over inner tank)
  - Fish appear inside tank boundaries
- [ ] **No rendering artifacts**: No black spots, texture errors, or missing faces
- [ ] **Smooth animation**: Camera rotation doesn't cause stuttering

### **Cross-Browser Testing**

**Test matrix:**

```
Chrome 113+    [✅ Primary target]
Edge 113+      [✅ Primary target]
Chrome Canary  [✅ Latest features]
Firefox Nightly[⚠️ Experimental]
```

**Procedure for each browser:**

1. Run automated test suite
2. Verify visual quality matches
3. Check for browser-specific issues
4. Record performance differences

---

## 🛠️ Automated Testing Scripts

### **Console Test Suite**

**Paste into browser console for comprehensive checks:**

```javascript
// Comprehensive Tank Rendering Test Suite
async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive Tank Tests...\n");

  const tests = [];

  // Test 1: Environment Check
  console.log("✅ Test 1: Environment Setup");
  tests.push({
    name: "WebGPU Support",
    result: !!navigator.gpu,
  });
  tests.push({
    name: "Canvas Present",
    result: document.querySelector("canvas") !== null,
  });

  // Test 2: Renderer Status
  console.log("✅ Test 2: Renderer Status");
  const hasRenderer = typeof renderer !== "undefined";
  tests.push({ name: "Renderer Initialized", result: hasRenderer });

  if (hasRenderer) {
    tests.push({ name: "Inner Pipeline", result: !!renderer.innerPipeline });
    tests.push({ name: "Outer Pipeline", result: !!renderer.outerPipeline });
    tests.push({ name: "Skybox Texture", result: !!renderer.skyboxTexture });
    tests.push({
      name: "Tank Items",
      result:
        renderer.innerItems?.length > 0 && renderer.outerItems?.length > 0,
    });
    tests.push({
      name: "Tank Materials",
      result: renderer.tankMaterials?.size > 0,
    });
  }

  // Test 3: UI Integration
  console.log("✅ Test 3: UI Integration");
  const uiContainer = document.querySelector(
    ".control-panel, #ui, .aquarium-ui"
  );
  tests.push({ name: "UI Container", result: !!uiContainer });
  tests.push({
    name: "Tank Toggle",
    result: document.querySelector('input[type="checkbox"]') !== null,
  });

  // Test 4: Asset Loading
  console.log("✅ Test 4: Asset Verification");
  const assetsLoaded = typeof window.aquariumAssets !== "undefined";
  tests.push({ name: "Assets Loaded", result: assetsLoaded });

  if (assetsLoaded) {
    tests.push({
      name: "Scene Count",
      result: window.aquariumAssets.scenes?.length > 20,
    });
  }

  // Results Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 COMPREHENSIVE TEST RESULTS");
  console.log("=".repeat(50));

  const passed = tests.filter((t) => t.result).length;
  const total = tests.length;

  tests.forEach((test) => {
    const status = test.result ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${test.name}`);
  });

  console.log("=".repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED - READY FOR PRODUCTION!");
  } else {
    console.log("⚠️ SOME TESTS FAILED - CHECK IMPLEMENTATION");
  }

  return { passed, total, tests };
}

// Run the test suite
runComprehensiveTests();
```

### **Performance Benchmark Script**

```javascript
// Performance Benchmark Suite
function runPerformanceBenchmark() {
  console.log("⚡ Performance Benchmark Starting...\n");

  if (typeof renderer === "undefined") {
    console.error("❌ Renderer not available");
    return;
  }

  const originalCount = renderer.currentState?.fishCount;
  const testCounts = [100, 500, 1000, 2000];
  const results = [];

  function measureFPS(duration = 3000) {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();

      function frame() {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(frame);
        } else {
          const fps = frameCount / (duration / 1000);
          resolve(Math.round(fps));
        }
      }
      requestAnimationFrame(frame);
    });
  }

  async function testFishCount(count) {
    console.log(`📊 Testing ${count} fish...`);

    // Set fish count (assuming UI integration)
    if (window.ui && window.ui.setFishCount) {
      window.ui.setFishCount(count);
    }

    // Measure performance
    const fps = await measureFPS(2000);
    results.push({ count, fps });

    console.log(`   Result: ${fps} FPS`);
  }

  // Run tests sequentially
  (async () => {
    for (const count of testCounts) {
      await testFishCount(count);
    }

    // Restore original count
    if (originalCount && window.ui && window.ui.setFishCount) {
      window.ui.setFishCount(originalCount);
    }

    // Report results
    console.log("\n" + "=".repeat(40));
    console.log("📊 PERFORMANCE BENCHMARK RESULTS");
    console.log("=".repeat(40));
    results.forEach((r) => {
      const rating = r.fps >= 50 ? "🟢" : r.fps >= 30 ? "🟡" : "🔴";
      console.log(`${rating} ${r.count} fish: ${r.fps} FPS`);
    });
    console.log("=".repeat(40));
  })();
}

// Run performance benchmark
runPerformanceBenchmark();
```

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### **Issue: Tank not visible**

**Symptoms**: Can't see inner or outer tank shells

**Solutions**:

1. ✅ Check "Tank" option is enabled in UI
2. ✅ Verify in console: `renderer.currentState.options.tank === true`
3. ✅ Check console for texture loading errors
4. ✅ Verify GlobeInner.js and GlobeOuter.js exist in `webgpu/aquarium/assets/`
5. ✅ Try different camera angles (click "Toggle View")

#### **Issue: Black/missing textures**

**Symptoms**: Tank appears black or has missing faces

**Solutions**:

1. ✅ Check browser Network tab (F12) for 404 texture errors
2. ✅ Verify required texture files exist in `webgpu/aquarium/assets/`:
   - `GlobeInner_DM.png`, `GlobeInner_NM.png`, `GlobeInner_RM.jpg`
   - `GlobeOuter_DM.png`, `GlobeOuter_NM.png`, `GlobeOuter_RM.jpg`
   - `GlobeOuter_EM_positive_x/y/z.jpg`
   - `GlobeOuter_EM_negative_x/y/z.jpg`
3. ✅ Try hard refresh (Ctrl+F5) to clear cache
4. ✅ Check server CORS settings (`--cors` flag with http-server)

#### **Issue: Console errors about cube texture**

**Symptoms**: "Failed to load skybox" or cube texture errors

**Solutions**:

1. ✅ Ensure all 6 skybox faces exist and have same dimensions
2. ✅ Verify CORS is enabled on development server
3. ✅ Check file permissions (should be readable)
4. ✅ Try loading textures individually to isolate problem

#### **Issue: No refraction visible**

**Symptoms**: Inner tank looks like plain textured sphere

**Solutions**:

1. ✅ Enable "Normal Maps" option in UI
2. ✅ Increase "Refraction Fudge" slider (try 10-20)
3. ✅ Adjust "Eta" slider to ~0.8-1.0 range
4. ✅ Verify skybox loaded successfully (check console)
5. ✅ Ensure viewing angle isn't too perpendicular

#### **Issue: WebGPU not supported**

**Symptoms**: "WebGPU is not supported" error message

**Solutions**:

1. ✅ Update Chrome/Edge to version 113 or higher
2. ✅ Enable WebGPU: Visit `chrome://flags/#enable-unsafe-webgpu`
3. ✅ Update GPU drivers to latest version
4. ✅ Try Chrome Canary for cutting-edge support
5. ✅ Check GPU compatibility: Visit `chrome://gpu`

#### **Issue: Poor performance**

**Symptoms**: Low FPS, stuttering, or slow response

**Solutions**:

1. ✅ Reduce fish count to 100-500
2. ✅ Disable Normal Maps and Reflection temporarily
3. ✅ Check if GPU hardware acceleration is enabled
4. ✅ Close other browser tabs using GPU
5. ✅ Monitor GPU usage in Task Manager

---

## 🎯 Success Criteria

### ✅ **Production Ready Checklist**

Your implementation is ready for production when:

1. ✅ **Automated test suite** shows "10/10 tests passed"
2. ✅ **Visual verification** shows proper tank refraction and reflection
3. ✅ **Console quick check** returns all ✅ status markers
4. ✅ **Performance benchmarks** meet target FPS for expected fish counts
5. ✅ **Cross-browser testing** passes on Chrome 113+ and Edge 113+
6. ✅ **Visual quality check** shows no artifacts or rendering issues
7. ✅ **UI integration** allows tank toggling and parameter adjustment
8. ✅ **Error handling** shows no console errors during normal operation

---

## 📈 Performance Targets

### Minimum Acceptable Performance

| Test Scenario      | Target FPS | Status      |
| ------------------ | ---------- | ----------- |
| 100 fish + tank    | 45+        | Required    |
| 500 fish + tank    | 30+        | Required    |
| 1000 fish + tank   | 25+        | Recommended |
| Tank toggle        | <100ms     | Required    |
| View preset change | <200ms     | Required    |

### Memory Usage Limits

- **GPU Memory**: <500MB for 1000 fish + tank
- **System Memory**: <200MB for application
- **Memory Growth**: <10MB/hour (no leaks)

---

## 📖 Expected Visual Result

When working correctly, the aquarium should show:

```
┌──────────────────────────────────────────────┐
│             WEBGPU AQUARIUM VIEW             │
│                                              │
│    ╔══════════════════════════════════╗     │
│    ║     Outer Tank (reflective)      ║     │
│    ║  ┌────────────────────────────┐  ║     │
│    ║  │   Inner Tank (refractive)  │  ║     │
│    ║  │     🐟 🐠 🐡 🦈 🐟         │  ║     │
│    ║  │     🌿🪨🏛️⚓🌿         │  ║     │
│    ║  │  ≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋   │  ║     │
│    ║  └────────────────────────────┘  ║     │
│    ╚══════════════════════════════════╝     │
│                                              │
│  [✅ Fish swimming naturally]                │
│  [✅ Seaweed waving in current]             │
│  [✅ Tank refracting/reflecting correctly]   │
│  [✅ Smooth 30-60 FPS performance]          │
└──────────────────────────────────────────────┘
```

---

## 🚀 Next Steps After Successful Testing

Once all tests pass successfully:

1. **📸 Document Success**: Take screenshots of working application
2. **🌐 Cross-Platform Testing**: Test on different operating systems
3. **📊 Performance Profiling**: Detailed GPU performance analysis
4. **🎮 Extended Features**: Consider implementing:
   - Bubble particle system
   - Laser effects for large fish
   - Light ray effects
   - WebXR/VR support
5. **📚 User Documentation**: Create end-user guides
6. **🚀 Deployment**: Deploy to production environment

---

**Quick Navigation:**

- 🧪 **Automated Test**: http://127.0.0.1:8080/test-tank.html
- 🎨 **Main Application**: http://127.0.0.1:8080/
- 📐 **Technical Details**: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- 🌐 **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Status**: ✅ Ready for comprehensive testing
**Last Updated**: January 2025
**Test Coverage**: Complete verification and performance validation
