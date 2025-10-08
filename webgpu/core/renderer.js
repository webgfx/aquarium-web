import {
  mat4PerspectiveYFov,
  mat4LookAt,
  mat4Multiply,
  mat4Inverse,
  mat4Transpose,
  mat4Identity,
} from "./math.js";
import {
  createBindGroupLayout,
  createBindGroup,
  createUniformBuffer,
} from "./bindings.js";
import { TextureCache } from "./texture-cache.js";
import { FishSchool } from "./animation/fish-school.js";
import { fishSpecies } from "./scene-registry.js";
import { createDiffusePipeline } from "./pipelines/diffuse.js";
import { createFishPipeline } from "./pipelines/fish.js";
import { createSeaweedPipeline } from "./pipelines/seaweed.js";
import { createInnerPipeline } from "./pipelines/inner.js";
import { createOuterPipeline } from "./pipelines/outer.js";
import { createBubblePipeline } from "./pipelines/bubble.js";
import { createLaserPipeline } from "./pipelines/laser.js";
import { createLightRayPipeline } from "./pipelines/light-ray.js";

const FRAME_UNIFORM_SIZE = 256;
const MODEL_UNIFORM_SIZE = 256;
const MATERIAL_UNIFORM_SIZE = 32;
const FISH_INSTANCE_STRIDE_FLOATS = 8;
const FISH_INSTANCE_STRIDE_BYTES = FISH_INSTANCE_STRIDE_FLOATS * 4;
const FISH_MATERIAL_UNIFORM_SIZE = 32;
const TANK_MATERIAL_UNIFORM_SIZE = 64;

export class AquariumRenderer {
  constructor({ context, assets, ui }) {
    this.context = context;
    this.device = context.device;
    this.queue = this.device.queue;
    this.canvas = context.canvas;
    this.assets = assets;
    this.ui = ui;

    this.depthTexture = null;
    this.depthView = null;
    this.depthSize = [0, 0];

    this.currentState = ui.getState();
    this.clock = 0;
    this.eyeClock = 0;
    this.lastTime = performance.now();
    this.animationHandle = null;

    this.textureCache = new TextureCache(this.device);
    this.frameUniformBuffer = null;
    this.frameUniformData = new Float32Array(FRAME_UNIFORM_SIZE / 4);
    this.modelUniformBuffer = null;
    this.modelUniformData = new Float32Array(MODEL_UNIFORM_SIZE / 4);
    this.modelExtraDefault = new Float32Array(4);
    this.modelExtraScratch = new Float32Array(4);

    this.frameBindGroup = null;
    this.modelBindGroup = null;

    this.frameLayout = null;
    this.modelLayout = null;
    this.diffuseMaterialLayout = null;
    this.fishInstanceLayout = null;
    this.fishMaterialLayout = null;
    this.tankMaterialLayout = null;

    this.diffusePipeline = null;
    this.diffuseItems = [];
    this.seaweedPipeline = null;
    this.seaweedItems = [];
    this.fishPipeline = null;
    this.fishRenderGroups = [];
    this.innerPipeline = null;
    this.outerPipeline = null;
    this.innerItems = [];
    this.outerItems = [];

    // Bubble particle system
    this.bubblePipeline = null;
    this.bubbleBindGroupLayout0 = null;
    this.bubbleBindGroupLayout1 = null;
    this.bubbleFrameBindGroup = null;
    this.bubbleMaterialBindGroup = null;
    this.bubbleTexture = null;
    this.bubbleCornerBuffer = null;
    this.bubbleParticleBuffer = null;
    this.bubbleParticleData = null;
    this.bubbleFrameUniformBuffer = null;
    this.bubbleFrameUniformData = new Float32Array(40); // viewProjection(16) + viewInverse(16) + time(1) + padding(3) = 40 floats (160 bytes)
    this.bubbleTimer = 0;
    this.bubbleIndex = 0;
    this.maxBubbleParticles = 1000;
    this.numActiveBubbles = 0;
    this.bubbleEmitters = 10;

    // Laser system
    this.laserPipeline = null;
    this.laserMaterialLayout = null;
    this.laserTexture = null;
    this.laserInstances = [];
    this.laserVertexBuffer = null;
    this.laserColorMultBuffer = null;

    // Light ray system
    this.lightRayPipeline = null;
    this.lightRayMaterialLayout = null;
    this.lightRayTexture = null;
    this.lightRayInfo = [];
    this.lightRayQuadBuffer = null;

    this.materialCache = new Map();
    this.fishMaterials = new Map();
    this.tankMaterials = new Map();
    this.skyboxTexture = null;
    this.skyboxView = null;
    this.fishSchool = new FishSchool();

    this.fpsElement = document.getElementById("fpsValue");
    this.canvasInfoElement = document.getElementById("canvasInfo");

    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;

    ui.subscribe((state) => {
      this.currentState = state;
    });
  }

  async initialize() {
    this.setupDepthTextureIfNeeded();
    this.createBindGroupLayouts();
    this.createUniformBuffers();
    await this.prepareSceneData();
    this.updateCanvasInfo();
  }

  createBindGroupLayouts() {
    const visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    const fragmentVisibility = GPUShaderStage.FRAGMENT;
    this.frameLayout = createBindGroupLayout(this.device, "frame-layout", [
      {
        binding: 0,
        visibility,
        buffer: { type: "uniform" },
      },
    ]);

    this.modelLayout = createBindGroupLayout(this.device, "model-layout", [
      {
        binding: 0,
        visibility,
        buffer: { type: "uniform" },
      },
    ]);

    this.diffuseMaterialLayout = createBindGroupLayout(
      this.device,
      "diffuse-material-layout",
      [
        {
          binding: 0,
          visibility,
          texture: { sampleType: "float" },
        },
        {
          binding: 1,
          visibility,
          sampler: { type: "filtering" },
        },
        {
          binding: 2,
          visibility,
          buffer: { type: "uniform" },
        },
      ]
    );

    this.fishInstanceLayout = createBindGroupLayout(
      this.device,
      "fish-instance-layout",
      [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility,
          buffer: { type: "uniform" },
        },
      ]
    );

    this.fishMaterialLayout = createBindGroupLayout(
      this.device,
      "fish-material-layout",
      [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ]
    );

