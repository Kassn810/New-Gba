import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// ------------------------------
// IndexedDB helpers
// ------------------------------
const DB_NAME = "multi-emulator-fs";
const STORE = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(value, key);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const keys = [];
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        keys.push(cursor.key);
        cursor.continue();
      } else resolve(keys);
    };
    req.onerror = () => reject(req.error);
  });
}

// ------------------------------
// System colors & helpers
// ------------------------------
const SYSTEM_COLORS = {
  gba: "bg-emerald-500",
  gb: "bg-green-700",
  gbc: "bg-green-600",
  snes: "bg-pink-500",
  nes: "bg-red-500",
  n64: "bg-blue-500",
  nds: "bg-orange-500",
  ps1: "bg-purple-500",
  "3ds": "bg-cyan-500",
};

const getSystem = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".gba")) return "gba";
  if (lower.endsWith(".gb")) return "gb";
  if (lower.endsWith(".gbc")) return "gbc";
  if (lower.endsWith(".smc") || lower.endsWith(".sfc")) return "snes";
  if (lower.endsWith(".nes")) return "nes";
  if (lower.endsWith(".n64") || lower.endsWith(".z64") || lower.endsWith(".v64")) return "n64";
  if (lower.endsWith(".nds")) return "nds";
  if (lower.endsWith(".iso") || lower.endsWith(".bin") || lower.endsWith(".cue")) return "ps1";
  if (lower.endsWith(".3ds") || lower.endsWith(".cia") || lower.endsWith(".zip")) return "3ds";
  return null;
};

// ------------------------------
// WASM Emulator Loaders (stubs for now)
// ------------------------------
async function loadGBA(container, rom, bios) {
  console.log("GBA loader called", rom, bios);
  // TODO: Add actual WASM core initialization here
}

async function load3DS(container, rom) {
  console.log("3DS loader called", rom);
  // TODO: Add Citra WASM loader here
}

async function loadPS1(container, rom) {
  console.log("PS1 loader called", rom);
  // TODO: Add PS1 WASM loader here
}

// Add more loaders for NDS, N64, NES, SNES if needed
async function loadNDS(container, rom) { console.log("NDS loader", rom); }
async function loadN64(container, rom) { console.log("N64 loader", rom); }
async function loadNES(container, rom) { console.log("NES loader", rom); }
async function loadSNES(container, rom) { console.log("SNES loader", rom); }

// ------------------------------
// Main App
// ------------------------------
export default function App() {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [roms, setRoms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const keys = await idbKeys();
      setRoms(keys.filter((k) => !k.toLowerCase().includes("bios")));
    })();
  }, []);

  const setStatus = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const onAddRom = async (files) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      await idbPut(f.name, f);
    }
    const keys = await idbKeys();
    setRoms(keys.filter((k) => !k.toLowerCase().includes("bios")));
    setStatus("ROMs added!");
  };

  const startEmulator = async (name) => {
    try {
      setLoading(true);
      setStatus(`Starting ${name}...`);
      const romBlob = await idbGet(name);
      if (!romBlob) throw new Error("ROM not found in storage");
      const system = getSystem(name);
      const container = containerRef.current;
      if (!container) return;

      // Clear previous
      container.innerHTML = "";

      switch (system) {
        case "gba":
          const bios = await idbGet("gba_bios.bin");
          await loadGBA(container, romBlob, bios);
          break;
        case "3ds":
          await load3DS(container, romBlob);
          break;
        case "ps1":
          await loadPS1(container, romBlob);
          break;
        case "nds": await loadNDS(container, romBlob); break;
        case "n64": await loadN64(container, romBlob); break;
        case "nes": await loadNES(container, romBlob); break;
        case "snes": await loadSNES(container, romBlob); break;
        default:
          setStatus("No emulator core available for this file type");
      }

      setSelected(name);
    } catch (e) {
      console.error(e);
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4">🎮 Multi-System Emulator</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-4 py-2 bg-green-600 rounded-lg">Add ROMs</button>
        <input ref={fileInputRef} type="file" accept=".gba,.gb,.gbc,.smc,.sfc,.nes,.n64,.z64,.v64,.nds,.iso,.bin,.cue,.3ds,.cia,.zip" multiple className="hidden" onChange={e => onAddRom(e.target.files)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {roms.map(name => {
          const system = getSystem(name);
          return (
            <div key={name} className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center">
              <span>{name}</span>
              {system && <span className={clsx("px-2 py-0.5 rounded-full text-black text-xs font-bold", SYSTEM_COLORS[system])}>{system.toUpperCase()}</span>}
              <button onClick={() => startEmulator(name)} className="ml-2 px-2 py-1 bg-blue-600 rounded-lg">Play</button>
            </div>
          );
        })}
      </div>

      <div ref={containerRef} className="w-full aspect-[4/3] bg-neutral-950 rounded-lg border border-neutral-700 flex items-center justify-center text-neutral-500">
        {selected ? `Playing: ${selected}` : "Select a ROM to start"}
      </div>

      {message && <div className="fixed bottom-4 right-4 bg-neutral-800 p-2 rounded-lg shadow">{message}</div>}
    </div>
  );
}
