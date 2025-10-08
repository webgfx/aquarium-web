export class LightRayController {
  constructor({
    count = 5,
    durationMin = 1,
    durationRange = 1,
    speed = 4,
    spread = 7,
    posRange = 20,
    rotRange = 1,
    rotLerp = 0.2,
    height = 50,
  } = {}) {
    this.params = {
      count,
      durationMin,
      durationRange,
      speed,
      spread,
      posRange,
      rotRange,
      rotLerp,
      height,
    };
    this.rays = new Array(count).fill(null).map(() => this.createLightRay());
  }

  createLightRay() {
    const { durationMin, durationRange, posRange, rotRange } = this.params;
    return {
      duration: durationMin + Math.random() * durationRange,
      timer: 0,
      rotation: Math.random() * rotRange,
      x: (Math.random() - 0.5) * posRange,
      intensity: 1,
    };
  }

  resetRay(ray) {
    const { durationMin, durationRange, posRange, rotRange } = this.params;
    ray.duration = durationMin + Math.random() * durationRange;
    ray.timer = ray.duration;
    ray.rotation = Math.random() * rotRange;
    ray.x = (Math.random() - 0.5) * posRange;
  }

  update(deltaSeconds, globals) {
    const { rotLerp, height } = this.params;
    for (const ray of this.rays) {
      ray.timer -= deltaSeconds * globals.speed;
      if (ray.timer <= 0) {
        this.resetRay(ray);
      }
      const t = Math.max(0, Math.min(1, ray.timer / ray.duration));
      ray.intensity = Math.sin(t * Math.PI);
      ray.rotation =
        ray.rotation + (Math.random() - 0.5) * rotLerp * deltaSeconds;
      ray.y = Math.max(70, Math.min(120, height + globals.eyeHeight));
    }
  }
}
