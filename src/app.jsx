import React, { useState, useEffect, useRef } from "react";

// IndexedDB helpers (same as before)
async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("multi-emulator-fs", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const keys = [];
    const req = tx.objectStore("files").openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        keys.push(cursor.key);
        cursor.continue();
      } else {
        resolve(keys);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Loader injection for WASM cores
function injectLoader(src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("emulator-loader");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "emulator-loader";
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load emulator loader"));
    document.body.appendChild(script);
  });
}

// Map extensions to system
const SYSTEMS = {
  gba: ["gba"],
  gb: ["gb"],
  gbc: ["gbc"],
  nes: ["nes"],
  snes: ["smc", "sfc"],
  n64: ["n64", "z64", "v64"],
  nds: ["nds"],
  ps1: ["iso", "bin", "cue"],
  "3ds": ["3ds"],
};
const SYSTEM_COLORS = {
  gba: "bg-emerald-500",
  gb: "bg-green-700",
  gbc: "bg-green-600",
  nes: "bg-red-500",
  snes: "bg-pink-500",
  n64: "bg-blue-500",
  nds: "bg-orange-500",
  ps1: "bg-purple-500",
  "3ds": "bg-cyan-500",
};
function getSystem(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return Object.entries(SYSTEMS).find(([k, arr]) => arr.includes(ext))?.[0] || null;
}

export default function App() {
  const [roms, setRoms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [biosName, setBiosName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const biosInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const keys = await idbKeys();
      setRoms(keys.filter(k => !k.toLowerCase().includes("bios")));
      const bios = keys.find(k => k.toLowerCase().includes("bios"));
      if (bios) setBiosName(bios);
    })();
  }, []);

  const setStatus = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const onAddRom = async (files) => {
    if (!files) return;
    const added = [];
    for (const f of Array.from(files)) {
      await idbPut(f.name, f);
      added.push(f.name);
    }
    if (added.length) {
      const keys = await idbKeys();
      setRoms(keys.filter(k => !k.toLowerCase().includes("bios")));
      setStatus(`Added ${added.length} ROM${added.length>1?"s":""}`);
    }
  };

  const onAddBios = async (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    await idbPut("bios.bin", f);
    setBiosName("bios.bin");
    setStatus("BIOS stored");
  };

  const startEmulator = async (romName) => {
    try {
      setLoading(true);
      setStatus(`Starting ${romName}...`);

      const romBlob = await idbGet(romName);
      if (!romBlob) throw new Error("ROM not found");

      const system = getSystem(romName);
      const romURL = URL.createObjectURL(romBlob);

      // Set container empty
      if (containerRef.current) containerRef.current.innerHTML = "";

      // Assign system-specific globals
      window.EJS_player = "#emu-container";
      window.EJS_core = system;
      window.EJS_gameUrl = romURL;
      if (biosName) {
        const biosBlob = await idbGet(biosName);
        if (biosBlob) window.EJS_biosUrl = URL.createObjectURL(biosBlob);
      }
      window.EJS_startOnLoaded = true;

      // Load loader dynamically
      await injectLoader(`https://cdn.emulatorjs.org/stable/loader.js?v=${Date.now()}`);

      set
