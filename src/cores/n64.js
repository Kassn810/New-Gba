export default {
  init: async ({ canvas }) => {
    // Load the N64 WASM file
    const wasm = await fetch("/n64.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 512 }), // N64 needs more memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your N64 core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the N64 ROM into the WASM filesystem
    Module.FS_writeFile("game.n64", romData);
  },

  start: (Module) => {
    // Start the N64 emulator
    Module.callMain && Module.callMain(["game.n64"]);
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
