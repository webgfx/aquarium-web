import { PipelineBuilder } from "./base-pipeline.js";
import { loadShaderModule } from "../shader-loader.js";

export async function createSeaweedPipeline(device, {
  frameLayout,
  modelLayout,
  materialLayout,
}, colorFormat, vertexBuffers, baseUrl) {
  const pipelineBuilder = new PipelineBuilder(device);

  const shaderModule = await loadShaderModule(device, "shaders/seaweed.wgsl", "seaweed", baseUrl);

  const layout = device.createPipelineLayout({
    bindGroupLayouts: [frameLayout, modelLayout, materialLayout],
  });

  const pipeline = pipelineBuilder.createPipeline({
    label: "seaweed-pipeline",
    layout,
    vertexModule: shaderModule,
    fragmentModule: shaderModule,
    vertexBuffers,
    vertexEntryPoint: "vs_main",
    fragmentEntryPoint: "fs_main",
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: false,
      depthCompare: "less",
    },
    targets: [
      {
        format: colorFormat,
        blend: {
          color: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        },
      },
    ],
  });

  return pipeline;
}
