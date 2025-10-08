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

struct MaterialUniforms {
  specular: vec4<f32>,
  shininess: f32,
  specularFactor: f32,
  pad0: vec2<f32>,
}

@group(0) @binding(0) var<uniform> frameUniforms: FrameUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var diffuseTexture: texture_2d<f32>;
@group(2) @binding(1) var normalTexture: texture_2d<f32>;
@group(2) @binding(2) var linearSampler: sampler;
@group(2) @binding(3) var<uniform> materialUniforms: MaterialUniforms;

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
  @location(6) worldPosition: vec3<f32>,
  @location(7) clipPosition: vec4<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let worldPosition = modelUniforms.world * vec4<f32>(input.position, 1.0);
  output.position = frameUniforms.viewProjection * worldPosition;
  output.texCoord = input.texCoord;
  output.normal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.normal, 0.0)).xyz;
  output.tangent = (modelUniforms.worldInverseTranspose * vec4<f32>(input.tangent, 0.0)).xyz;
  output.binormal = (modelUniforms.worldInverseTranspose * vec4<f32>(input.binormal, 0.0)).xyz;
  output.surfaceToLight = frameUniforms.lightWorldPos.xyz - worldPosition.xyz;
  output.surfaceToView = frameUniforms.viewInverse[3].xyz - worldPosition.xyz;
  output.worldPosition = worldPosition.xyz;
  output.clipPosition = output.position;
  return output;
}

fn lit(l: f32, h: f32, shininess: f32) -> vec3<f32> {
  let ambient = 1.0;
  let diffuse = max(l, 0.0);
  let specular = select(0.0, pow(max(h, 0.0), shininess), l > 0.0);
  return vec3<f32>(ambient, diffuse, specular);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let diffuseColor = textureSample(diffuseTexture, linearSampler, input.texCoord);

  // Create tangent-to-world matrix
  let tangentToWorld = mat3x3<f32>(
    normalize(input.tangent),
    normalize(input.binormal),
    normalize(input.normal)
  );

  // Sample normal map and convert from [0,1] to [-1,1]
  let normalSpec = textureSample(normalTexture, linearSampler, input.texCoord);
  let tangentNormal = normalSpec.xyz * 2.0 - vec3<f32>(0.5, 0.5, 0.5);

  // Transform normal from tangent space to world space
  let normal = normalize(tangentToWorld * tangentNormal);

  let surfaceToLight = normalize(input.surfaceToLight);
  let surfaceToView = normalize(input.surfaceToView);
  let halfVector = normalize(surfaceToLight + surfaceToView);

  let lighting = lit(dot(normal, surfaceToLight), dot(normal, halfVector), materialUniforms.shininess);
  let lightColor = frameUniforms.lightColor.rgb;
  let ambientColor = frameUniforms.ambient.rgb;

  var color = vec3<f32>(0.0);
  color += lightColor * diffuseColor.rgb * lighting.y;
  color += diffuseColor.rgb * ambientColor;
  color += frameUniforms.lightColor.rgb * materialUniforms.specular.rgb * lighting.z * materialUniforms.specularFactor * normalSpec.a;

  var outColor = vec4<f32>(color, diffuseColor.a);

  if (frameUniforms.fogParams.w > 0.5) {
    let fogCoord = input.clipPosition.z / input.clipPosition.w;
    let fogFactor = clamp(pow(fogCoord, frameUniforms.fogParams.x) * frameUniforms.fogParams.y - frameUniforms.fogParams.z, 0.0, 1.0);
    let foggedColor = mix(outColor.rgb, frameUniforms.fogColor.rgb, fogFactor);
    outColor = vec4<f32>(foggedColor, outColor.a);
  }

  return outColor;
}
