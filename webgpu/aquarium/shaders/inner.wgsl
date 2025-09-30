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
  params0: vec4<f32>, // x: shininess, y: specularFactor, z: refractionFudge, w: eta
  params1: vec4<f32>, // x: tankColorFudge, y: useNormalMap, z: useReflectionMap, w: outerFudge (unused)
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
  @location(4) surfaceToLight: vec3<f32>,
  @location(5) surfaceToView: vec3<f32>,
  @location(6) clipPosition: vec4<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  let worldPosition = modelUniforms.world * vec4<f32>(input.position, 1.0);
  var output: VertexOutput;
  output.position = frameUniforms.viewProjection * worldPosition;
  output.clipPosition = output.position;
  output.texCoord = input.texCoord;
  output.normal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.normal, 0.0)).xyz;
  output.tangent = (modelUniforms.worldInverseTranspose * vec4<f32>(input.tangent, 0.0)).xyz;
  output.binormal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.binormal, 0.0)).xyz;
  output.surfaceToLight = frameUniforms.lightWorldPos.xyz - worldPosition.xyz;
  output.surfaceToView = frameUniforms.viewInverse[3].xyz - worldPosition.xyz;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  var diffuseColor = textureSample(diffuseTexture, linearSampler, input.texCoord);
  let tankColorFudge = tankUniforms.params1.x;
  diffuseColor = vec4<f32>(diffuseColor.rgb + vec3<f32>(tankColorFudge, tankColorFudge, tankColorFudge), 1.0);

  var normal = normalize(input.normal);
  let useNormalMap = tankUniforms.params1.y;
  if (useNormalMap > 0.5) {
    let tangent = normalize(input.tangent);
    let binormal = normalize(input.binormal);
    let tangentToWorld = mat3x3<f32>(tangent, binormal, normal);
    let normalSample = textureSample(normalTexture, linearSampler, input.texCoord);
    var tangentNormal = normalSample.xyz - vec3<f32>(0.5, 0.5, 0.5);
    tangentNormal = normalize(tangentNormal + vec3<f32>(0.0, 0.0, tankUniforms.params0.z));
    normal = normalize(tangentToWorld * tangentNormal);
  }

  let surfaceToView = normalize(input.surfaceToView);
  let eta = max(tankUniforms.params0.w, 0.0001);
  var refractionDir = refract(surfaceToView, normal, eta);
  if (dot(refractionDir, refractionDir) < 1e-6) {
    refractionDir = -surfaceToView;
  }
  refractionDir = normalize(refractionDir);

  let skySample = textureSample(skyboxTexture, linearSampler, refractionDir);

  var refractionMask = 1.0;
  let useReflectionMap = tankUniforms.params1.z;
  if (useReflectionMap > 0.5) {
    refractionMask = textureSample(reflectionTexture, linearSampler, input.texCoord).r;
  }
  refractionMask = clamp(refractionMask, 0.0, 1.0);

  let skyContribution = skySample.rgb * diffuseColor.rgb;
  let mixedColor = mix(skyContribution, diffuseColor.rgb, refractionMask);
  var outColor = vec4<f32>(mixedColor, diffuseColor.a);

  if (frameUniforms.fogParams.w > 0.5) {
    let fogCoord = input.clipPosition.z / input.clipPosition.w;
    let fogFactor = clamp(pow(fogCoord, frameUniforms.fogParams.x) * frameUniforms.fogParams.y - frameUniforms.fogParams.z, 0.0, 1.0);
    let foggedColor = mix(outColor.rgb, frameUniforms.fogColor.rgb, fogFactor);
    outColor = vec4<f32>(foggedColor, outColor.a);
  }

  return outColor;
}
