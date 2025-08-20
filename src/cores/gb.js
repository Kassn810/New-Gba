// src/cores/gb.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/gb.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.GBModule({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
