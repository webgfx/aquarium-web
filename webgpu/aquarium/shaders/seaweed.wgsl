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
@group(2) @binding(1) var linearSampler: sampler;
@group(2) @binding(2) var<uniform> materialUniforms: MaterialUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) texCoord: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) surfaceToLight: vec3<f32>,
  @location(3) surfaceToView: vec3<f32>,
  @location(4) clipPosition: vec4<f32>,
}

fn safeNormalize(v: vec3<f32>, fallback: vec3<f32>) -> vec3<f32> {
  let len = length(v);
  return select(fallback, v / len, len > 1e-5);
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  let worldPos = modelUniforms.world;
  let time = modelUniforms.extra.x;
  let toCamera = safeNormalize(frameUniforms.viewInverse[3].xyz - worldPos[3].xyz, vec3<f32>(0.0, 0.0, 1.0));
  let yAxis = vec3<f32>(0.0, 1.0, 0.0);
  let xAxis = safeNormalize(cross(yAxis, toCamera), vec3<f32>(1.0, 0.0, 0.0));
  let zAxis = safeNormalize(cross(xAxis, yAxis), vec3<f32>(0.0, 0.0, 1.0));

  let newWorld = mat4x4<f32>(
    vec4<f32>(xAxis, 0.0),
    vec4<f32>(yAxis, 0.0),
    vec4<f32>(zAxis, 0.0),
    vec4<f32>(worldPos[3].xyz, 1.0)
  );

  var bentPosition = vec4<f32>(input.position, 1.0);
  let sway = sin(time * 0.5) * pow(input.position.y * 0.07, 2.0);
  bentPosition.x += sway;
  bentPosition.y += -4.0;

  let worldPosition = newWorld * bentPosition;

  var output: VertexOutput;
  output.position = frameUniforms.viewProjection * worldPosition;
  output.clipPosition = output.position;
  output.texCoord = input.texCoord;
  let normalMatrix = mat3x3<f32>(newWorld[0].xyz, newWorld[1].xyz, newWorld[2].xyz);
  output.normal = normalize(normalMatrix * input.normal);
  let baseWorldPosition = (modelUniforms.world * vec4<f32>(input.position, 1.0)).xyz;
  output.surfaceToLight = frameUniforms.lightWorldPos.xyz - baseWorldPosition;
  output.surfaceToView = frameUniforms.viewInverse[3].xyz - baseWorldPosition;
  return output;
}

fn lit(l: f32, h: f32, shininess: f32) -> vec3<f32> {
  let diffuse = max(l, 0.0);
  let specular = select(0.0, pow(max(h, 0.0), shininess), l > 0.0);
  return vec3<f32>(1.0, diffuse, specular);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let diffuseSample = textureSample(diffuseTexture, linearSampler, input.texCoord);
  if (diffuseSample.a < 0.3) {
    discard;
  }

  let normal = normalize(input.normal);
  let surfaceToLight = normalize(input.surfaceToLight);
  let surfaceToView = normalize(input.surfaceToView);
  let halfVector = normalize(surfaceToLight + surfaceToView);
  let lighting = lit(dot(normal, surfaceToLight), dot(normal, halfVector), materialUniforms.shininess);

  let lightColor = frameUniforms.lightColor.rgb;
  let ambientColor = frameUniforms.ambient.rgb;

  var color = diffuseSample.rgb * ambientColor;
  color += diffuseSample.rgb * lightColor * lighting.y;
  color += lightColor * materialUniforms.specular.rgb * lighting.z * materialUniforms.specularFactor;

  if (frameUniforms.fogParams.w > 0.5) {
    let fogCoord = input.clipPosition.z / input.clipPosition.w;
    let fogFactor = clamp(pow(fogCoord, frameUniforms.fogParams.x) * frameUniforms.fogParams.y - frameUniforms.fogParams.z, 0.0, 1.0);
    color = mix(color, frameUniforms.fogColor.rgb, fogFactor);
  }

  return vec4<f32>(color, diffuseSample.a);
}
