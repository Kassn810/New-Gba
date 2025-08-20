// src/utils/fileHelpers.js
export const readROM = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const validateROM = (file, coreName) => {
  const extensions = {
    gba: [".gba"],
    gb: [".gb"],
    gbc: [".gbc"],
    nes: [".nes"],
    snes: [".sfc", ".smc"],
    n64: [".n64", ".z64"],
    ds: [".nds"],
    _3ds: [".3ds"],
    ps1: [".bin", ".iso"]
  };
  const valid = extensions[coreName]?.some((ext) => file.name.endsWith(ext));
  return valid;
};

