import { PipelineBuilder } from "./base-pipeline.js";
import { loadShaderModule } from "../shader-loader.js";

export async function createDiffusePipeline(
  device,
  { frameLayout, modelLayout, materialLayout },
  colorFormat,
  vertexBuffers,
  baseUrl,
) {
  const pipelineBuilder = new PipelineBuilder(device);

  const vertexModule = await loadShaderModule(
    device,
    "shaders/diffuse.wgsl",
    "diffuse-vertex",
    baseUrl,
  );
  const fragmentModule = vertexModule;

  const layout = device.createPipelineLayout({
    bindGroupLayouts: [frameLayout, modelLayout, materialLayout],
  });

  const pipeline = pipelineBuilder.createPipeline({
    label: "diffuse-pipeline",
    layout,
    vertexModule,
    fragmentModule,
    vertexBuffers,
    vertexEntryPoint: "vs_main",
    fragmentEntryPoint: "fs_main",
    primitive: { topology: "triangle-list", cullMode: "back" },
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
