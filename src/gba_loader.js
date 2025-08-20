// src/gba_loader.js
export default async function initGBA({ canvas }) {
  // Make sure gba.wasm is in the public folder or served correctly
  const wasm = await fetch("/gba.wasm");
  const buffer = await wasm.arrayBuffer();
  const module = await WebAssembly.instantiate(buffer, {
    env: {
      // Provide necessary imports if any
      memory: new WebAssembly.Memory({ initial: 256 }),
      table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
      abort: console.log,
    },
  });

  const instance = module.instance.exports;

  // Example: set up a very simple API
  return {
    loadROM: (rom) => {
      if (instance.loadROM) instance.loadROM(rom);
    },
    start: () => {
      if (instance.start) instance.start();
    },
    stop: () => {
      if (instance.stop) instance.stop();
    },
  };
}
