export default {
  init: async ({ canvas }) => {
    // Load the GB WASM file
    const wasm = await fetch("/gb.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 128 }), // GB needs less memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your GB core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the GB ROM into the WASM filesystem
    Module.FS_writeFile("game.gb", romData);
  },

  start: (Module) => {
    // Start the GB emulator
    Module.callMain && Module.callMain(["game.gb"]);
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
