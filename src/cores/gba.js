// src/cores/gba.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/gba.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.GBAModule({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
