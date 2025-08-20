// src/cores/_3ds.js
export default {
  init: async ({ canvas, bottomCanvas }) => {
    const response = await fetch("/cores/3ds.wasm");
    const buffer = await response.arrayBuffer();

    const module = await window._3DSModule({
      wasmBinary: buffer,
      canvas: canvas,
      bottomCanvas: bottomCanvas
    });

    return module;
  }
};
