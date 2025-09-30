struct FrameUniforms {
  viewProjection: mat4x4<f32>,
  viewInverse: mat4x4<f32>,
  lightWorldPos: vec4<f32>,
  lightColor: vec4<f32>,
  ambient: vec4<f32>,
  fogColor: vec4<f32>,
  fogParams: vec4<f32>,
}

struct FishInstance {
  worldPosition: vec3<f32>,
  scale: f32,
  nextPosition: vec3<f32>,
  time: f32,
}

struct SpeciesUniforms {
  fishLength: f32,
  fishWaveLength: f32,
  fishBendAmount: f32,
  useNormalMap: f32,
  useReflectionMap: f32,
  shininess: f32,
  specularFactor: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> frameUniforms: FrameUniforms;
@group(1) @binding(0) var<storage, read> fishInstances: array<FishInstance>;
@group(1) @binding(1) var<uniform> speciesUniforms: SpeciesUniforms;
@group(2) @binding(0) var diffuseTexture: texture_2d<f32>;
@group(2) @binding(1) var normalTexture: texture_2d<f32>;
@group(2) @binding(2) var reflectionTexture: texture_2d<f32>;
@group(2) @binding(3) var linearSampler: sampler;

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
  @location(2) surfaceToLight: vec3<f32>,
  @location(3) surfaceToView: vec3<f32>,
  @location(4) tangent: vec3<f32>,
  @location(5) binormal: vec3<f32>,
  @location(6) clipPosition: vec4<f32>,
}

fn safeForward(forward: vec3<f32>) -> vec3<f32> {
  let lenSq = dot(forward, forward);
  if (lenSq < 1e-6) {
    return vec3<f32>(0.0, 0.0, 1.0);
  }
  return forward / sqrt(lenSq);
}

fn computeBasis(forward: vec3<f32>) -> mat3x3<f32> {
  var up = vec3<f32>(0.0, 1.0, 0.0);
  var right = cross(up, forward);
  var rightLenSq = dot(right, right);
  if (rightLenSq < 1e-6) {
    up = vec3<f32>(0.0, 0.0, 1.0);
    right = cross(up, forward);
    rightLenSq = dot(right, right);
    if (rightLenSq < 1e-6) {
      right = vec3<f32>(1.0, 0.0, 0.0);
    }
  }
  right = normalize(right);
  let realUp = normalize(cross(forward, right));
  return mat3x3<f32>(right, realUp, forward);
}

@vertex
fn vs_main(input: VertexInput, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
  let instance = fishInstances[instanceIndex];

  var forward = safeForward(instance.worldPosition - instance.nextPosition);
  let basis = computeBasis(forward);
  let right = basis[0];
  let trueUp = basis[1];

  let worldMatrix = mat4x4<f32>(
    vec4<f32>(right * instance.scale, 0.0),
    vec4<f32>(trueUp * instance.scale, 0.0),
    vec4<f32>(forward * instance.scale, 0.0),
    vec4<f32>(instance.worldPosition, 1.0)
  );

  var mult = input.position.z / max(speciesUniforms.fishLength, 0.0001);
  if (input.position.z <= 0.0) {
    mult = (-input.position.z / max(speciesUniforms.fishLength, 0.0001)) * 2.0;
  }

  let s = sin(instance.time + mult * speciesUniforms.fishWaveLength);
  let offset = (mult * mult) * s * speciesUniforms.fishBendAmount;
  let bentPosition = vec4<f32>(input.position + vec3<f32>(offset, 0.0, 0.0), 1.0);

  let worldPosition = worldMatrix * bentPosition;
  let normalMatrix = basis;

  var output: VertexOutput;
  output.position = frameUniforms.viewProjection * worldPosition;
  output.clipPosition = output.position;
  output.texCoord = input.texCoord;
  output.normal = normalize(normalMatrix * input.normal);
  output.tangent = normalize(normalMatrix * input.tangent);
  output.binormal = normalize(normalMatrix * input.binormal);
  output.surfaceToLight = frameUniforms.lightWorldPos.xyz - worldPosition.xyz;
  output.surfaceToView = frameUniforms.viewInverse[3].xyz - worldPosition.xyz;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let diffuseSample = textureSample(diffuseTexture, linearSampler, input.texCoord);
  let normalSample = textureSample(normalTexture, linearSampler, input.texCoord);

  var normal = normalize(input.normal);
  var specStrength = 0.0;
  if (speciesUniforms.useNormalMap > 0.5) {
    let tangent = normalize(input.tangent);
    let binormal = normalize(input.binormal);
    let tangentToWorld = mat3x3<f32>(tangent, binormal, normal);
    var tangentNormal = normalSample.xyz * 2.0 - vec3<f32>(1.0, 1.0, 1.0);
    tangentNormal = normalize(tangentNormal + vec3<f32>(0.0, 0.0, 2.0));
    normal = normalize(tangentToWorld * tangentNormal);
    specStrength = normalSample.a;
  }

  let surfaceToLight = normalize(input.surfaceToLight);
  let surfaceToView = normalize(input.surfaceToView);
  let halfVector = normalize(surfaceToLight + surfaceToView);

  let diffuseFactor = max(dot(normal, surfaceToLight), 0.0);
  let specularTerm = select(0.0, pow(max(dot(normal, halfVector), 0.0), speciesUniforms.shininess), diffuseFactor > 0.0);

  let lightColor = frameUniforms.lightColor.rgb;
  let ambientColor = frameUniforms.ambient.rgb;

  var color = diffuseSample.rgb * ambientColor;
  color += diffuseSample.rgb * lightColor * diffuseFactor;
  color += lightColor * specularTerm * speciesUniforms.specularFactor * specStrength;

  if (speciesUniforms.useReflectionMap > 0.5) {
    let reflectionSample = textureSample(reflectionTexture, linearSampler, input.texCoord);
    let mixFactor = clamp(1.0 - reflectionSample.r, 0.0, 1.0);
    color = mix(reflectionSample.rgb, color, mixFactor);
  }

  if (frameUniforms.fogParams.w > 0.5) {
    let fogCoord = input.clipPosition.z / input.clipPosition.w;
    let fogFactor = clamp(pow(fogCoord, frameUniforms.fogParams.x) * frameUniforms.fogParams.y - frameUniforms.fogParams.z, 0.0, 1.0);
    color = mix(color, frameUniforms.fogColor.rgb, fogFactor);
  }

  return vec4<f32>(color, diffuseSample.a);
}
