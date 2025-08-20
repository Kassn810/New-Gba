// src/cores/ps1.js
export default async function initPS1(canvas, romBuffer) {
  try {
    const response = await fetch("/cores/ps1.wasm");
    const bytes = await response.arrayBuffer();

    const memory = new WebAssembly.Memory({ initial: 2048 });

    const { instance } = await WebAssembly.instantiate(bytes, {
      env: { memory, abort: () => console.log("Abort called in PS1 core") },
    });

    if (instance.exports.init) instance.exports.init();

    if (instance.exports.loadROM) {
      const romPtr = instance.exports.loadROM(romBuffer.byteLength);
      const heap = new Uint8Array(instance.exports.memory.buffer, romPtr, romBuffer.byteLength);
      heap.set(new Uint8Array(romBuffer));
    }

    function frame() {
      if (instance.exports.frame) instance.exports.frame();
      requestAnimationFrame(frame);
    }
    frame();
  } catch (err) {
    console.error("Failed to init PS1 core:", err);
  }
}
