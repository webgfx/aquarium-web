import { sceneDefinitions } from "./scene-registry.js";
import { AquariumModel } from "./model.js";

function typedArrayFor(type, data) {
  switch (type) {
    case "Float32Array":
      return new Float32Array(data);
    case "Uint16Array":
      return new Uint16Array(data);
    case "Uint32Array":
      return new Uint32Array(data);
    default:
      throw new Error(`Unsupported typed array type: ${type}`);
  }
}

export async function loadAquariumAssets(config, device) {
  const baseUrl = config.aquariumRoot ?? "./";
  const scenePromises = sceneDefinitions.map(async (scene) => {
    const url = new URL(`assets/${scene.name}.js`, baseUrl);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load scene ${scene.name}: ${response.status}`);
    }
    const jsonText = await response.text();
    const data = JSON.parse(jsonText);

    const models = data.models.map((model) => {
      const fields = {};
      for (const [fieldName, field] of Object.entries(model.fields)) {
        fields[fieldName] = {
          ...field,
          data: typedArrayFor(field.type, field.data),
        };
      }
      const typedModel = {
        ...model,
        fields,
      };
      return new AquariumModel(device, typedModel);
    });

    return {
      name: scene.name,
      definition: scene,
      models,
    };
  });

  const scenes = await Promise.all(scenePromises);

  const placementResponse = await fetch(new URL("assets/PropPlacement.js", baseUrl));
  if (!placementResponse.ok) {
    throw new Error(`Failed to load PropPlacement.js: ${placementResponse.status}`);
  }
  const placementData = await placementResponse.json();

  return { baseUrl, scenes, placement: placementData };
}
