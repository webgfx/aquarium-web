/**
 * Light Ray (God Ray) Pipeline
 * Renders volumetric light shafts with alpha blending
 */

import { loadShaderModule } from '../shader-loader.js';

let cachedPipeline = null;
let cachedMaterialLayout = null;

export async function createLightRayPipeline(device, layouts, format, vertexBufferLayouts, baseUrl) {
  if (cachedPipeline) {
    return { pipeline: cachedPipeline, materialLayout: cachedMaterialLayout };
  }

  const shaderModule = await loadShaderModule(device, 'shaders/light_ray.wgsl', 'light-ray-shader', baseUrl);

  // Material layout: texture and sampler only
  cachedMaterialLayout = device.createBindGroupLayout({
    label: 'Light Ray Material Bind Group Layout',
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
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    label: 'Light Ray Pipeline Layout',
    bindGroupLayouts: [
      layouts.frameLayout,
      layouts.modelLayout,
      cachedMaterialLayout,
    ],
  });

  cachedPipeline = device.createRenderPipeline({
    label: 'Light Ray Pipeline',
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
            // Alpha blending for light rays
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
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
