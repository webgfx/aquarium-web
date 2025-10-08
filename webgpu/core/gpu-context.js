const PRESENTATION_FORMAT =
  navigator.gpu?.getPreferredCanvasFormat?.() ?? "bgra8unorm";

export async function createContext(canvas, options = {}) {
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: options.powerPreference ?? "high-performance",
  });
  if (!adapter) {
    throw new Error("No WebGPU adapter available");
  }

  const device = await adapter.requestDevice({
    requiredFeatures: options.requiredFeatures ?? [],
    requiredLimits: options.requiredLimits,
  });

  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to acquire WebGPU canvas context");
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
  canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);

  context.configure({
    device,
    format: PRESENTATION_FORMAT,
    alphaMode: "premultiplied",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
  });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      context.configure({
        device,
        format: PRESENTATION_FORMAT,
        alphaMode: "premultiplied",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
      });
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  return {
    adapter,
    device,
    queue: device.queue,
    format: PRESENTATION_FORMAT,
    context,
    canvas,
    resize,
    destroy() {
      resizeObserver.disconnect();
      device.destroy();
    },
  };
}
