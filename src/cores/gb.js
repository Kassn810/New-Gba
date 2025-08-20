// src/cores/gba.js
export default class GBA {
  constructor() {
    this.instance = null;
    this.memory = null;
    this.romPtr = 0;
    this.romSize = 0;
    this.canvas = null;
    this.ctx = null;
    this.imageData = null;
    this.animationFrame = null;
  }

  async init({ wasmPath, canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.imageData = this.ctx.createImageData(240, 160);

    const wasmBuffer = await fetch(wasmPath).then((r) => r.arrayBuffer());
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        abort: () => console.error("WASM aborted"),
      },
    });

    this.instance = wasmModule.instance;
    this.memory = new Uint8Array(this.instance.exports.memory.buffer);
  }

  loadROM(romBuffer) {
    if (!this.instance) throw new Error("WASM not initialized");

    const romBytes = new Uint8Array(romBuffer);
    this.romSize = romBytes.length;
    this.romPtr = this.instance.exports._malloc(this.romSize);
    this.memory.set(romBytes, this.romPtr);
  }

  start() {
    if (!this.instance) return;

    if (this.instance.exports._start) {
      this.instance.exports._start(this.romPtr, this.romSize);
    }

    const render = () => {
      if (this.instance.exports.get_framebuffer) {
        const fbPtr = this.instance.exports.get_framebuffer();
        if (fbPtr) {
          const fb = this.memory.subarray(fbPtr, fbPtr + 240 * 160 * 4);
          this.imageData.data.set(fb);
          this.ctx.putImageData(this.imageData, 0, 0);
        }
      }
      this.animationFrame = requestAnimationFrame(render);
    };

    render();
  }

  stop() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.romPtr) this.instance.exports._free(this.romPtr);

    this.instance = null;
    this.memory = null;
    this.romPtr = 0;
    this.romSize = 0;
  }
}
