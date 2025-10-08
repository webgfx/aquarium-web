import { fishSpecies } from "../scene-registry.js";

const TAIL_DIRECTION_DELTA = 0.04;
const TARGET_HEIGHT_DELTA = 0.01;

export class FishSchool {
  constructor() {
    this.speciesState = fishSpecies.map((species) => ({
      def: species,
      fish: [],
    }));
  }

  updateCounts(totalFish) {
    let remaining = Math.max(0, totalFish | 0);

    const assignForType = (type) => {
      const matching = this.speciesState.filter((state) =>
        state.def.name.startsWith(type),
      );
      if (matching.length === 0) {
        return;
      }

      for (const state of matching) {
        if (remaining <= 0) {
          this.resizeFishArray(state, 0);
          continue;
        }

        let cap = remaining;
        if (type === "Big") {
          cap = totalFish < 100 ? 1 : totalFish < 1000 ? 2 : 4;
        } else if (type === "Medium") {
          if (totalFish < 1000) {
            cap = Math.max(0, Math.floor(totalFish / 10));
          } else if (totalFish < 10000) {
            cap = 80;
          } else {
            cap = 160;
          }
        }

        const desired = Math.min(remaining, Math.max(0, cap));
        this.resizeFishArray(state, desired);
        remaining -= desired;
      }
    };

    assignForType("Big");
    assignForType("Medium");
    assignForType("Small");
  }

  resizeFishArray(state, desired) {
    const current = state.fish.length;
    if (current > desired) {
      state.fish.length = desired;
      return;
    }

    for (let i = current; i < desired; ++i) {
      state.fish.push(this.createFishInstance(state.def, i));
    }
  }

  createFishInstance(species, index) {
    return {
      index,
      position: new Float32Array([0, species.heightOffset, 0]),
      target: new Float32Array([0, species.heightOffset, 1]),
      scale: 1,
      tailTime: 0,
      speedFactor: species.speed + Math.random() * species.speedRange,
      radiusJitterX: Math.random(),
      radiusJitterY: Math.random(),
      radiusJitterZ: Math.random(),
      scaleJitter: Math.random(),
      tailPhase: Math.random() * Math.PI * 2,
    };
  }

  update(globalClock, fishConfig) {
    const baseClock = globalClock * fishConfig.fishSpeed;

    fishSpecies.forEach((species, speciesIndex) => {
      const state = this.speciesState[speciesIndex];
      if (!state) {
        return;
      }

      const fishArray = state.fish;
      const heightBase = fishConfig.fishHeight + species.heightOffset;
      const heightRange = fishConfig.fishHeightRange * species.heightRange;

      for (let i = 0; i < fishArray.length; ++i) {
        const fishInstance = fishArray[i];
        const speed = fishInstance.speedFactor;
        const clock = (baseClock + i * fishConfig.fishOffset) * speed;

        const xRadius =
          species.radius + fishInstance.radiusJitterX * species.radiusRange;
        const yRadius = 2 + fishInstance.radiusJitterY * heightRange;
        const zRadius =
          species.radius + fishInstance.radiusJitterZ * species.radiusRange;

        const xClock = clock * fishConfig.fishXClock;
        const yClock = clock * fishConfig.fishYClock;
        const zClock = clock * fishConfig.fishZClock;

        fishInstance.position[0] = Math.sin(xClock) * xRadius;
        fishInstance.position[1] = Math.sin(yClock) * yRadius + heightBase;
        fishInstance.position[2] = Math.cos(zClock) * zRadius;

        fishInstance.target[0] =
          Math.sin(xClock - TAIL_DIRECTION_DELTA) * xRadius;
        fishInstance.target[1] =
          Math.sin(yClock - TARGET_HEIGHT_DELTA) * yRadius + heightBase;
        fishInstance.target[2] =
          Math.cos(zClock - TAIL_DIRECTION_DELTA) * zRadius;

        fishInstance.scale = 1 + fishInstance.scaleJitter;

        const tailBase =
          (globalClock + i) *
            fishConfig.fishTailSpeed *
            species.tailSpeed *
            speed +
          fishInstance.tailPhase;
        const wrapped = tailBase % (Math.PI * 2);
        fishInstance.tailTime = wrapped < 0 ? wrapped + Math.PI * 2 : wrapped;
      }
    });
  }
}
