// Bubble Particle Shader for WebGPU Aquarium
// Billboarded particles with lifetime animation

struct Uniforms {
  viewProjection: mat4x4<f32>,
  viewInverse: mat4x4<f32>,
  time: f32,
  padding: vec3<f32>,
};

struct ParticleData {
  positionStartTime: vec4<f32>,      // xyz = position, w = start time
  velocityStartSize: vec4<f32>,      // xyz = velocity, w = start size
  accelerationEndSize: vec4<f32>,    // xyz = acceleration, w = end size
  colorMult: vec4<f32>,              // rgba multiplier
  lifetimeFrameSpinStart: vec4<f32>, // x = lifetime, y = frameStart, z = spinStart, w = spinSpeed
};

struct VertexInput {
  @location(0) corner: vec2<f32>,    // Corner position (-0.5 to 0.5)
  @location(1) positionStartTime: vec4<f32>,
  @location(2) velocityStartSize: vec4<f32>,
  @location(3) accelerationEndSize: vec4<f32>,
  @location(4) colorMult: vec4<f32>,
  @location(5) lifetimeFrameSpinStart: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) percentLife: f32,
  @location(2) colorMult: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  // Unpack particle data
  let position = input.positionStartTime.xyz;
  let startTime = input.positionStartTime.w;
  let velocity = input.velocityStartSize.xyz;
  let startSize = input.velocityStartSize.w;
  let acceleration = input.accelerationEndSize.xyz;
  let endSize = input.accelerationEndSize.w;
  let lifetime = input.lifetimeFrameSpinStart.x;
  let spinStart = input.lifetimeFrameSpinStart.z;
  let spinSpeed = input.lifetimeFrameSpinStart.w;
  
  // Calculate particle age and percent life
  let age = uniforms.time - startTime;
  let percentLife = age / lifetime;
  
  // Hide particles that are not alive
  var size = mix(startSize, endSize, percentLife);
  if (percentLife < 0.0 || percentLife > 1.0) {
    size = 0.0;
  }
  
  // Calculate particle position with physics
  let currentPosition = position + velocity * age + acceleration * age * age;
  
  // Calculate rotation
  let angle = spinStart + spinSpeed * age;
  let s = sin(angle);
  let c = cos(angle);
  let rotatedCorner = vec2<f32>(
    input.corner.x * c + input.corner.y * s,
    -input.corner.x * s + input.corner.y * c
  );
  
  // Billboard - face the camera
  let basisX = uniforms.viewInverse[0].xyz;
  let basisY = uniforms.viewInverse[1].xyz;
  let offsetPosition = (basisX * rotatedCorner.x + basisY * rotatedCorner.y) * size;
  
  // Final world position
  let worldPosition = currentPosition + offsetPosition;
  
  // Output
  output.position = uniforms.viewProjection * vec4<f32>(worldPosition, 1.0);
  output.texCoord = input.corner + vec2<f32>(0.5, 0.5);  // Convert from -0.5..0.5 to 0..1
  output.percentLife = percentLife;
  output.colorMult = input.colorMult;
  
  return output;
}

@group(1) @binding(0) var particleTexture: texture_2d<f32>;
@group(1) @binding(1) var particleSampler: sampler;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample the particle texture
  let texColor = textureSample(particleTexture, particleSampler, input.texCoord);
  
  // Fade out at end of life
  let alpha = 1.0 - smoothstep(0.7, 1.0, input.percentLife);
  
  // Apply color multiplier and lifetime alpha
  var color = texColor * input.colorMult;
  color.a *= alpha;
  
  return color;
}
