// src/utils/saveState.js
export const saveState = (coreName, module) => {
  if (!module?.saveState) return;
  const state = module.saveState();
  localStorage.setItem(`state_${coreName}`, JSON.stringify(Array.from(state)));
  console.log(`${coreName} state saved`);
};

export const loadState = (coreName, module) => {
  if (!module?.loadState) return;
  const saved = localStorage.getItem(`state_${coreName}`);
  if (saved) {
    const stateArray = Uint8Array.from(JSON.parse(saved));
    module.loadState(stateArray);
    console.log(`${coreName} state loaded`);
  }
};

