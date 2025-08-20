// src/cores/snes.js
export default async function initSNES(canvas, romBuffer) {
  const response = await fetch("/cores/snes.wasm");
  const bytes = await response.arrayBuffer();
  const memory = new WebAssembly.Memory({ initial: 256 });

  const { instance } = await WebAssembly.instantiate(bytes, { env: { memory } });
  if (instance.exports.init) instance.exports.init();
  if (instance.exports.loadROM) {
    const romPtr = instance.exports.loadROM(romBuffer.byteLength);
    const heap = new Uint8Array(instance.exports.memory.buffer, romPtr, romBuffer.byteLength);
    heap.set(new Uint8Array(romBuffer));
  }

  const frameInterval = 1000 / 60.098;
  const loop = setInterval(() => instance.exports.frame && instance.exports.frame(), frameInterval);
  return () => clearInterval(loop);
}
