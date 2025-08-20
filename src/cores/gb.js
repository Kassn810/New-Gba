// src/cores/gb.js
export default async function initGB(canvas, romBuffer) {
  const response = await fetch("/cores/gb.wasm");
  const bytes = await response.arrayBuffer();
  const memory = new WebAssembly.Memory({ initial: 256 });

  const { instance } = await WebAssembly.instantiate(bytes, { env: { memory } });
  if (instance.exports.init) instance.exports.init();
  if (instance.exports.loadROM) {
    const romPtr = instance.exports.loadROM(romBuffer.byteLength);
    const heap = new Uint8Array(instance.exports.memory.buffer, romPtr, romBuffer.byteLength);
    heap.set(new Uint8Array(romBuffer));
  }

  const frameInterval = 1000 / 59.727;
  const loop = setInterval(() => instance.exports.frame && instance.exports.frame(), frameInterval);
  return () => clearInterval(loop);
}
