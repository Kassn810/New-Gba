// src/cores/gb.js
export default async function initGB(canvas, romBuffer) {
  try {
    const response = await fetch("/cores/gb.wasm");
    const bytes = await response.arrayBuffer();

    const memory = new WebAssembly.Memory({ initial: 256 });

    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        memory,
        abort: () => console.log("Abort called in GB core"),
      },
    });

    // Initialize emulator
    if (instance.exports.init) {
      instance.exports.init();
    }

    // Load ROM if supported
    if (instance.exports.loadROM) {
      const romPtr = instance.exports.loadROM(romBuffer.byteLength);
      const heap = new Uint8Array(instance.exports.memory.buffer, romPtr, romBuffer.byteLength);
      heap.set(new Uint8Array(romBuffer));
    }

    // Rendering loop
    function frame() {
      if (instance.exports.frame) {
        instance.exports.frame();
        // TODO: Render framebuffer to canvas
        // For now, it just cycles frames
      }
      requestAnimationFrame(frame);
    }
    frame();
  } catch (err) {
    console.error("Failed to init GB core:", err);
  }
}

