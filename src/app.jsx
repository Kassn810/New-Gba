import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx"; // optional, for conditional class names

// IndexedDB helpers, injectLoader, startEmulator etc remain unchanged
// ... keep the same IDB and emulator functions as before ...

const SYSTEM_COLORS = {
  gba: "bg-emerald-500",
  gb: "bg-green-700",
  gbc: "bg-green-600",
  snes: "bg-pink-500",
  nes: "bg-red-500",
  n64: "bg-blue-500",
  nds: "bg-orange-500",
  ps1: "bg-purple-500",
  "3ds": "bg-cyan-500",  // New 3DS color
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
  if (lower.endsWith(".3ds")) return "3ds";   // New 3DS support
  return null;
};


export default function App() {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const biosInputRef = useRef(null);

  const [roms, setRoms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [biosName, setBiosName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load ROMs from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const keys = await idbKeys();
      setRoms(keys.filter((k) => !k.toLowerCase().includes("bios")));
      const bios = keys.find((k) => k.toLowerCase() === "gba_bios.bin");
      if (bios) setBiosName(bios);
    })();
  }, []);

  const setStatus = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Add ROMs / BIOS / Delete / Export / Start Emulator functions remain unchanged
  // ... reuse the previous App.jsx logic here ...

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Library */}
        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-3xl font-bold mb-2">🎮 Multi-System Emulator</h1>
          <p className="text-neutral-400 text-sm mb-4">
            Drop ROM files or use the buttons. ROMs persist in your browser (IndexedDB). Optional: add <code>gba_bios.bin</code> for GBA.
          </p>

          <div className="bg-neutral-800 rounded-2xl p-4 shadow-lg">
            <div className="flex gap-2 mb-4">
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-black font-semibold hover:scale-105 transition transform shadow-md">
                ➕ Add ROMs
              </button>
              <input ref={fileInputRef} type="file" accept=".gba,.gb,.gbc,.smc,.sfc,.nes,.n64,.z64,.v64,.nds,.iso,.bin,.cue" multiple className="hidden" onChange={(e) => onAddRom(e.target.files)} />

              <button onClick={() => biosInputRef.current && biosInputRef.current.click()}
                className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-black font-semibold hover:scale-105 transition transform shadow-md">
                🧬 Add BIOS
              </button>
              <input ref={biosInputRef} type="file" accept=".bin" className="hidden" onChange={(e) => onAddBios(e.target.files)} />
            </div>
            <div className="text-xs text-neutral-400">{biosName ? `BIOS: ${biosName}` : "No BIOS stored (optional)"}</div>
          </div>

          <div className="space-y-3">
            {roms.length === 0 ? (
              <div className="text-neutral-500">No ROMs yet. Add some games!</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {roms.map((name) => {
                  const system = getSystem(name);
                  return (
                    <div key={name} className="bg-neutral-800 rounded-xl p-3 flex items-center justify-between hover:bg-neutral-700 transition-shadow shadow-md">
                      <div className="truncate font-medium">{name}</div>
                      {system && <span className={clsx("text-xs px-2 py-0.5 rounded-full text-black font-semibold", SYSTEM_COLORS[system])}>{system.toUpperCase()}</span>}
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => startEmulator(name)} className="px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:scale-105 transition">Play</button>
                        <button onClick={() => onExportRom(name)} className="px-2 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition">Export</button>
                        <button onClick={() => onDeleteRom(name)} className="px-2 py-1 rounded-lg bg-red-700 hover:bg-red-600 transition">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Emulator Stage */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-lg">Emulator Stage</div>
              <div className="text-sm text-neutral-400">{loading ? "Loading..." : selected ? `Now playing: ${selected}` : "Idle"}</div>
            </div>
            <div
              id="emu-container"
              ref={containerRef}
              className="relative w-full aspect-[4/3] rounded-2xl bg-neutral-950 border border-neutral-700 flex items-center justify-center text-neutral-500 shadow-inner"
            >
              <div className="pointer-events-none select-none text-center px-6">
                Drop ROMs here or pick from the library.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-neutral-800 px-4 py-2 rounded-xl shadow-lg animate-fade-in-out">
          {message}
        </div>
      )}

      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s forwards;
        }
      `}</style>
    </div>
  );
}
