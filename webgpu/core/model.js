const ATTRIBUTE_SLOTS = {
  position: 0,
  normal: 1,
  texCoord: 2,
  tangent: 3,
  binormal: 4,
};

export class AquariumModel {
  constructor(device, modelData) {
    this.device = device;
  this.fields = modelData.fields;
  this.textureNames = { ...modelData.textures };
  this.vertexBuffers = new Map();
  this.vertexBufferLayouts = [];
  this.sortedVertexBuffers = [];
    this.indexBuffer = null;
    this.indexCount = 0;
    this.indexFormat = "uint16";
    this.boundingBox = modelData.boundingBox ?? null;

    this.createVertexBuffers();
    this.createIndexBuffer();
  }

  createVertexBuffers() {
    Object.entries(this.fields).forEach(([name, field]) => {
      if (name === "indices") return;
      const { data, numComponents, type } = field;
      const typedArray = data;
      const stride = typedArray.BYTES_PER_ELEMENT * numComponents;
      // WebGPU requires buffer size to be multiple of 4 when mappedAtCreation is true
      const alignedSize = Math.ceil(typedArray.byteLength / 4) * 4;
      const buffer = this.device.createBuffer({
        size: alignedSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new typedArray.constructor(buffer.getMappedRange()).set(typedArray);
      buffer.unmap();
      const slot = ATTRIBUTE_SLOTS[name] ?? ATTRIBUTE_SLOTS.position;
      this.vertexBuffers.set(name, { buffer, stride, numComponents, format: vertexFormat(type, numComponents), slot });
    });

    this.sortedVertexBuffers = Array.from(this.vertexBuffers.values()).sort((a, b) => a.slot - b.slot);

    this.vertexBufferLayouts = this.sortedVertexBuffers.map((entry) => ({
      arrayStride: entry.stride,
      attributes: [
        {
          shaderLocation: entry.slot,
          offset: 0,
          format: entry.format,
        },
      ],
      stepMode: "vertex",
    }));
  }

  createIndexBuffer() {
    if (!this.fields.indices) {
      this.indexCount = (this.fields.position?.data.length ?? 0) / (this.fields.position?.numComponents ?? 3);
      this.indexBuffer = null;
      return;
    }
    const { data, type } = this.fields.indices;
    const typedArray = data;
    // WebGPU requires buffer size to be multiple of 4 when mappedAtCreation is true
    const alignedSize = Math.ceil(typedArray.byteLength / 4) * 4;
    const buffer = this.device.createBuffer({
      size: alignedSize,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new typedArray.constructor(buffer.getMappedRange()).set(typedArray);
    buffer.unmap();
    this.indexBuffer = buffer;
    this.indexCount = typedArray.length;
    this.indexFormat = type === "Uint32Array" ? "uint32" : "uint16";
  }

  getVertexBufferLayouts() {
    return this.vertexBufferLayouts;
  }

  bind(passEncoder) {
    this.sortedVertexBuffers.forEach((bufferInfo) => {
      passEncoder.setVertexBuffer(bufferInfo.slot, bufferInfo.buffer);
    });

    if (this.indexBuffer) {
      passEncoder.setIndexBuffer(this.indexBuffer, this.indexFormat);
    }
  }
}

function vertexFormat(type, numComponents) {
  switch (type) {
    case "Float32Array":
      switch (numComponents) {
        case 2:
          return "float32x2";
        case 3:
          return "float32x3";
        case 4:
          return "float32x4";
        default:
          throw new Error(`Unsupported float component count: ${numComponents}`);
      }
    default:
      throw new Error(`Unsupported vertex attribute type: ${type}`);
  }
}
