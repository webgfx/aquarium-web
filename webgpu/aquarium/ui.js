import {
  optionDefinitions,
  fishCountPresets,
  viewPresets,
} from "./config.js";

const sliderConfig = [
  { group: "globals", key: "speed", label: "Speed", min: 0, max: 4, step: 0.001 },
  { group: "globals", key: "targetHeight", label: "Target Height", min: -50, max: 150, step: 0.001 },
  { group: "globals", key: "targetRadius", label: "Target Radius", min: 0, max: 200, step: 0.001 },
  { group: "globals", key: "eyeHeight", label: "Eye Height", min: 0, max: 150, step: 0.001 },
  { group: "globals", key: "eyeRadius", label: "Eye Radius", min: 0, max: 200, step: 0.001 },
  { group: "globals", key: "eyeSpeed", label: "Eye Speed", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "fieldOfView", label: "Field of View", min: 1, max: 179, step: 0.01 },
  { group: "globals", key: "ambientRed", label: "Ambient Red", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "ambientGreen", label: "Ambient Green", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "ambientBlue", label: "Ambient Blue", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "fogPower", label: "Fog Power", min: 0, max: 50, step: 0.001 },
  { group: "globals", key: "fogMult", label: "Fog Mult", min: 0, max: 10, step: 0.001 },
  { group: "globals", key: "fogOffset", label: "Fog Offset", min: 0, max: 3, step: 0.0001 },
  { group: "globals", key: "fogRed", label: "Fog Red", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "fogGreen", label: "Fog Green", min: 0, max: 1, step: 0.0001 },
  { group: "globals", key: "fogBlue", label: "Fog Blue", min: 0, max: 1, step: 0.0001 },
  { group: "fish", key: "fishHeightRange", label: "Fish Height Range", min: 0, max: 3, step: 0.0001 },
  { group: "fish", key: "fishHeight", label: "Fish Height", min: 0, max: 50, step: 0.001 },
  { group: "fish", key: "fishSpeed", label: "Fish Speed", min: 0, max: 2, step: 0.0001 },
  { group: "fish", key: "fishOffset", label: "Fish Offset", min: 0, max: 2, step: 0.0001 },
  { group: "fish", key: "fishXClock", label: "Fish X Clock", min: 0, max: 2, step: 0.0001 },
  { group: "fish", key: "fishYClock", label: "Fish Y Clock", min: 0, max: 2, step: 0.0001 },
  { group: "fish", key: "fishZClock", label: "Fish Z Clock", min: 0, max: 2, step: 0.0001 },
  { group: "fish", key: "fishTailSpeed", label: "Fish Tail Speed", min: 0, max: 30, step: 0.001 },
  { group: "innerConst", key: "refractionFudge", label: "Refraction Fudge", min: 0, max: 50, step: 0.001 },
  { group: "innerConst", key: "eta", label: "Eta", min: 0, max: 1.2, step: 0.0001 },
  { group: "innerConst", key: "tankColorFudge", label: "Tank Color Fudge", min: 0, max: 2, step: 0.0001 },
];

function createSlider({ label, min, max, step, value, onInput }) {
  const wrapper = document.createElement("div");
  wrapper.className = "slider-row";

  const header = document.createElement("header");
  const nameSpan = document.createElement("span");
  nameSpan.textContent = label;
  const valueSpan = document.createElement("span");
  valueSpan.textContent = value.toFixed(3);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);

  slider.addEventListener("input", () => {
    const numericValue = parseFloat(slider.value);
    valueSpan.textContent = numericValue.toFixed(3);
    onInput(numericValue);
  });

  header.append(nameSpan, valueSpan);
  wrapper.append(header, slider);
  return wrapper;
}

