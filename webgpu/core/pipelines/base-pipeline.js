export class PipelineBuilder {
  constructor(device) {
    this.device = device;
  }

  createPipeline({
    label,
    layout,
    vertexModule,
    fragmentModule,
    vertexBuffers,
    vertexEntryPoint = "main",
    fragmentEntryPoint = "main",
    primitive = { topology: "triangle-list", cullMode: "back" },
    depthStencil = {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
    targets,
  }) {
    return this.device.createRenderPipeline({
      label,
      layout,
      vertex: {
        module: vertexModule,
        entryPoint: vertexEntryPoint,
        buffers: vertexBuffers,
      },
      fragment: {
        module: fragmentModule,
        entryPoint: fragmentEntryPoint,
        targets,
      },
      primitive,
      depthStencil,
    });
  }
}
