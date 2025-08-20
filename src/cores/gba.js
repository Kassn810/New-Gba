// src/cores/gba.js
export default class GBA {
  constructor() {
    this.instance = null;
    this.memory = null;
  }

  async init({ wasmPath, canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    const wasmBuffer = await fetch(wasmPath).then(r => r.arrayBuffer());
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        abort: () => console.error("WASM aborted"),
      },
    });

    this.instance = wasmModule.instance;
    this.memory = new Uint8Array(this.instance.exports.memory.buffer);
  }

  async loadROM(romBuffer) {
    const romBytes = new Uint8Array(romBuffer);
    this.romPtr = this.instance.exports._malloc(romBytes.length);
    this.memory.set(romBytes, this.romPtr);
  }

  start() {
    if (this.instance.exports._start) {
      this.instance.exports._start(this.romPtr, 0); // adjust length if needed
    }
    // You may need a render loop here if your core exposes a framebuffer
  }

  stop() {
    if (this.romPtr) this.instance.exports._free(this.romPtr);
    this.instance = null;
    this.memory = null;
  }
}
