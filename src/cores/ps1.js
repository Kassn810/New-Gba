// src/cores/ps1.js
export default {
  init: async ({ canvas }) => {
    const response = await fetch("/cores/ps1.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window.PS1Module({
      wasmBinary: buffer,
      canvas: canvas
    });

    return module;
  }
};

