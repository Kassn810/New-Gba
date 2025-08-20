export default {
  init: async ({ canvas }) => {
    // Load the NES WASM file
    const wasm = await fetch("/nes.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 128 }), // NES requires moderate memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your NES core needs them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the NES ROM into the WASM filesystem
    Module.FS_writeFile("game.nes", romData);
  },

  start: (Module) => {
    // Start the NES emulator
    Module.callMain && Module.callMain(["game.nes"]);
  },

  stop: (Module) => {
    // Stop the emulator if supported
    Module.exit && Module.exit();
  },

  saveState: (Module) => {
    // Return a snapshot of WASM memory
    return new Uint8Array(Module.HEAPU8.buffer);
  },

  loadState: (Module, stateData) => {
    // Restore a snapshot
    Module.HEAPU8.set(stateData);
  },
};
