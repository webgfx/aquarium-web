/**
 * Laser Beam Pipeline
 * Renders laser beams with additive blending
 */

import { loadShaderModule } from '../shader-loader.js';

let cachedPipeline = null;
let cachedMaterialLayout = null;

export async function createLaserPipeline(device, layouts, format, vertexBufferLayouts, baseUrl) {
  if (cachedPipeline) {
    return { pipeline: cachedPipeline, materialLayout: cachedMaterialLayout };
  }

  const shaderModule = await loadShaderModule(device, 'shaders/laser.wgsl', 'laser-shader', baseUrl);

  // Material layout: texture, sampler, uniform
  cachedMaterialLayout = device.createBindGroupLayout({
    label: 'Laser Material Bind Group Layout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    label: 'Laser Pipeline Layout',
    bindGroupLayouts: [
      layouts.frameLayout,
      layouts.modelLayout,
      cachedMaterialLayout,
    ],
  });

  cachedPipeline = device.createRenderPipeline({
    label: 'Laser Pipeline',
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: vertexBufferLayouts,
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          format: format,
          blend: {
            // Additive blending for laser glow
            color: {
              srcFactor: 'one',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one',
              operation: 'add',
            },
          },
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'none', // Visible from both sides
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: false, // Don't write to depth buffer
      depthCompare: 'less',
    },
  });

  return { pipeline: cachedPipeline, materialLayout: cachedMaterialLayout };
}
