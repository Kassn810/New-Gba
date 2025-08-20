// src/cores/gba.js
export default async function initGBA(canvas, romBuffer) {
  try {
    const response = await fetch("/cores/gba.wasm");
    const bytes = await response.arrayBuffer();

    const memory = new WebAssembly.Memory({ initial: 256 });

    const { instance } = await WebAssembly.instantiate(bytes, {
      env: {
        memory,
        abort: () => console.log("Abort called in GBA core"),
      },
    });

    // Initialize emulator if function exists
    if (instance.exports.init) {
      instance.exports.init();
    }

    // Load ROM
    if (instance.exports.loadROM) {
      const romPtr = instance.exports.loadROM(romBuffer.byteLength);
      const heap = new Uint8Array(instance.exports.memory.buffer, romPtr, romBuffer.byteLength);
      heap.set(new Uint8Array(romBuffer));
    }

    // Run frames
    function frame() {
      if (instance.exports.frame) {
        instance.exports.frame();
        // TODO: draw framebuffer -> canvas
      }
      requestAnimationFrame(frame);
    }
    frame();
  } catch (err) {
    console.error("Failed to init GBA core:", err);
  }
}
