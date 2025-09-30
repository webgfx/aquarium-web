import { PipelineBuilder } from "./base-pipeline.js";
import { loadShaderModule } from "../shader-loader.js";

export async function createOuterPipeline(device, {
  frameLayout,
  modelLayout,
  materialLayout,
}, colorFormat, vertexBuffers, baseUrl) {
  const pipelineBuilder = new PipelineBuilder(device);
  const shaderModule = await loadShaderModule(device, "shaders/outer.wgsl", "outer-tank", baseUrl);

  const layout = device.createPipelineLayout({
    bindGroupLayouts: [frameLayout, modelLayout, materialLayout],
  });

  return pipelineBuilder.createPipeline({
    label: "outer-tank-pipeline",
    layout,
    vertexModule: shaderModule,
    fragmentModule: shaderModule,
    vertexBuffers,
    vertexEntryPoint: "vs_main",
    fragmentEntryPoint: "fs_main",
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
    targets: [
      {
        format: colorFormat,
        blend: {
          color: {
            srcFactor: "src-alpha",
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
}
