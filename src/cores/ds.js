export default {
  init: async ({ canvas }) => {
    // Load the DS WASM file
    const wasm = await fetch("/ds.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 512 }), // DS needs more memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your DS core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the DS ROM into the WASM filesystem
    Module.FS_writeFile("game.nds", romData);
  },

  start: (Module) => {
    // Start the DS emulator
    Module.callMain && Module.callMain(["game.nds"]);
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
