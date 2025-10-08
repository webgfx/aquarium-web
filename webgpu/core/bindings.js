export function createBindGroupLayout(device, label, entries) {
  return device.createBindGroupLayout({ label, entries });
}

export function createBindGroup(device, layout, entries, label) {
  return device.createBindGroup({ label, layout, entries });
}

export function createUniformBuffer(device, size, label) {
  const buffer = device.createBuffer({
    label,
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  return buffer;
}
