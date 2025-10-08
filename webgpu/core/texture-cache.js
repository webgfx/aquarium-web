export class TextureCache {
  constructor(device) {
    this.device = device;
    this.cache = new Map();
    this.sampler = device.createSampler({
      addressModeU: "repeat",
      addressModeV: "repeat",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear",
    });
    this.linearSampler = device.createSampler({
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      magFilter: "linear",
      minFilter: "linear",
    });
    this.cubeSampler = device.createSampler({
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      addressModeW: "clamp-to-edge",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear",
    });
  }

  async loadTexture(url, options = {}) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load texture ${url}: ${response.status}`);
    }
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob, {
      premultiplyAlpha: options.premultiplyAlpha ?? "premultiply",
      imageOrientation: "flipY",
    });

    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: options.format ?? "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: options.generateMipmaps ? undefined : 1,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height],
    );

    if (options.generateMipmaps) {
      // TODO: Implement manual mipmap generation when needed.
    }

    const record = {
      texture,
      width: imageBitmap.width,
      height: imageBitmap.height,
      sampler: options.clamp ? this.linearSampler : this.sampler,
    };
    this.cache.set(url, record);
    return record;
  }

  async loadCubeTexture(urls, options = {}) {
    if (!Array.isArray(urls) || urls.length !== 6) {
      throw new Error("loadCubeTexture expects an array of 6 URLs");
    }

    const key = `cube:${urls.join("|")}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const responses = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to load cube texture ${url}: ${response.status}`,
          );
        }
        return response;
      }),
    );

    const bitmaps = await Promise.all(
      responses.map(async (response) => {
        const blob = await response.blob();
        return createImageBitmap(blob, {
          premultiplyAlpha: options.premultiplyAlpha ?? "premultiply",
        });
      }),
    );

    const width = bitmaps[0].width;
    const height = bitmaps[0].height;

    for (const bitmap of bitmaps) {
      if (bitmap.width !== width || bitmap.height !== height) {
        throw new Error("All cube map faces must have the same dimensions");
      }
    }

    const texture = this.device.createTexture({
      size: [width, height, 6],
      format: options.format ?? "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    bitmaps.forEach((bitmap, layer) => {
      this.device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture, origin: [0, 0, layer] },
        [width, height],
      );
    });

    const record = {
      texture,
      width,
      height,
      sampler: this.cubeSampler,
      dimension: "cube",
    };

    this.cache.set(key, record);
    return record;
  }

  destroy() {
    for (const { texture } of this.cache.values()) {
      texture.destroy();
    }
    this.cache.clear();
  }
}
