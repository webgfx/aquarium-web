/**
 * Laser Beam Pipeline
 * Renders laser beams with additive blending
 */

import { loadShaderModule } from "../shader-loader.js";

let cachedPipeline = null;
let cachedMaterialLayout = null;

export async function createLaserPipeline(device, format, baseUrl, layouts) {
  if (cachedPipeline) {
    return {
      pipeline: cachedPipeline,
      materialBindGroupLayout: cachedMaterialLayout,
    };
  }

  const shaderModule = await loadShaderModule(
    device,
    "shaders/laser.wgsl",
    "laser-shader",
    baseUrl
  );

  // Material layout: texture, sampler, color multiplier
  cachedMaterialLayout = device.createBindGroupLayout({
    label: "Laser Material Bind Group Layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    label: "Laser Pipeline Layout",
    bindGroupLayouts: [
      layouts.frameLayout,
      layouts.modelLayout,
      cachedMaterialLayout,
    ],
  });

  // Vertex buffer layout for simple quad
  const vertexBufferLayout = {
    arrayStride: 16, // 4 floats: position(2) + texcoord(2)
    attributes: [
      {
        // position
        shaderLocation: 0,
        offset: 0,
        format: "float32x2",
      },
      {
        // texcoord
        shaderLocation: 1,
        offset: 8,
        format: "float32x2",
      },
    ],
  };

  cachedPipeline = device.createRenderPipeline({
    label: "Laser Pipeline",
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: format,
          blend: {
            // Additive blending for laser glow
            color: {
              srcFactor: "one",
              dstFactor: "one",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "none", // Visible from both sides
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: false, // Don't write to depth buffer
      depthCompare: "less",
    },
  });

  return {
    pipeline: cachedPipeline,
    materialBindGroupLayout: cachedMaterialLayout,
  };
}
