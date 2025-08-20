export default {
  init: async ({ canvas }) => {
    // Load the 3DS WASM file
    const wasm = await fetch("/3ds.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 1024 }), // 3DS needs a lot of memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your 3DS WASM core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the 3DS ROM into the WASM filesystem
    Module.FS_writeFile("game.3ds", romData);
  },

  start: (Module) => {
    // Start the 3DS emulator
    Module.callMain && Module.callMain(["game.3ds"]);
  },

  stop: (Module) => {
    // Stop the emulator if the function exists
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
