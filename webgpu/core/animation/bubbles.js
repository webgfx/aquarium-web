export class BubbleEmitter {
  constructor({
    numSets = 10,
    triggerInterval = [2, 10],
    radiusRange = [0, 50],
  } = {}) {
    this.numSets = numSets;
    this.triggerInterval = triggerInterval;
    this.radiusRange = radiusRange;
    this.emitters = new Array(numSets).fill(null).map(() => ({
      timer: this.randomInterval(),
      position: [0, 0, 0],
    }));
    this.index = 0;
    this.triggerCallback = null;
  }

  onTrigger(callback) {
    this.triggerCallback = callback;
  }

  randomInterval() {
    const [min, max] = this.triggerInterval;
    return min + Math.random() * (max - min);
  }

  update(deltaSeconds, globals) {
    this.emitters.forEach((emitter) => {
      emitter.timer -= deltaSeconds * globals.speed;
      if (emitter.timer <= 0) {
        emitter.timer = this.randomInterval();
        const [minRadius, maxRadius] = this.radiusRange;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const angle = Math.random() * Math.PI * 2;
        emitter.position[0] = Math.sin(angle) * radius;
        emitter.position[1] = 0;
        emitter.position[2] = Math.cos(angle) * radius;
        if (this.triggerCallback) {
          this.triggerCallback([...emitter.position]);
        }
      }
    });
  }
}
