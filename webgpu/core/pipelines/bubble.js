/**
 * Bubble Particle Pipeline
 * Renders billboarded particles with additive blending
 */

import { loadShaderModule } from '../shader-loader.js';

let cachedPipeline = null;
let cachedBindGroupLayout0 = null;
let cachedBindGroupLayout1 = null;

export async function createBubblePipeline(device, format, baseUrl) {
  if (cachedPipeline) {
    return {
      pipeline: cachedPipeline,
      bindGroupLayout0: cachedBindGroupLayout0,
      bindGroupLayout1: cachedBindGroupLayout1,
    };
  }

  const shaderModule = await loadShaderModule(device, 'shaders/bubble.wgsl', 'bubble-shader', baseUrl);

  // Bind group 0: Frame uniforms (viewProjection, viewInverse, time)
  cachedBindGroupLayout0 = device.createBindGroupLayout({
    label: 'Bubble Frame Bind Group Layout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      },
    ],
  });

  // Bind group 1: Particle texture and sampler
  cachedBindGroupLayout1 = device.createBindGroupLayout({
    label: 'Bubble Material Bind Group Layout',
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
    label: 'Bubble Pipeline Layout',
    bindGroupLayouts: [cachedBindGroupLayout0, cachedBindGroupLayout1],
  });

  cachedPipeline = device.createRenderPipeline({
    label: 'Bubble Particle Pipeline',
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          // Buffer 0: Corner vertices (shared quad)
          arrayStride: 2 * 4, // vec2<f32>
          stepMode: 'vertex',
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2',
            },
          ],
        },
        {
          // Buffer 1: Particle data (instanced)
          arrayStride: 20 * 4, // 5 vec4s = 80 bytes
          stepMode: 'instance',
          attributes: [
            {
              // positionStartTime
              shaderLocation: 1,
              offset: 0,
              format: 'float32x4',
            },
            {
              // velocityStartSize
              shaderLocation: 2,
              offset: 16,
              format: 'float32x4',
            },
            {
              // accelerationEndSize
              shaderLocation: 3,
              offset: 32,
              format: 'float32x4',
            },
            {
              // colorMult
              shaderLocation: 4,
              offset: 48,
              format: 'float32x4',
            },
            {
              // lifetimeFrameSpinStart
              shaderLocation: 5,
              offset: 64,
              format: 'float32x4',
            },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          format: format,
          blend: {
            // Additive blending for particles
            color: {
              srcFactor: 'src-alpha',
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
      cullMode: 'none', // Billboards visible from both sides
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: false, // Particles don't write depth
      depthCompare: 'less',
    },
  });

  return {
    pipeline: cachedPipeline,
    bindGroupLayout0: cachedBindGroupLayout0,
    bindGroupLayout1: cachedBindGroupLayout1,
  };
}
