import { createContext } from "../core/gpu-context.js";
import { loadAquariumAssets } from "../core/loader.js";
import { setupUI } from "./ui.js";
import { AquariumRenderer } from "../core/renderer.js";
import { AQUARIUM_BASE } from "./path-config.js";
import {
  defaultGlobals,
  defaultFish,
  defaultInnerConst,
  optionDefinitions,
  fishCountPresets,
  aquariumConfig,
} from "./config.js";

async function boot() {
  const canvas = document.getElementById("aquarium");
  if (!navigator.gpu) {
    const message = document.createElement("div");
    message.textContent = "WebGPU is not supported in this browser.";
    message.style.position = "absolute";
    message.style.top = "50%";
    message.style.left = "50%";
    message.style.transform = "translate(-50%, -50%)";
    message.style.background = "rgba(0,0,0,0.8)";
    message.style.padding = "20px";
    message.style.borderRadius = "12px";
    message.style.fontSize = "16px";
    document.body.appendChild(message);
    return;
  }

  const context = await createContext(canvas);
  const uiState = setupUI({
    globals: structuredClone(defaultGlobals),
    fish: structuredClone(defaultFish),
    innerConst: structuredClone(defaultInnerConst),
    options: Object.fromEntries(
      optionDefinitions.map((opt) => [opt.id, opt.defaultValue]),
    ),
    fishCount: fishCountPresets[2],
  });

  const assetPackage = await loadAquariumAssets(
    { ...aquariumConfig, aquariumRoot: AQUARIUM_BASE },
    context.device,
  );

  const renderer = new AquariumRenderer({
    context,
    assets: assetPackage,
    ui: uiState,
  });

  await renderer.initialize();
  renderer.start();
}

boot().catch((err) => {
  console.error(err);
  const msg = document.createElement("pre");
  msg.textContent = `Failed to initialize WebGPU Aquarium:\n${err}`;
  msg.style.position = "absolute";
  msg.style.top = "16px";
  msg.style.left = "16px";
  msg.style.padding = "12px";
  msg.style.background = "rgba(0,0,0,0.65)";
  msg.style.color = "#ff8080";
  msg.style.maxWidth = "420px";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.fontFamily = "monospace";
  document.body.appendChild(msg);
});
