export async function tryStartXR({
  sessionMode = "immersive-vr",
  requiredFeatures = ["local-floor"],
  optionalFeatures = ["bounded-floor", "hand-tracking", "layers"],
  device,
}) {
  if (!navigator.xr) {
    return null;
  }
  try {
    const isSupported = await navigator.xr.isSessionSupported(sessionMode);
    if (!isSupported) {
      return null;
    }
    const session = await navigator.xr.requestSession(sessionMode, {
      requiredFeatures,
      optionalFeatures,
    });

    if (!device) {
      throw new Error("XR session requested without a WebGPU device");
    }

    if (!window.XRWebGPULayer) {
      console.warn(
        "XRWebGPULayer not available; falling back to WebGL-based layer",
      );
      await session.end();
      return null;
    }

    const layer = new XRWebGPULayer(session, device);
    session.updateRenderState({ baseLayer: layer });
    return { session, layer };
  } catch (err) {
    console.warn("Unable to start XR session", err);
    return null;
  }
}
