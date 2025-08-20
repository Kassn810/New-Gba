export default {
  init: async ({ canvas }) => {
    // Load the GBC WASM file
    const wasm = await fetch("/gbc.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your GBC WASM core needs them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the GBC/GB ROM into the WASM filesystem
    Module.FS_writeFile("game.gb", romData);
  },

  start: (Module) => {
    // Start the GBC emulator
    Module.callMain && Module.callMain(["game.gb"]);
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
