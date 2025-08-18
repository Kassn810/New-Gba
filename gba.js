import React, { useEffect, useRef, useState } from "react";

// GBA Emulator on Canvas using EmulatorJS (mGBA core) + IndexedDB-backed file system for ROMs & BIOS
// Plain JavaScript (no TypeScript syntax). Drag/drop .gba files, optional gba_bios.bin, files persist in IndexedDB.
// Emulator core assets are loaded from https://cdn.emulatorjs.org/stable/data/

// ------------------------------
// IndexedDB helpers (simple, dependency-free)
// ------------------------------
const DB_NAME = "gba-emulator-fs";
const STORE = "files"; // key: filename, value: Blob

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
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    tx.onerror = () => reject(tx.error);
    const keys = [];
    const req = tx.objectStore(STORE).openCursor();
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

async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).delete(key);
  });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------
// EmulatorJS config
// ------------------------------
const CDN = "https://cdn.emulatorjs.org";
const DATA_PATH = `${CDN}/stable/data/`;
const LOADER = `${CDN}/loader.js`;
const LOADER_ID = "ejs-loader-script";

function injectLoader(src) {
  // Remove any existing loader script with the same id
  const old = document.getElementById(LOADER_ID);
  if (old && old.parentNode) old.parentNode.removeChild(old);

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = LOADER_ID;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load emulator loader"));
    document.body.appendChild(s);
  });
}

export default function GBAEmulatorCanvas() {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const biosInputRef = useRef(null);

  const [roms, setRoms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [biosName, setBiosName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load catalog on mount
  useEffect(() => {
    (async () => {
      const keys = await idbKeys();
      setRoms(keys.filter((k) => String(k).toLowerCase().endsWith(".gba")));
      const bios = keys.find((k) => String(k).toLowerCase() === "gba_bios.bin");
      if (bios) setBiosName(bios);
    })();
  }, []);

  function setStatus(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  const onAddRom = async (files) => {
    if (!files || files.length === 0) return;
    const additions = [];
    for (const f of Array.from(files)) {
      if (!String(f.name).toLowerCase().endsWith(".gba")) continue;
      await idbPut(f.name, f);
      additions.push(f.name);
    }
    if (additions.length) {
      const keys = await idbKeys();
      setRoms(keys.filter((k) => String(k).toLowerCase().endsWith(".gba")));
      setStatus(`Added ${additions.length} ROM${additions.length > 1 ? "s" : ""}.`);
    } else {
      setStatus("No .gba files detected.");
    }
  };

  const onAddBios = async (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    await idbPut("gba_bios.bin", f);
    setBiosName("gba_bios.bin");
    setStatus("BIOS stored as gba_bios.bin");
  };

  const onDeleteRom = async (name) => {
    await idbDelete(name);
    const keys = await idbKeys();
    setRoms(keys.filter((k) => String(k).toLowerCase().endsWith(".gba")));
    if (selected === name) setSelected(null);
    setStatus(`Deleted ${name}`);
  };

  const onExportRom = async (name) => {
    const blob = await idbGet(name);
    if (blob) downloadBlob(name, blob);
  };

  const startEmulator = async (romName) => {
    try {
      setLoading(true);
      setStatus("Booting mGBA core...");

      const romBlob = await idbGet(romName);
      if (!romBlob) throw new Error("ROM not found in IndexedDB");
      const romURL = URL.createObjectURL(romBlob);

      let biosURL;
      if (biosName) {
        const biosBlob = await idbGet(biosName);
        if (biosBlob) biosURL = URL.createObjectURL(biosBlob);
      }

      if (containerRef.current) containerRef.current.innerHTML = "";

      // Configure EmulatorJS globals on window
      window.EJS_player = "#emu-container";
      window.EJS_core = "gba";
      window.EJS_pathtodata = DATA_PATH;
      window.EJS_gameUrl = romURL;
      if (biosURL) window.EJS_biosUrl = biosURL; else delete window.EJS_biosUrl;
      window.EJS_startOnLoaded = true;

      await injectLoader(`${LOADER}?v=${Date.now()}`);

      setSelected(romName);
      setStatus(`Running: ${romName}`);

      // Revoke object URLs a bit later to avoid breaking initial load
      setTimeout(() => {
        URL.revokeObjectURL(romURL);
        if (biosURL) URL.revokeObjectURL(biosURL);
      }, 10000);
    } catch (e) {
      console.error(e);
      setStatus(e && e.message ? e.message : "Failed to start emulator");
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop support
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => {
      prevent(e);
      const files = (e.dataTransfer && e.dataTransfer.files) || null;
      onAddRom(files);
    };

    el.addEventListener("dragover", prevent);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("drop", onDrop);
    };
  }, [containerRef]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Library + Controls */}
        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-2xl font-bold">GBA Emulator</h1>
          <p className="text-sm text-neutral-400">Drop .gba files anywhere or use the buttons. Files persist in your browser (IndexedDB). Optional: add <code>gba_bios.bin</code> for maximum compatibility.</p>

          <div className="bg-neutral-900 rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 shadow">➕ Add ROMs</button>
              <input ref={fileInputRef} type="file" accept=".gba" multiple className="hidden" onChange={(e) => onAddRom(e.target.files)} />
              <button onClick={() => biosInputRef.current && biosInputRef.current.click()} className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 shadow">🧬 Add BIOS</button>
              <input ref={biosInputRef} type="file" accept=".bin" className="hidden" onChange={(e) => onAddBios(e.target.files)} />
            </div>
            <div className="text-xs text-neutral-400">{biosName ? `BIOS: ${biosName}` : "No BIOS stored (optional)"}</div>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-4 shadow">
            <h2 className="font-semibold mb-2">Library</h2>
            {roms.length === 0 ? (
              <div className="text-neutral-400 text-sm">No ROMs yet. Add some .gba files.</div>
            ) : (
              <ul className="divide-y divide-neutral-800">
                {roms.map((name) => (
                  <li key={name} className="py-2 flex items-center justify-between gap-2">
                    <div className="truncate" title={name}>{name}</div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEmulator(name)} className="px-2 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm">Play</button>
                      <button onClick={() => onExportRom(name)} className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm">Export</button>
                      <button onClick={() => onDeleteRom(name)} className="px-2 py-1 rounded-xl bg-red-800 hover:bg-red-700 text-sm">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-neutral-900 rounded-2xl p-4 shadow text-sm space-y-2">
            <h2 className="font-semibold">Tips</h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-300">
              <li>Fullscreen and gamepad support are available via the emulator toolbar (hover over the game area).</li>
              <li>Saves (battery RAM and states) persist automatically in your browser.</li>
              <li>You can export/import ROMs here; saves are managed by the emulator core.</li>
              <li>If a game doesn’t start, try adding a valid <code>gba_bios.bin</code>.</li>
            </ul>
          </div>
        </div>

        {/* Right: Emulator Stage */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Stage</div>
              <div className="text-sm text-neutral-400">{loading ? "Loading core..." : selected ? `Now playing: ${selected}` : "Idle"}</div>
            </div>
            <div
              id="emu-container"
              ref={containerRef}
              className="relative w-full aspect-[4/3] rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500"
            >
              <div className="pointer-events-none select-none text-center px-6">
                Drop .gba here or pick a ROM from your library.
              </div>
            </div>
            {message && (
              <div className="mt-3 text-sm text-neutral-300">{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