export function setupUI(initialState) {
  const mutableState = {
    globals: structuredClone(initialState.globals),
    fish: structuredClone(initialState.fish),
    innerConst: structuredClone(initialState.innerConst),
    options: { ...initialState.options },
    fishCount: initialState.fishCount,
    viewIndex: 0,
    listeners: new Set(),
  };

  const optionContainer = document.getElementById("optionToggles");
  optionContainer.textContent = "";

  const toggles = document.createElement("div");
  toggles.className = "option-grid";
  optionDefinitions.forEach((optionDef) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!mutableState.options[optionDef.id];
    checkbox.addEventListener("change", () => {
      mutableState.options[optionDef.id] = checkbox.checked;
      publish();
    });
    label.append(checkbox, document.createTextNode(optionDef.label));
    toggles.append(label);
  });
  optionContainer.append(toggles);

  const sliderRoot = document.getElementById("sliderControls");
  sliderRoot.textContent = "";
  sliderConfig.forEach((sliderDef) => {
    const value = mutableState[sliderDef.group][sliderDef.key];
    const slider = createSlider({
      label: sliderDef.label,
      min: sliderDef.min,
      max: sliderDef.max,
      step: sliderDef.step,
      value,
      onInput: (newValue) => {
        mutableState[sliderDef.group][sliderDef.key] = newValue;
        publish();
      },
    });
    sliderRoot.append(slider);
  });

  const presetRoot = document.getElementById("fishPresetButtons");
  presetRoot.textContent = "";
  fishCountPresets.forEach((preset) => {
    const button = document.createElement("button");
    button.textContent = preset.toLocaleString();
    button.addEventListener("click", () => {
      mutableState.fishCount = preset;
      document.getElementById("fishCount").textContent = preset.toLocaleString();
      publish();
    });
    presetRoot.append(button);
  });

  document.getElementById("fishCount").textContent = mutableState.fishCount.toLocaleString();

  const toggleViewButton = document.getElementById("toggleView");
  toggleViewButton.addEventListener("click", () => {
    mutableState.viewIndex = (mutableState.viewIndex + 1) % viewPresets.length;
    applyViewPreset(mutableState.viewIndex);
    publish();
  });

  const fishPresetSection = document.getElementById("fishPresetSection");
  const toggleOptionsButton = document.getElementById("toggleOptions");
  
  // Hide options by default
  optionContainer.style.display = "none";
  
  toggleOptionsButton.addEventListener("click", () => {
    const isHidden = optionContainer.style.display === "none";
    optionContainer.style.display = isHidden ? "" : "none";
  });

  const toggleAdvancedButton = document.getElementById("toggleAdvanced");
  
  // Hide advanced by default
  sliderRoot.style.display = "none";
  
  toggleAdvancedButton.addEventListener("click", () => {
    const isHidden = sliderRoot.style.display === "none";
    sliderRoot.style.display = isHidden ? "" : "none";
  });

  function applyViewPreset(index) {
    const preset = viewPresets[index];
    if (!preset) return;
    Object.assign(mutableState.globals, preset.globals);
    refreshSliderValues();
  }

  function refreshSliderValues() {
    const sliderElements = sliderRoot.querySelectorAll(".slider-row");
    sliderConfig.forEach((sliderDef, idx) => {
      const row = sliderElements[idx];
      if (!row) return;
      const slider = row.querySelector("input[type='range']");
      const label = row.querySelector("header span:last-child");
      const value = mutableState[sliderDef.group][sliderDef.key];
      slider.value = String(value);
      label.textContent = value.toFixed(3);
    });
  }

  function publish() {
    const snapshot = {
      globals: structuredClone(mutableState.globals),
      fish: structuredClone(mutableState.fish),
      innerConst: structuredClone(mutableState.innerConst),
      options: { ...mutableState.options },
      fishCount: mutableState.fishCount,
      viewIndex: mutableState.viewIndex,
    };
    mutableState.listeners.forEach((listener) => listener(snapshot));
  }

  return {
    subscribe(listener) {
      mutableState.listeners.add(listener);
      listener({
        globals: structuredClone(mutableState.globals),
        fish: structuredClone(mutableState.fish),
        innerConst: structuredClone(mutableState.innerConst),
        options: { ...mutableState.options },
        fishCount: mutableState.fishCount,
        viewIndex: mutableState.viewIndex,
      });
      return () => mutableState.listeners.delete(listener);
    },
    applyViewPreset,
    getState: () => ({
      globals: structuredClone(mutableState.globals),
      fish: structuredClone(mutableState.fish),
      innerConst: structuredClone(mutableState.innerConst),
      options: { ...mutableState.options },
      fishCount: mutableState.fishCount,
      viewIndex: mutableState.viewIndex,
    }),
  };
}
