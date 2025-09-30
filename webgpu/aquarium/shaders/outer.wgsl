struct FrameUniforms {
  viewProjection: mat4x4<f32>,
  viewInverse: mat4x4<f32>,
  lightWorldPos: vec4<f32>,
  lightColor: vec4<f32>,
  ambient: vec4<f32>,
  fogColor: vec4<f32>,
  fogParams: vec4<f32>,
}

struct ModelUniforms {
  world: mat4x4<f32>,
  worldInverse: mat4x4<f32>,
  worldInverseTranspose: mat4x4<f32>,
  extra: vec4<f32>,
}

struct TankMaterialUniforms {
  specular: vec4<f32>,
  params0: vec4<f32>, // x: shininess, y: specularFactor, z: refractionFudge (unused), w: eta (unused)
  params1: vec4<f32>, // x: tankColorFudge (unused), y: useNormalMap, z: useReflectionMap, w: outerFudge
}

@group(0) @binding(0) var<uniform> frameUniforms: FrameUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var diffuseTexture: texture_2d<f32>;
@group(2) @binding(1) var normalTexture: texture_2d<f32>;
@group(2) @binding(2) var reflectionTexture: texture_2d<f32>;
@group(2) @binding(3) var skyboxTexture: texture_cube<f32>;
@group(2) @binding(4) var linearSampler: sampler;
@group(2) @binding(5) var<uniform> tankUniforms: TankMaterialUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) texCoord: vec2<f32>,
  @location(3) tangent: vec3<f32>,
  @location(4) binormal: vec3<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) tangent: vec3<f32>,
  @location(3) binormal: vec3<f32>,
  @location(4) surfaceToView: vec3<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  let worldPosition = modelUniforms.world * vec4<f32>(input.position, 1.0);
  var output: VertexOutput;
  output.position = frameUniforms.viewProjection * worldPosition;
  output.texCoord = input.texCoord;
  output.normal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.normal, 0.0)).xyz;
  output.tangent = (modelUniforms.worldInverseTranspose * vec4<f32>(input.tangent, 0.0)).xyz;
  output.binormal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.binormal, 0.0)).xyz;
  output.surfaceToView = frameUniforms.viewInverse[3].xyz - worldPosition.xyz;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let diffuseColor = textureSample(diffuseTexture, linearSampler, input.texCoord);

  var normal = normalize(input.normal);
  if (tankUniforms.params1.y > 0.5) {
    let tangent = normalize(input.tangent);
    let binormal = normalize(input.binormal);
    let tangentToWorld = mat3x3<f32>(tangent, binormal, normal);
    let normalSample = textureSample(normalTexture, linearSampler, input.texCoord);
    var tangentNormal = normalSample.xyz - vec3<f32>(0.5, 0.5, 0.5);
    normal = normalize(tangentToWorld * tangentNormal);
  }

  let surfaceToView = normalize(input.surfaceToView);
  let reflectionDir = normalize(-reflect(surfaceToView, normal));
  var skyColor = textureSample(skyboxTexture, linearSampler, reflectionDir);

  let fudgeAmount = tankUniforms.params1.w;
  let fudge = skyColor.rgb * fudgeAmount;
  let bright = min(1.0, fudge.r * fudge.g * fudge.b);

  var reflectionAmount = 0.0;
  if (tankUniforms.params1.z > 0.5) {
    reflectionAmount = textureSample(reflectionTexture, linearSampler, input.texCoord).r;
  }
  reflectionAmount = clamp(reflectionAmount, 0.0, 1.0);

  let reflectColor = mix(vec4<f32>(skyColor.rgb, bright), diffuseColor, 1.0 - reflectionAmount);
  let viewDot = clamp(abs(dot(surfaceToView, normal)), 0.0, 1.0);
  var reflectMix = clamp((viewDot + 0.3) * reflectionAmount, 0.0, 1.0);
  if (tankUniforms.params1.z <= 0.5) {
    reflectMix = 1.0;
  }

  let finalColor = mix(skyColor.rgb, reflectColor.rgb, reflectMix);
  let alpha = clamp(1.0 - viewDot, 0.0, 1.0);
  return vec4<f32>(finalColor, alpha);
}
