// src/cores/snes.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/snes.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.SNESModule({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
