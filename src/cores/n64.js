// src/cores/n64.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/n64.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.N64Module({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};
