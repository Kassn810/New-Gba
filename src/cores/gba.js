export default {
  init: async ({ canvas }) => {
    // Load the GBA WASM file
    const wasm = await fetch("/gba.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // You can add extra imports here if your WASM needs them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the GBA ROM into the WASM filesystem
    Module.FS_writeFile("game.gba", romData);
  },

  start: (Module) => {
    // Start the emulator
    Module.callMain && Module.callMain(["game.gba"]);
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
