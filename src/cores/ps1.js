export default {
  init: async ({ canvas }) => {
    // Load the PS1 WASM file
    const wasm = await fetch("/ps1.wasm");
    const buffer = await wasm.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 512 }), // PS1 needs more memory
        table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        abort: console.log,
      },
      // Add extra imports if your PS1 core requires them
    });
    return module.instance.exports;
  },

  loadROM: (Module, romData) => {
    // Write the PS1 ROM into the WASM filesystem
    Module.FS_writeFile("game.iso", romData); // Could also be .bin
  },

  start: (Module) => {
    // Start the PS1 emulator
    Module.callMain && Module.callMain(["game.iso"]);
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
