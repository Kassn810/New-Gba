// src/utils/emulatorLoader.js

let emulatorInstance = null;

// Map system name → JS wrapper module
const CORE_WRAPPERS = {
  gba: "../cores/gba.js",
  gb: "../cores/gb.js",
  gbc: "../cores/gbc.js",
  nes: "../cores/nes.js",
  snes: "../cores/snes.js",
  n64: "../cores/n64.js",
  ds: "../cores/ds.js",
  "3ds": "../cores/3ds.js",
  ps: "../cores/ps.js",
};

export async function loadEmulator(romFile, system = "gba", canvas) {
  try {
    console.log(`Loading ${system.toUpperCase()} emulator...`);

    // Dynamically import the JS wrapper for the selected system
    const wrapperModule = await import(CORE_WRAPPERS[system]);
    const Core = wrapperModule.default;

    // Create a new instance of the emulator
    emulatorInstance = new Core();

    // Initialize the emulator with the WASM path and canvas
    const wasmPath = `/cores/${system}.wasm`;
    await emulatorInstance.init({ canvas, wasmPath });

    // Load the ROM
    const romArrayBuffer = await romFile.arrayBuffer();
    await emulatorInstance.loadROM(romArrayBuffer);

    // Start the emulator
    if (emulatorInstance.start) emulatorInstance.start();

    console.log(`${system.toUpperCase()} emulator loaded!`);
  } catch (err) {
    console.error("Failed to load emulator:", err);
  }
}

export function stopEmulator() {
  if (emulatorInstance) {
    if (emulatorInstance.stop) emulatorInstance.stop();
    emulatorInstance = null;
    console.log("Emulator stopped");
  }
}
