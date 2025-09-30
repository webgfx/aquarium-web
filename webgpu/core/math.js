export function mat4Identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function mat4PerspectiveYFov(fieldOfViewRadians, aspect, near, far) {
  const f = 1.0 / Math.tan(fieldOfViewRadians / 2);
  const rangeInv = 1.0 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0,
  ]);
}

export function mat4LookAt(eye, target, up) {
  const zAxis = normalize(subtractVectors(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);

  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ]);
}

export function mat4Multiply(a, b, out = new Float32Array(16)) {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
  const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
  const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
  const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

  out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

  out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

  out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

  out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

  return out;
}

export function mat4Translate(matrix, translation, out = new Float32Array(16)) {
  const [x, y, z] = translation;
  for (let i = 0; i < 12; ++i) {
    out[i] = matrix[i];
  }
  out[12] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  out[13] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  out[14] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  out[15] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  return out;
}

export function mat4Scale(matrix, scale, out = new Float32Array(16)) {
  const [x, y, z] = scale;
  out[0] = matrix[0] * x;
  out[1] = matrix[1] * x;
  out[2] = matrix[2] * x;
  out[3] = matrix[3] * x;
  out[4] = matrix[4] * y;
  out[5] = matrix[5] * y;
  out[6] = matrix[6] * y;
  out[7] = matrix[7] * y;
  out[8] = matrix[8] * z;
  out[9] = matrix[9] * z;
  out[10] = matrix[10] * z;
  out[11] = matrix[11] * z;
  out[12] = matrix[12];
  out[13] = matrix[13];
  out[14] = matrix[14];
  out[15] = matrix[15];
  return out;
}

export function mat4Transpose(matrix, out = new Float32Array(16)) {
  out[0] = matrix[0];
  out[1] = matrix[4];
  out[2] = matrix[8];
  out[3] = matrix[12];
  out[4] = matrix[1];
  out[5] = matrix[5];
  out[6] = matrix[9];
  out[7] = matrix[13];
  out[8] = matrix[2];
  out[9] = matrix[6];
  out[10] = matrix[10];
  out[11] = matrix[14];
  out[12] = matrix[3];
  out[13] = matrix[7];
  out[14] = matrix[11];
  out[15] = matrix[15];
  return out;
}

export function mat4Inverse(matrix, out = new Float32Array(16)) {
  const m = matrix;
  const b00 = m[0] * m[5] - m[1] * m[4];
  const b01 = m[0] * m[6] - m[2] * m[4];
  const b02 = m[0] * m[7] - m[3] * m[4];
  const b03 = m[1] * m[6] - m[2] * m[5];
  const b04 = m[1] * m[7] - m[3] * m[5];
  const b05 = m[2] * m[7] - m[3] * m[6];
  const b06 = m[8] * m[13] - m[9] * m[12];
  const b07 = m[8] * m[14] - m[10] * m[12];
  const b08 = m[8] * m[15] - m[11] * m[12];
  const b09 = m[9] * m[14] - m[10] * m[13];
  const b10 = m[9] * m[15] - m[11] * m[13];
  const b11 = m[10] * m[15] - m[11] * m[14];

  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return mat4Identity();
  }
  const invDet = 1.0 / det;

  out[0] = (m[5] * b11 - m[6] * b10 + m[7] * b09) * invDet;
  out[1] = (-m[1] * b11 + m[2] * b10 - m[3] * b09) * invDet;
  out[2] = (m[13] * b05 - m[14] * b04 + m[15] * b03) * invDet;
  out[3] = (-m[9] * b05 + m[10] * b04 - m[11] * b03) * invDet;
  out[4] = (-m[4] * b11 + m[6] * b08 - m[7] * b07) * invDet;
  out[5] = (m[0] * b11 - m[2] * b08 + m[3] * b07) * invDet;
  out[6] = (-m[12] * b05 + m[14] * b02 - m[15] * b01) * invDet;
  out[7] = (m[8] * b05 - m[10] * b02 + m[11] * b01) * invDet;
  out[8] = (m[4] * b10 - m[5] * b08 + m[7] * b06) * invDet;
  out[9] = (-m[0] * b10 + m[1] * b08 - m[3] * b06) * invDet;
  out[10] = (m[12] * b04 - m[13] * b02 + m[15] * b00) * invDet;
  out[11] = (-m[8] * b04 + m[9] * b02 - m[11] * b00) * invDet;
  out[12] = (-m[4] * b09 + m[5] * b07 - m[6] * b06) * invDet;
  out[13] = (m[0] * b09 - m[1] * b07 + m[2] * b06) * invDet;
  out[14] = (-m[12] * b03 + m[13] * b01 - m[14] * b00) * invDet;
  out[15] = (m[8] * b03 - m[9] * b01 + m[10] * b00) * invDet;
  return out;
}

export function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function addVectors(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scaleVector(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function length(v) {
  return Math.sqrt(dot(v, v));
}

export function normalize(v) {
  const len = length(v) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
