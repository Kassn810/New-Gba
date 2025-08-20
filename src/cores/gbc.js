// src/cores/gbc.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/gbc.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.GBCModule({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
