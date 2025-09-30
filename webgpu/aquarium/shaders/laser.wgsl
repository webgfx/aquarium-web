// Laser Beam Shader for WebGPU Aquarium
// Simple textured beam with color modulation

struct FrameUniforms {
  viewProjection: mat4x4<f32>,
};

struct ModelUniforms {
  world: mat4x4<f32>,
};

struct MaterialUniforms {
  colorMult: vec4<f32>,
};

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

@group(0) @binding(0) var<uniform> frameUniforms: FrameUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var beamTexture: texture_2d<f32>;
@group(2) @binding(1) var beamSampler: sampler;
@group(2) @binding(2) var<uniform> materialUniforms: MaterialUniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  let worldPosition = modelUniforms.world * vec4<f32>(input.position, 1.0);
  output.position = frameUniforms.viewProjection * worldPosition;
  output.texCoord = input.texCoord;
  
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let texColor = textureSample(beamTexture, beamSampler, input.texCoord);
  return texColor * materialUniforms.colorMult;
}