    this.tankMaterialLayout = createBindGroupLayout(
      this.device,
      "tank-material-layout",
      [
        {
          binding: 0,
          visibility: fragmentVisibility,
          texture: { sampleType: "float" },
        },
        {
          binding: 1,
          visibility: fragmentVisibility,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: fragmentVisibility,
          texture: { sampleType: "float" },
        },
        {
          binding: 3,
          visibility: fragmentVisibility,
          texture: { sampleType: "float", viewDimension: "cube" },
        },
        {
          binding: 4,
          visibility: fragmentVisibility,
          sampler: { type: "filtering" },
        },
        {
          binding: 5,
          visibility: fragmentVisibility,
          buffer: { type: "uniform" },
        },
      ]
    );
  }

  createUniformBuffers() {
    this.frameUniformBuffer = createUniformBuffer(
      this.device,
      FRAME_UNIFORM_SIZE,
      "frame-uniform"
    );
    this.frameBindGroup = createBindGroup(
      this.device,
      this.frameLayout,
      [
        {
          binding: 0,
          resource: { buffer: this.frameUniformBuffer },
        },
      ],
      "frame-bind-group"
    );

    this.modelUniformBuffer = createUniformBuffer(
      this.device,
      MODEL_UNIFORM_SIZE,
      "model-uniform"
    );
    this.modelBindGroup = createBindGroup(
      this.device,
      this.modelLayout,
      [
        {
          binding: 0,
          resource: { buffer: this.modelUniformBuffer },
        },
      ],
      "model-bind-group"
    );
  }

  async prepareSceneData() {
    const sceneByName = new Map(
      this.assets.scenes.map((scene) => [scene.name, scene])
    );
    const baseDiffuseModel = this.assets.scenes.find(
      (scene) => scene.definition.program === "diffuse"
    )?.models[0];
    if (!baseDiffuseModel) {
      throw new Error("No diffuse models available to build pipeline");
    }

    this.diffusePipeline = await createDiffusePipeline(
      this.device,
      {
        frameLayout: this.frameLayout,
        modelLayout: this.modelLayout,
        materialLayout: this.diffuseMaterialLayout,
      },
      this.context.format,
      baseDiffuseModel.getVertexBufferLayouts(),
      this.assets.baseUrl
    );

    const fishScenes = this.assets.scenes.filter((scene) =>
      (scene.definition.program ?? "").startsWith("fish")
    );
    const baseFishModel = fishScenes[0]?.models[0];
    if (baseFishModel) {
      this.fishPipeline = await createFishPipeline(
        this.device,
        {
          frameLayout: this.frameLayout,
          instanceLayout: this.fishInstanceLayout,
          materialLayout: this.fishMaterialLayout,
        },
        this.context.format,
        baseFishModel.getVertexBufferLayouts(),
        this.assets.baseUrl
      );
    } else {
      this.fishPipeline = null;
    }

    const seaweedScenes = this.assets.scenes.filter(
      (scene) => scene.definition.program === "seaweed"
    );
    const baseSeaweedModel = seaweedScenes[0]?.models[0];
    if (baseSeaweedModel) {
      this.seaweedPipeline = await createSeaweedPipeline(
        this.device,
        {
          frameLayout: this.frameLayout,
          modelLayout: this.modelLayout,
          materialLayout: this.diffuseMaterialLayout,
        },
        this.context.format,
        baseSeaweedModel.getVertexBufferLayouts(),
        this.assets.baseUrl
      );
    } else {
      this.seaweedPipeline = null;
    }

    // Load skybox cube texture for tank rendering
    const skyboxUrls = [
      new URL(
        "assets/GlobeOuter_EM_positive_x.jpg",
        this.assets.baseUrl
      ).toString(),
      new URL(
        "assets/GlobeOuter_EM_negative_x.jpg",
        this.assets.baseUrl
      ).toString(),
      new URL(
        "assets/GlobeOuter_EM_positive_y.jpg",
        this.assets.baseUrl
      ).toString(),
      new URL(
        "assets/GlobeOuter_EM_negative_y.jpg",
        this.assets.baseUrl
      ).toString(),
      new URL(
        "assets/GlobeOuter_EM_positive_z.jpg",
        this.assets.baseUrl
      ).toString(),
      new URL(
        "assets/GlobeOuter_EM_negative_z.jpg",
        this.assets.baseUrl
      ).toString(),
    ];
    const skyboxRecord = await this.textureCache.loadCubeTexture(skyboxUrls);
    this.skyboxTexture = skyboxRecord.texture;
    this.skyboxView = this.skyboxTexture.createView({ dimension: "cube" });

    const innerScenes = this.assets.scenes.filter(
      (scene) => scene.definition.program === "inner"
    );
    const baseInnerModel = innerScenes[0]?.models[0];
    if (baseInnerModel) {
      this.innerPipeline = await createInnerPipeline(
        this.device,
        {
          frameLayout: this.frameLayout,
          modelLayout: this.modelLayout,
          materialLayout: this.tankMaterialLayout,
        },
        this.context.format,
        baseInnerModel.getVertexBufferLayouts(),
        this.assets.baseUrl
      );
    } else {
      this.innerPipeline = null;
    }

    const outerScenes = this.assets.scenes.filter(
      (scene) => scene.definition.program === "outer"
    );
    const baseOuterModel = outerScenes[0]?.models[0];
    if (baseOuterModel) {
      this.outerPipeline = await createOuterPipeline(
        this.device,
        {
          frameLayout: this.frameLayout,
          modelLayout: this.modelLayout,
          materialLayout: this.tankMaterialLayout,
        },
        this.context.format,
        baseOuterModel.getVertexBufferLayouts(),
        this.assets.baseUrl
      );
    } else {
      this.outerPipeline = null;
    }

    // Initialize bubble particle system
    await this.initializeBubbleSystem();

    // Initialize laser and light ray systems
    await this.initializeLaserSystem();
    await this.initializeLightRaySystem();

    this.diffuseItems = [];
    this.seaweedItems = [];
    let seaweedTimeIndex = 0;
    for (const object of this.assets.placement.objects) {
      const scene = sceneByName.get(object.name);
      if (!scene) {
        continue;
      }

      const programType = scene.definition.program ?? "diffuse";
      switch (programType) {
        case "diffuse": {
          for (const model of scene.models) {
            const diffuseTextureName = model.textureNames?.diffuse;
            if (!diffuseTextureName) {
              continue;
            }
            const material = await this.getDiffuseMaterial(diffuseTextureName);
            this.diffuseItems.push({
              model,
              material,
              worldMatrix: new Float32Array(object.worldMatrix),
            });
          }
          break;
        }
        case "seaweed": {
          const timeOffset = seaweedTimeIndex++;
          for (const model of scene.models) {
            const diffuseTextureName = model.textureNames?.diffuse;
            if (!diffuseTextureName) {
              continue;
            }
            const material = await this.getDiffuseMaterial(diffuseTextureName);
            this.seaweedItems.push({
              model,
              material,
              worldMatrix: new Float32Array(object.worldMatrix),
              timeOffset,
            });
          }
          break;
        }
        case "inner": {
          for (const model of scene.models) {
            const material = await this.getTankMaterial(
              model.textureNames ?? {},
              "inner"
            );
            this.innerItems.push({
              model,
              material,
              worldMatrix: new Float32Array(object.worldMatrix),
            });
          }
          break;
        }
        case "outer": {
          for (const model of scene.models) {
            const material = await this.getTankMaterial(
              model.textureNames ?? {},
              "outer"
            );
            this.outerItems.push({
              model,
              material,
              worldMatrix: new Float32Array(object.worldMatrix),
            });
          }
          break;
        }
        default:
          break;
      }
    }

    this.fishRenderGroups = [];
    for (
      let speciesIndex = 0;
      speciesIndex < fishSpecies.length;
      ++speciesIndex
    ) {
      const species = fishSpecies[speciesIndex];
      const scene = sceneByName.get(species.name);
      if (!scene || scene.models.length === 0) {
        continue;
      }

      const model = scene.models[0];
      if (!this.fishPipeline) {
        this.fishPipeline = await createFishPipeline(
          this.device,
          {
            frameLayout: this.frameLayout,
            instanceLayout: this.fishInstanceLayout,
            materialLayout: this.fishMaterialLayout,
          },
          this.context.format,
          model.getVertexBufferLayouts()
        );
      }

      const material = await this.getFishMaterial(model.textureNames ?? {});
      const speciesUniformBuffer = createUniformBuffer(
        this.device,
        FISH_MATERIAL_UNIFORM_SIZE,
        `fish-${species.name}-uniform`
      );
      const speciesUniformData = new Float32Array(
        FISH_MATERIAL_UNIFORM_SIZE / 4
      );
      speciesUniformData[0] = species.constUniforms.fishLength;
      speciesUniformData[1] = species.constUniforms.fishWaveLength;
      speciesUniformData[2] = species.constUniforms.fishBendAmount;
      speciesUniformData[3] = 0;
      speciesUniformData[4] = 0;
      speciesUniformData[5] = 5;
      speciesUniformData[6] = 0.3;
      speciesUniformData[7] = 0;
      this.queue.writeBuffer(
        speciesUniformBuffer,
        0,
        speciesUniformData.buffer,
        speciesUniformData.byteOffset,
        FISH_MATERIAL_UNIFORM_SIZE
      );

      const initialCapacity = 1;
      const instanceArray = new Float32Array(
        initialCapacity * FISH_INSTANCE_STRIDE_FLOATS
      );
      const instanceBuffer = this.device.createBuffer({
        label: `fish-${species.name}-instances`,
        size: Math.max(1, initialCapacity) * FISH_INSTANCE_STRIDE_BYTES,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const instanceBindGroup = createBindGroup(
        this.device,
        this.fishInstanceLayout,
        [
          {
            binding: 0,
            resource: { buffer: instanceBuffer },
          },
          {
            binding: 1,
            resource: { buffer: speciesUniformBuffer },
          },
        ],
        `fish-instance-${species.name}`
      );

      this.fishRenderGroups.push({
        species,
        speciesIndex,
        program: scene.definition.program ?? "fishNormal",
        model,
        material,
        instanceBuffer,
        instanceArray,
        instanceCapacity: initialCapacity,
        instanceCount: 0,
        instanceBindGroup,
        speciesUniformBuffer,
        speciesUniformData,
      });
    }
  }

  ensureFishCapacity(group, desiredCount) {
    if (desiredCount <= group.instanceCapacity) {
      return;
    }

    let newCapacity = group.instanceCapacity;
    while (newCapacity < desiredCount) {
      newCapacity *= 2;
    }

    if (group.instanceBuffer) {
      group.instanceBuffer.destroy();
    }

    group.instanceCapacity = newCapacity;
    group.instanceArray = new Float32Array(
      newCapacity * FISH_INSTANCE_STRIDE_FLOATS
    );
    group.instanceBuffer = this.device.createBuffer({
      label: `fish-${group.species.name}-instances`,
      size: newCapacity * FISH_INSTANCE_STRIDE_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    group.instanceBindGroup = createBindGroup(
      this.device,
      this.fishInstanceLayout,
      [
        {
          binding: 0,
          resource: { buffer: group.instanceBuffer },
        },
        {
          binding: 1,
          resource: { buffer: group.speciesUniformBuffer },
        },
      ],
      `fish-instance-${group.species.name}`
    );
  }

  updateFishResources() {
    if (!this.fishPipeline || this.fishRenderGroups.length === 0) {
      return;
    }

    this.fishSchool.updateCounts(this.currentState.fishCount);
    this.fishSchool.update(this.clock, this.currentState.fish);

    const options = this.currentState.options;

    for (const group of this.fishRenderGroups) {
      const speciesState = this.fishSchool.speciesState[group.speciesIndex];
      const fishList = speciesState ? speciesState.fish : [];

      this.ensureFishCapacity(group, fishList.length);
      group.instanceCount = fishList.length;

      if (fishList.length > 0) {
        const instanceArray = group.instanceArray;
        for (let i = 0; i < fishList.length; ++i) {
          const fish = fishList[i];
          const base = i * FISH_INSTANCE_STRIDE_FLOATS;
          instanceArray[base + 0] = fish.position[0];
          instanceArray[base + 1] = fish.position[1];
          instanceArray[base + 2] = fish.position[2];
          instanceArray[base + 3] = fish.scale;
          instanceArray[base + 4] = fish.target[0];
          instanceArray[base + 5] = fish.target[1];
          instanceArray[base + 6] = fish.target[2];
          instanceArray[base + 7] = fish.tailTime;
        }

        this.queue.writeBuffer(
          group.instanceBuffer,
          0,
          group.instanceArray.subarray(
            0,
            fishList.length * FISH_INSTANCE_STRIDE_FLOATS
          )
        );
      }

      const uniforms = group.speciesUniformData;
      uniforms[0] = group.species.constUniforms.fishLength;
      uniforms[1] = group.species.constUniforms.fishWaveLength;
      uniforms[2] = group.species.constUniforms.fishBendAmount;
      uniforms[3] = options.normalMaps && group.material.hasNormalMap ? 1 : 0;
      uniforms[4] =
        options.reflection && group.material.hasReflectionMap ? 1 : 0;
      uniforms[5] = 5;
      uniforms[6] = 0.3;
      uniforms[7] = 0;

      this.queue.writeBuffer(
        group.speciesUniformBuffer,
        0,
        uniforms.buffer,
        uniforms.byteOffset,
        FISH_MATERIAL_UNIFORM_SIZE
      );
    }

    // Update tank material uniforms
    for (const item of this.innerItems) {
      const uniforms = item.material.uniformData;
      uniforms[6] = this.currentState.innerConst.refractionFudge;
      uniforms[7] = this.currentState.innerConst.eta;
      uniforms[8] = this.currentState.innerConst.tankColorFudge;
      uniforms[9] = options.normalMaps && item.material.hasNormalMap ? 1 : 0;
      uniforms[10] =
        options.reflection && item.material.hasReflectionMap ? 1 : 0;
      this.queue.writeBuffer(
        item.material.uniformBuffer,
        0,
        uniforms.buffer,
        uniforms.byteOffset,
        TANK_MATERIAL_UNIFORM_SIZE
      );
    }
    for (const item of this.outerItems) {
      const uniforms = item.material.uniformData;
      uniforms[9] = options.normalMaps && item.material.hasNormalMap ? 1 : 0;
      uniforms[10] =
        options.reflection && item.material.hasReflectionMap ? 1 : 0;
      this.queue.writeBuffer(
        item.material.uniformBuffer,
        0,
        uniforms.buffer,
        uniforms.byteOffset,
        TANK_MATERIAL_UNIFORM_SIZE
      );
    }
  }

  async getDiffuseMaterial(diffuseTextureName) {
    const key = `diffuse:${diffuseTextureName}`;
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key);
    }

    const textureUrl = new URL(
      `assets/${diffuseTextureName}`,
      this.assets.baseUrl
    ).toString();
    const textureRecord = await this.textureCache.loadTexture(textureUrl);
    const materialUniformBuffer = createUniformBuffer(
      this.device,
      MATERIAL_UNIFORM_SIZE,
      `material-${diffuseTextureName}`
    );
    const materialData = new Float32Array(MATERIAL_UNIFORM_SIZE / 4);
    // Default specular setup; refined values will come with full port.
    materialData.set([1, 1, 1, 1], 0);
    materialData[4] = 5; // shininess
    materialData[5] = 0.3; // specularFactor
    this.queue.writeBuffer(
      materialUniformBuffer,
      0,
      materialData.buffer,
      materialData.byteOffset,
      MATERIAL_UNIFORM_SIZE
    );

    const bindGroup = createBindGroup(
      this.device,
      this.diffuseMaterialLayout,
      [
        {
          binding: 0,
          resource: textureRecord.texture.createView(),
        },
        {
          binding: 1,
          resource: textureRecord.sampler,
        },
        {
          binding: 2,
          resource: { buffer: materialUniformBuffer },
        },
      ],
      `diffuse-material-${diffuseTextureName}`
    );

    const material = {
      bindGroup,
      uniformBuffer: materialUniformBuffer,
      textureRecord,
    };
    this.materialCache.set(key, material);
    return material;
  }

  async getFishMaterial(textureNames) {
    const diffuseName = textureNames?.diffuse;
    if (!diffuseName) {
      throw new Error("Fish model is missing a diffuse texture");
    }
    const normalName = textureNames?.normalMap ?? null;
    const reflectionName = textureNames?.reflectionMap ?? null;
    const key = `fish:${diffuseName}:${normalName ?? "none"}:${
      reflectionName ?? "none"
    }`;
    if (this.fishMaterials.has(key)) {
      return this.fishMaterials.get(key);
    }

    const diffuseUrl = new URL(
      `assets/${diffuseName}`,
      this.assets.baseUrl
    ).toString();
    const diffuseRecord = await this.textureCache.loadTexture(diffuseUrl);
    const normalRecord = normalName
      ? await this.textureCache.loadTexture(
          new URL(`assets/${normalName}`, this.assets.baseUrl).toString()
        )
      : diffuseRecord;
    const reflectionRecord = reflectionName
      ? await this.textureCache.loadTexture(
          new URL(`assets/${reflectionName}`, this.assets.baseUrl).toString()
        )
      : diffuseRecord;

    const bindGroup = createBindGroup(
      this.device,
      this.fishMaterialLayout,
      [
        {
          binding: 0,
          resource: diffuseRecord.texture.createView(),
        },
        {
          binding: 1,
          resource: normalRecord.texture.createView(),
        },
        {
          binding: 2,
          resource: reflectionRecord.texture.createView(),
        },
        {
          binding: 3,
          resource: diffuseRecord.sampler,
        },
      ],
      `fish-material-${key}`
    );

    const material = {
      bindGroup,
      diffuse: diffuseRecord,
      normal: normalRecord,
      reflection: reflectionRecord,
      hasNormalMap: !!normalName,
      hasReflectionMap: !!reflectionName,
    };
    this.fishMaterials.set(key, material);
    return material;
  }

  async getTankMaterial(textureNames, tankType) {
    const diffuseName = textureNames?.diffuse;
    const normalName = textureNames?.normalMap ?? null;
    const reflectionName = textureNames?.reflectionMap ?? null;
    if (!diffuseName) {
      throw new Error(`Tank ${tankType} model is missing a diffuse texture`);
    }
    const key = `tank:${tankType}:${diffuseName}:${normalName ?? "none"}:${
      reflectionName ?? "none"
    }`;
    if (this.tankMaterials.has(key)) {
      return this.tankMaterials.get(key);
    }

    const diffuseUrl = new URL(
      `assets/${diffuseName}`,
      this.assets.baseUrl
    ).toString();
    const diffuseRecord = await this.textureCache.loadTexture(diffuseUrl);
    const normalRecord = normalName
      ? await this.textureCache.loadTexture(
          new URL(`assets/${normalName}`, this.assets.baseUrl).toString()
        )
      : diffuseRecord;
    const reflectionRecord = reflectionName
      ? await this.textureCache.loadTexture(
          new URL(`assets/${reflectionName}`, this.assets.baseUrl).toString()
        )
      : diffuseRecord;

    const tankUniformBuffer = createUniformBuffer(
      this.device,
      TANK_MATERIAL_UNIFORM_SIZE,
      `tank-${tankType}-uniform`
    );
    const tankUniformData = new Float32Array(TANK_MATERIAL_UNIFORM_SIZE / 4);
    tankUniformData.set([1, 1, 1, 1], 0); // specular
    tankUniformData[4] = 50; // shininess
    tankUniformData[5] = 1; // specularFactor
    tankUniformData[6] = this.currentState.innerConst.refractionFudge; // refractionFudge
    tankUniformData[7] = this.currentState.innerConst.eta; // eta
    tankUniformData[8] = this.currentState.innerConst.tankColorFudge; // tankColorFudge
    tankUniformData[9] =
      this.currentState.options.normalMaps && normalName ? 1 : 0; // useNormalMap
    tankUniformData[10] =
      this.currentState.options.reflection && reflectionName ? 1 : 0; // useReflectionMap
    tankUniformData[11] = tankType === "outer" ? 0.2 : 0; // outerFudge
    this.queue.writeBuffer(
      tankUniformBuffer,
      0,
      tankUniformData.buffer,
      tankUniformData.byteOffset,
      TANK_MATERIAL_UNIFORM_SIZE
    );

    const bindGroup = createBindGroup(
      this.device,
      this.tankMaterialLayout,
      [
        {
          binding: 0,
          resource: diffuseRecord.texture.createView(),
        },
        {
          binding: 1,
          resource: normalRecord.texture.createView(),
        },
        {
          binding: 2,
          resource: reflectionRecord.texture.createView(),
        },
        {
          binding: 3,
          resource: this.skyboxView,
        },
        {
          binding: 4,
          resource: diffuseRecord.sampler,
        },
        {
          binding: 5,
          resource: { buffer: tankUniformBuffer },
        },
      ],
      `tank-material-${key}`
    );

    const material = {
      bindGroup,
      uniformBuffer: tankUniformBuffer,
      uniformData: tankUniformData,
      diffuse: diffuseRecord,
      normal: normalRecord,
      reflection: reflectionRecord,
      hasNormalMap: !!normalName,
      hasReflectionMap: !!reflectionName,
    };
    this.tankMaterials.set(key, material);
    return material;
  }

  async initializeBubbleSystem() {
    // Create bubble pipeline
    const bubblePipelineData = await createBubblePipeline(
      this.device,
      this.context.format,
      this.assets.baseUrl
    );
    this.bubblePipeline = bubblePipelineData.pipeline;
    this.bubbleBindGroupLayout0 = bubblePipelineData.bindGroupLayout0;
    this.bubbleBindGroupLayout1 = bubblePipelineData.bindGroupLayout1;

    // Load bubble texture
    const bubbleTextureUrl = new URL(
      "static_assets/bubble.png",
      this.assets.baseUrl
    ).toString();
    const bubbleRecord = await this.textureCache.loadTexture(bubbleTextureUrl);
    this.bubbleTexture = bubbleRecord.texture;

    // Create corner buffer (shared quad vertices for billboards)
    const corners = new Float32Array([
      -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
    ]);
    this.bubbleCornerBuffer = this.device.createBuffer({
      label: "bubble-corners",
      size: corners.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.queue.writeBuffer(this.bubbleCornerBuffer, 0, corners);

    // Create particle data buffer
    const particleStride = 20; // 5 vec4s per particle
    this.bubbleParticleData = new Float32Array(
      this.maxBubbleParticles * particleStride
    );
    this.bubbleParticleBuffer = this.device.createBuffer({
      label: "bubble-particles",
      size: this.bubbleParticleData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // Create frame uniform buffer for bubbles
    this.bubbleFrameUniformBuffer = createUniformBuffer(
      this.device,
      40 * 4,
      "bubble-frame-uniform"
    ); // 160 bytes for shader alignment

    // Create bind groups
    this.bubbleFrameBindGroup = createBindGroup(
      this.device,
      this.bubbleBindGroupLayout0,
      [{ binding: 0, resource: { buffer: this.bubbleFrameUniformBuffer } }],
      "bubble-frame-bind-group"
    );

    this.bubbleMaterialBindGroup = createBindGroup(
      this.device,
      this.bubbleBindGroupLayout1,
      [
        { binding: 0, resource: this.bubbleTexture.createView() },
        { binding: 1, resource: bubbleRecord.sampler },
      ],
      "bubble-material-bind-group"
    );

    // Initialize all particles as inactive
    for (let i = 0; i < this.maxBubbleParticles; i++) {
      const offset = i * particleStride;
      // Set startTime to a value that makes particles inactive
      this.bubbleParticleData[offset + 3] = -1000; // startTime in positionStartTime.w
      this.bubbleParticleData[offset + 16] = 1.0; // lifetime
    }

    this.numActiveBubbles = 0;
  }

  emitBubbles(worldMatrix) {
    if (!this.bubbleParticleData) return;

    const particleStride = 20;
    const numParticlesToEmit = 100;

    for (let i = 0; i < numParticlesToEmit; i++) {
      const particleIndex = (this.bubbleIndex + i) % this.maxBubbleParticles;
      const offset = particleIndex * particleStride;

      // Position (relative to emitter)
      this.bubbleParticleData[offset + 0] =
        worldMatrix[12] + (Math.random() - 0.5) * 0.2;
      this.bubbleParticleData[offset + 1] =
        worldMatrix[13] - 2 + Math.random() * 4;
      this.bubbleParticleData[offset + 2] =
        worldMatrix[14] + (Math.random() - 0.5) * 0.2;
      this.bubbleParticleData[offset + 3] = this.clock; // startTime

      // Velocity
      this.bubbleParticleData[offset + 4] = (Math.random() - 0.5) * 0.1;
      this.bubbleParticleData[offset + 5] = 0; // upward velocity handled by acceleration
      this.bubbleParticleData[offset + 6] = (Math.random() - 0.5) * 0.1;
      this.bubbleParticleData[offset + 7] = 0.01 + Math.random() * 0.01; // startSize

      // Acceleration (buoyancy)
      this.bubbleParticleData[offset + 8] = 0;
      this.bubbleParticleData[offset + 9] = 0.05 + Math.random() * 0.02; // rise speed
      this.bubbleParticleData[offset + 10] = 0;
      this.bubbleParticleData[offset + 11] = 0.4 + Math.random() * 0.2; // endSize

      // Color multiplier (slightly bluish-white)
      this.bubbleParticleData[offset + 12] = 0.7;
      this.bubbleParticleData[offset + 13] = 0.8;
      this.bubbleParticleData[offset + 14] = 1.0;
      this.bubbleParticleData[offset + 15] = 1.0;

      // Lifetime, frameStart, spinStart, spinSpeed
      this.bubbleParticleData[offset + 16] = 40.0; // lifetime
      this.bubbleParticleData[offset + 17] = 0; // frameStart
      this.bubbleParticleData[offset + 18] = Math.random() * Math.PI * 2; // spinStart
      this.bubbleParticleData[offset + 19] = (Math.random() - 0.5) * 0.2; // spinSpeed
    }

    this.bubbleIndex =
      (this.bubbleIndex + numParticlesToEmit) % this.maxBubbleParticles;
    this.numActiveBubbles = Math.min(
      this.numActiveBubbles + numParticlesToEmit,
      this.maxBubbleParticles
    );
  }

  updateBubbles(deltaSeconds) {
    if (!this.currentState.options.bubbles || !this.bubbleParticleData) {
      return;
    }

    // Periodically emit new bubbles
    this.bubbleTimer -= deltaSeconds * this.currentState.globals.speed;
    if (this.bubbleTimer < 0) {
      this.bubbleTimer = 2 + Math.random() * 8;
      const radius = Math.random() * 50;
      const angle = Math.random() * Math.PI * 2;

      // Create a world matrix for the emission point
      const emitMatrix = new Float32Array(16);
      emitMatrix[0] = emitMatrix[5] = emitMatrix[10] = emitMatrix[15] = 1;
      emitMatrix[12] = Math.sin(angle) * radius;
      emitMatrix[13] = 0;
      emitMatrix[14] = Math.cos(angle) * radius;

      this.emitBubbles(emitMatrix);
    }

    // Upload particle data to GPU
    this.queue.writeBuffer(
      this.bubbleParticleBuffer,
      0,
      this.bubbleParticleData
    );
  }

  updateLasers(deltaSeconds) {
    if (!this.currentState.options.lasers || !this.laserMaterialBindGroup) {
      return;
    }

    // Clear previous laser instances
    this.laserInstances = [];

    // Find BigFishA and BigFishB in fish render groups
    for (const group of this.fishRenderGroups) {
      if (
        group.species.name !== "BigFishA" &&
        group.species.name !== "BigFishB"
      ) {
        continue;
      }

      // Get fish positions from the fish school
      const speciesState = this.fishSchool.speciesState[group.speciesIndex];
      if (!speciesState || !speciesState.fish) continue;

      // Create 3 lasers for each fish at 120-degree angles
      for (const fish of speciesState.fish) {
        const fishX = fish.x ?? 0;
        const fishY = fish.y ?? 0;
        const fishZ = fish.z ?? 0;
        const fishRotation = Math.atan2(fish.z ?? 0, fish.x ?? 0);

        // Create 3 lasers at 120-degree intervals
        for (let i = 0; i < 3; i++) {
          const angle = fishRotation + (i * Math.PI * 2) / 3;
          const laserLength = 200.0; // Match WebGL scale

          // Create world matrix for laser
          const worldMatrix = new Float32Array(16);
          // Identity
          worldMatrix[0] =
            worldMatrix[5] =
            worldMatrix[10] =
            worldMatrix[15] =
              1;

          // Scale: width = 0.5, height = laserLength (matching WebGL [0.5, 0.5, 200])
          worldMatrix[0] = 0.5;
          worldMatrix[5] = laserLength;
          worldMatrix[10] = 0.5;

          // Rotation around Y axis
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rotX = worldMatrix[0];
          const rotZ = worldMatrix[10];
          worldMatrix[0] = cos * rotX;
          worldMatrix[2] = sin * rotX;
          worldMatrix[8] = -sin * rotZ;
          worldMatrix[10] = cos * rotZ;

          // Position at fish location
          worldMatrix[12] = fishX;
          worldMatrix[13] = fishY;
          worldMatrix[14] = fishZ;

          this.laserInstances.push({
            worldMatrix,
            materialBindGroup: this.laserMaterialBindGroup,
          });
        }
      }
    }
  }

  updateLightRays(deltaSeconds) {
    if (!this.currentState.options.lightRays || !this.lightRayInfo) {
      return;
    }

    // Update light ray timers and fade alpha (matching WebGL g_lightRaySpeed = 4)
    const speed = this.currentState.globals.speed * 4;
    for (const ray of this.lightRayInfo) {
      ray.timer += deltaSeconds * speed;

      // Reset ray when it exceeds duration
      if (ray.timer > ray.duration) {
        ray.timer = 0;
        ray.x = (Math.random() - 0.5) * 40; // ±20
        ray.z = (Math.random() - 0.5) * 40;
        ray.rotation = Math.random() * 2.0 - 1.0; // ±1.0
        ray.duration = 1 + Math.random() * 1; // 1-2 seconds
      }
    }
  }

  renderBubbles(pass, frameUniformData) {
    if (
      !this.currentState.options.bubbles ||
      !this.bubblePipeline ||
      this.numActiveBubbles === 0
    ) {
      return;
    }

    // Update bubble frame uniforms
    // Extract viewProjection (first 16 floats) and viewInverse (next 16 floats)
    const viewProjection = frameUniformData.slice(0, 16);
    const viewInverse = frameUniformData.slice(16, 32);

    this.bubbleFrameUniformData.set(viewProjection, 0); // mat4x4
    this.bubbleFrameUniformData.set(viewInverse, 16); // mat4x4
    this.bubbleFrameUniformData[32] = this.clock; // time
    this.queue.writeBuffer(
      this.bubbleFrameUniformBuffer,
      0,
      this.bubbleFrameUniformData
    );

    pass.setPipeline(this.bubblePipeline);
    pass.setBindGroup(0, this.bubbleFrameBindGroup);
    pass.setBindGroup(1, this.bubbleMaterialBindGroup);
    pass.setVertexBuffer(0, this.bubbleCornerBuffer);
    pass.setVertexBuffer(1, this.bubbleParticleBuffer);
    pass.draw(6, this.numActiveBubbles, 0, 0);
  }

  async initializeLaserSystem() {
    // Create laser pipeline
    const laserPipelineData = await createLaserPipeline(
      this.device,
      this.context.format,
      this.assets.baseUrl,
      {
        frameLayout: this.frameLayout,
        modelLayout: this.modelLayout,
      }
    );
    this.laserPipeline = laserPipelineData.pipeline;
    this.laserMaterialLayout = laserPipelineData.materialBindGroupLayout;

    // Load laser beam texture
    const beamTextureUrl = new URL(
      "static_assets/beam.png",
      this.assets.baseUrl
    ).toString();
    const beamRecord = await this.textureCache.loadTexture(beamTextureUrl);
    this.laserTexture = beamRecord.texture;

    // Create quad vertices for laser beam (billboarded quad)
    const vertices = new Float32Array([
      // position (xy), texcoord (uv)
      -0.5,
      -0.5,
      0.0,
      1.0, // bottom-left
      0.5,
      -0.5,
      1.0,
      1.0, // bottom-right
      0.5,
      0.5,
      1.0,
      0.0, // top-right
      -0.5,
      -0.5,
      0.0,
      1.0, // bottom-left
      0.5,
      0.5,
      1.0,
      0.0, // top-right
      -0.5,
      0.5,
      0.0,
      0.0, // top-left
    ]);
    this.laserVertexBuffer = this.device.createBuffer({
      label: "laser-vertices",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.queue.writeBuffer(this.laserVertexBuffer, 0, vertices);

    // Create color multiplier buffer (vec4)
    const colorMult = new Float32Array([1.0, 0.2, 0.2, 1.0]); // Red tint
    this.laserColorMultBuffer = this.device.createBuffer({
      label: "laser-color-mult",
      size: 16, // vec4 = 16 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.queue.writeBuffer(this.laserColorMultBuffer, 0, colorMult);

    // Initialize laser instances (will be populated when fish are setup)
    this.laserInstances = [];

    // Create material bind group for lasers (shared by all laser instances)
    this.laserMaterialBindGroup = createBindGroup(
      this.device,
      this.laserMaterialLayout,
      [
        { binding: 0, resource: this.laserTexture.createView() },
        { binding: 1, resource: beamRecord.sampler },
        { binding: 2, resource: { buffer: this.laserColorMultBuffer } },
      ],
      "laser-material-bind-group"
    );
  }

  async initializeLightRaySystem() {
    // Create light ray pipeline
    const lightRayPipelineData = await createLightRayPipeline(
      this.device,
      this.context.format,
      this.assets.baseUrl,
      {
        frameLayout: this.frameLayout,
        modelLayout: this.modelLayout,
      }
    );
    this.lightRayPipeline = lightRayPipelineData.pipeline;
    this.lightRayMaterialLayout = lightRayPipelineData.materialBindGroupLayout;

    // Load light ray texture
    const lightRayTextureUrl = new URL(
      "static_assets/LightRay.png",
      this.assets.baseUrl
    ).toString();
    const lightRayRecord = await this.textureCache.loadTexture(
      lightRayTextureUrl
    );
    this.lightRayTexture = lightRayRecord.texture;

    // Create quad vertices for light rays (large vertical billboards)
    const vertices = new Float32Array([
      // position (xy), texcoord (uv)
      -10.0,
      0.0,
      0.0,
      1.0, // bottom-left
      10.0,
      0.0,
      1.0,
      1.0, // bottom-right
      10.0,
      100.0,
      1.0,
      0.0, // top-right
      -10.0,
      0.0,
      0.0,
      1.0, // bottom-left
      10.0,
      100.0,
      1.0,
      0.0, // top-right
      -10.0,
      100.0,
      0.0,
      0.0, // top-left
    ]);
    this.lightRayQuadBuffer = this.device.createBuffer({
      label: "light-ray-vertices",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.queue.writeBuffer(this.lightRayQuadBuffer, 0, vertices);

    // Initialize 5 light ray instances with random positions and timers
    this.lightRayInfo = [];
    for (let i = 0; i < 5; i++) {
      const info = {
        x: (Math.random() - 0.5) * 40, // random x position (±20, matching g_lightRayPosRange = 20)
        z: (Math.random() - 0.5) * 40, // random z position
        rotation: Math.random() * 2.0 - 1.0, // random rotation (matching g_lightRayRotRange = 1.0)
        timer: Math.random() * 2, // random start time (matching g_lightRayDurationMin = 1 + range = 1)
        duration: 1 + Math.random() * 1, // fade duration 1-2 seconds (matching WebGL)
      };

      // Create material bind group for this light ray
      info.materialBindGroup = createBindGroup(
        this.device,
        this.lightRayMaterialLayout,
        [
          { binding: 0, resource: this.lightRayTexture.createView() },
          { binding: 1, resource: lightRayRecord.sampler },
        ],
        `light-ray-material-${i}`
      );

      this.lightRayInfo.push(info);
    }
  }

  renderLasers(pass, frameUniforms) {
    if (
      !this.currentState.options.lasers ||
      !this.laserPipeline ||
      this.laserInstances.length === 0
    ) {
      return;
    }

    // Set laser pipeline
    pass.setPipeline(this.laserPipeline);
    pass.setBindGroup(0, this.frameBindGroup);
    pass.setVertexBuffer(0, this.laserVertexBuffer);

    // Render each laser instance
    for (const laser of this.laserInstances) {
      // Update model matrix for this laser
      this.updateModelUniforms(laser.worldMatrix);
      pass.setBindGroup(1, this.modelBindGroup);
      pass.setBindGroup(2, this.laserMaterialBindGroup);
      pass.draw(6, 1, 0, 0);
    }
  }

  renderLightRays(pass, frameUniforms) {
    if (
      !this.currentState.options.lightRays ||
      !this.lightRayPipeline ||
      this.lightRayInfo.length === 0
    ) {
      return;
    }

    // Set light ray pipeline
    pass.setPipeline(this.lightRayPipeline);
    pass.setBindGroup(0, this.frameBindGroup);
    pass.setVertexBuffer(0, this.lightRayQuadBuffer);

    // Render each light ray
    for (const ray of this.lightRayInfo) {
      // Calculate alpha based on timer (sine wave fade, matching WebGL)
      const lerp = ray.timer / ray.duration;
      const alpha = Math.sin(lerp * Math.PI);

      if (alpha <= 0) continue; // skip invisible rays

      // Match WebGL: Y position between 70-120 based on eyeHeight
      const y = Math.max(
        70,
        Math.min(120, 50 + this.currentState.globals.eyeHeight)
      );

      // Build transform matrix: rotation around Z (matching WebGL), then translation
      // WebGL uses: rotationZ(info.rot + lerp * 0.2) * translation([x, y, 0]) * scaling([10, -100, 10])
      const rotZ = ray.rotation + lerp * 0.2; // rotation lerp
      const cos = Math.cos(rotZ);
      const sin = Math.sin(rotZ);

      const worldMatrix = new Float32Array(16);
      // Identity
      worldMatrix[0] = 1;
      worldMatrix[5] = 1;
      worldMatrix[10] = 1;
      worldMatrix[15] = 1;

      // Rotation around Z axis (row-major indexing)
      worldMatrix[0] = cos;
      worldMatrix[1] = sin;
      worldMatrix[4] = -sin;
      worldMatrix[5] = cos;

      // Scale: width=10, height=-100 (negative for downward), depth=10
      worldMatrix[0] *= 10;
      worldMatrix[1] *= 10;
      worldMatrix[4] *= 10;
      worldMatrix[5] *= -100; // negative Y scale for downward rays
      worldMatrix[10] *= 10;

      // Translation
      worldMatrix[12] = ray.x;
      worldMatrix[13] = y;
      worldMatrix[14] = ray.z;

      this.updateModelUniforms(worldMatrix);
      pass.setBindGroup(1, this.modelBindGroup);
      pass.setBindGroup(2, ray.materialBindGroup);
      pass.draw(6, 1, 0, 0);
    }
    
    // Reset model matrix to identity after rendering light rays
    // to avoid affecting subsequent renders
    const identityMatrix = mat4Identity();
    this.updateModelUniforms(identityMatrix);
  }

  start() {
    const loop = () => {
      this.animationHandle = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.render(delta);
    };
    loop();
  }

  stop() {
    if (this.animationHandle) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = null;
    }
  }

  render(deltaSeconds) {
    if (
      this.canvas.width !== this.depthSize[0] ||
      this.canvas.height !== this.depthSize[1]
    ) {
      this.setupDepthTextureIfNeeded();
    }

    this.clock += deltaSeconds * this.currentState.globals.speed;
    this.eyeClock += deltaSeconds * this.currentState.globals.eyeSpeed;

    this.updateFishResources();
    this.updateBubbles(deltaSeconds);
    this.updateLasers(deltaSeconds);
    this.updateLightRays(deltaSeconds);

    const frameUniforms = this.computeFrameUniforms();
    this.queue.writeBuffer(
      this.frameUniformBuffer,
      0,
      frameUniforms.buffer,
      frameUniforms.byteOffset,
      FRAME_UNIFORM_SIZE
    );

    const colorTexture = this.context.context.getCurrentTexture();
    const colorView = colorTexture.createView();

    const encoder = this.device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: colorView,
          clearValue: { r: 0.0, g: 0.1, b: 0.2, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    pass.setPipeline(this.diffusePipeline);
    pass.setBindGroup(0, this.frameBindGroup);

    for (const item of this.diffuseItems) {
      this.updateModelUniforms(item.worldMatrix);
      pass.setBindGroup(1, this.modelBindGroup);
      pass.setBindGroup(2, item.material.bindGroup);
      item.model.bind(pass);
      if (item.model.indexBuffer) {
        pass.drawIndexed(item.model.indexCount, 1, 0, 0, 0);
      } else {
        pass.draw(item.model.indexCount, 1, 0, 0);
      }
    }

    if (this.fishPipeline && this.fishRenderGroups.length > 0) {
      pass.setPipeline(this.fishPipeline);
      pass.setBindGroup(0, this.frameBindGroup);

      for (const group of this.fishRenderGroups) {
        if (group.instanceCount === 0) {
          continue;
        }

        pass.setBindGroup(1, group.instanceBindGroup);
        pass.setBindGroup(2, group.material.bindGroup);
        group.model.bind(pass);
        if (group.model.indexBuffer) {
          pass.drawIndexed(
            group.model.indexCount,
            group.instanceCount,
            0,
            0,
            0
          );
        } else {
          pass.draw(group.model.indexCount, group.instanceCount, 0, 0);
        }
      }
    }

    if (this.seaweedPipeline && this.seaweedItems.length > 0) {
      pass.setPipeline(this.seaweedPipeline);
      pass.setBindGroup(0, this.frameBindGroup);

      for (const item of this.seaweedItems) {
        this.modelExtraScratch[0] = this.clock + item.timeOffset;
        this.modelExtraScratch[1] = 0;
        this.modelExtraScratch[2] = 0;
        this.modelExtraScratch[3] = 0;
        this.updateModelUniforms(item.worldMatrix, this.modelExtraScratch);
        pass.setBindGroup(1, this.modelBindGroup);
        pass.setBindGroup(2, item.material.bindGroup);
        item.model.bind(pass);
        if (item.model.indexBuffer) {
          pass.drawIndexed(item.model.indexCount, 1, 0, 0, 0);
        } else {
          pass.draw(item.model.indexCount, 1, 0, 0);
        }
      }
    }

    if (
      this.currentState.options.tank &&
      this.innerPipeline &&
      this.innerItems.length > 0
    ) {
      pass.setPipeline(this.innerPipeline);
      pass.setBindGroup(0, this.frameBindGroup);

      for (const item of this.innerItems) {
        this.updateModelUniforms(item.worldMatrix);
        pass.setBindGroup(1, this.modelBindGroup);
        pass.setBindGroup(2, item.material.bindGroup);
        item.model.bind(pass);
        if (item.model.indexBuffer) {
          pass.drawIndexed(item.model.indexCount, 1, 0, 0, 0);
        } else {
          pass.draw(item.model.indexCount, 1, 0, 0);
        }
      }
    }

    if (
      this.currentState.options.tank &&
      this.outerPipeline &&
      this.outerItems.length > 0
    ) {
      pass.setPipeline(this.outerPipeline);
      pass.setBindGroup(0, this.frameBindGroup);

      for (const item of this.outerItems) {
        this.updateModelUniforms(item.worldMatrix);
        pass.setBindGroup(1, this.modelBindGroup);
        pass.setBindGroup(2, item.material.bindGroup);
        item.model.bind(pass);
        if (item.model.indexBuffer) {
          pass.drawIndexed(item.model.indexCount, 1, 0, 0, 0);
        } else {
          pass.draw(item.model.indexCount, 1, 0, 0);
        }
      }
    }

    // Render bubbles with additive blending (after transparent tank)
    this.renderBubbles(pass, frameUniforms);

    // Render lasers with additive blending (attached to BigFish)
    this.renderLasers(pass, frameUniforms);

    // Render light rays with alpha blending (god rays from above)
    this.renderLightRays(pass, frameUniforms);

    pass.end();
    this.queue.submit([encoder.finish()]);

    this.updateFps(deltaSeconds);
  }

  updateModelUniforms(worldMatrix, extra) {
    const world = new Float32Array(worldMatrix);
    const worldInverse = mat4Inverse(world);
    const worldInverseTranspose = mat4Transpose(worldInverse);

    this.modelUniformData.set(world, 0);
    this.modelUniformData.set(worldInverse, 16);
    this.modelUniformData.set(worldInverseTranspose, 32);
    this.modelUniformData.set(extra ?? this.modelExtraDefault, 48);

    this.queue.writeBuffer(
      this.modelUniformBuffer,
      0,
      this.modelUniformData.buffer,
      this.modelUniformData.byteOffset,
      MODEL_UNIFORM_SIZE
    );
  }

  computeFrameUniforms() {
    const globals = this.currentState.globals;

    const eyePosition = [
      Math.sin(this.eyeClock) * globals.eyeRadius,
      globals.eyeHeight,
      Math.cos(this.eyeClock) * globals.eyeRadius,
    ];
    const target = [
      Math.sin(this.eyeClock + Math.PI) * globals.targetRadius,
      globals.targetHeight,
      Math.cos(this.eyeClock + Math.PI) * globals.targetRadius,
    ];
    const up = [0, 1, 0];

    const viewMatrix = mat4LookAt(eyePosition, target, up);
    const viewInverse = mat4Inverse(viewMatrix);
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const projection = mat4PerspectiveYFov(
      (globals.fieldOfView * Math.PI) / 180,
      aspect,
      1,
      25000
    );
    const viewProjection = mat4Multiply(projection, viewMatrix);

    this.frameUniformData.set(viewProjection, 0);
    this.frameUniformData.set(viewInverse, 16);
    this.frameUniformData.set(
      [eyePosition[0], eyePosition[1] + 20, eyePosition[2], 1],
      32
    );
    this.frameUniformData.set([1, 1, 1, 1], 36);
    this.frameUniformData.set(
      [
        this.currentState.globals.ambientRed,
        this.currentState.globals.ambientGreen,
        this.currentState.globals.ambientBlue,
        1,
      ],
      40
    );
    this.frameUniformData.set(
      [globals.fogRed, globals.fogGreen, globals.fogBlue, 1],
      44
    );
    const fogEnabled = this.currentState.options.fog ? 1 : 0;
    this.frameUniformData.set(
      [globals.fogPower, globals.fogMult, globals.fogOffset, fogEnabled],
      48
    );

    return this.frameUniformData;
  }

  updateFps(deltaSeconds) {
    this.fpsAccumulator += deltaSeconds;
    this.fpsFrameCount += 1;
    if (this.fpsAccumulator >= 0.25) {
      const fps = this.fpsFrameCount / this.fpsAccumulator;
      if (this.fpsElement) {
        this.fpsElement.textContent = fps.toFixed(1);
      }
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
      this.updateCanvasInfo();
    }
  }

  updateCanvasInfo() {
    if (this.canvasInfoElement) {
      this.canvasInfoElement.textContent = `${this.canvas.width} × ${this.canvas.height}`;
    }
  }

  setupDepthTextureIfNeeded() {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthView = this.depthTexture.createView();
    this.depthSize = [this.canvas.width, this.canvas.height];
  }
}
