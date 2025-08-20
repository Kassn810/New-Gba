// src/coreManager.js

class CoreManager {
  constructor() {
    this.cores = {};
    this.activeCore = null;
    this.canvas = null;
    this.audioCtx = null;
  }

  async loadCore(name, wasmPath) {
    if (this.cores[name]) return this.cores[name]; // already loaded
    console.log(`Loading ${name} core...`);

    const response = await fetch(wasmPath);
    const buffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(buffer, this.getImports());
    
    this.cores[name] = wasmModule.instance.exports;
    console.log(`${name} core loaded.`);
    return this.cores[name];
  }

  getImports() {
    // Provide common imports for WASM cores
    return {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
        console_log: (ptr, len) => {
          // Example logging function if cores export memory
          console.log(`WASM: ${ptr}, len: ${len}`);
        }
      }
    };
  }

  setCanvas(canvas) {
    this.canvas = canvas;
  }

  setAudioContext(audioCtx) {
    this.audioCtx = audioCtx;
  }

  async runCore(name, romBuffer) {
    if (!this.cores[name]) throw new Error(`${name} core not loaded`);
    this.activeCore = this.cores[name];

    // Example: initialize core with ROM
    if (this.activeCore.loadROM) {
      const romPtr = this.activeCore.malloc(romBuffer.byteLength);
      const mem = new Uint8Array(this.activeCore.memory.buffer, romPtr, romBuffer.byteLength);
      mem.set(new Uint8Array(romBuffer));
      this.activeCore.loadROM(romPtr, romBuffer.byteLength);
    }

    this.startFrameLoop();
  }

  startFrameLoop() {
    if (!this.activeCore) return;
    const fps = this.activeCore.nativeFPS || 60;
    const interval = 1000 / fps;

    const step = () => {
      if (!this.activeCore) return;
      if (this.activeCore.runFrame) this.activeCore.runFrame();
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  stopCore() {
    this.activeCore = null;
  }
}

export default new CoreManager();
