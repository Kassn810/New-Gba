// src/cores/nes.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/nes.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.NESModule({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
