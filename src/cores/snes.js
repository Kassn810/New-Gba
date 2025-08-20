export default {
  init: async ({ canvas }) => {
    // Load the SNES WASM file
    const wasm = await fetch("/snes.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }), // SNES needs more memory than NES
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your SNES core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the SNES ROM into the WASM filesystem
    Module.FS_writeFile("game.sfc", romData); // Accept .sfc or .smc
  },

  start: (Module) => {
    // Start the SNES emulator
    Module.callMain && Module.callMain(["game.sfc"]);
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
