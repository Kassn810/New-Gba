import React, { useRef, useState, useEffect } from "react";

// IndexedDB helpers
const dbName = "gba-emulator-fs";
const storeName = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(storeName).put(value, key);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const keys = [];
    const store = tx.objectStore(storeName);
    const req = store.openCursor();
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
    const tx = db.transaction(storeName, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(storeName).delete(key);
  });
}

const CDN = "https://cdn.emulatorjs.org";
const DATA_PATH = `${CDN}/stable/data/`;
const LOADER = `${CDN}/loader.js`;

export default function App() {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const biosInputRef = useRef(null);

  const [roms, setRoms] = useState([]);
  const [biosName, setBiosName] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const keys = await idbKeys();
      setRoms(keys.filter((k) => k.endsWith(".gba")));
      if (keys.includes("gba_bios.bin")) setBiosName("gba_bios.bin");
    })();
  }, []);

  const setStatus = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const onAddRom = async (files) => {
    if (!files) return;
    for (const f of files) {
      if (f.name.endsWith(".gba")) await idbPut(f.name, f);
    }
    const keys = await idbKeys();
    setRoms(keys.filter((k) => k.endsWith(".gba")));
    setStatus("ROMs added.");
  };

  const onAddBios = async (files) => {
    if (!files) return;
    await idbPut("gba_bios.bin", files[0]);
    setBiosName("gba_bios.bin");
    setStatus("BIOS added.");
  };

  const onDeleteRom = async (name) => {
    await idbDelete(name);
    const keys = await idbKeys();
    setRoms(keys.filter((k) => k.endsWith(".gba")));
    setStatus("Deleted " + name);
  };

  const startEmulator = async (romName) => {
    const romBlob = await idbGet(romName);
    const romURL = URL.createObjectURL(romBlob);

    let biosURL;
    if (biosName) {
      const biosBlob = await idbGet(biosName);
      biosURL = URL.createObjectURL(biosBlob);
    }

    if (containerRef.current) containerRef.current.innerHTML = "";

    window.EJS_player = "#emu-container";
    window.EJS_core = "gba";
    window.EJS_pathtodata = DATA_PATH;
    window.EJS_gameUrl = romURL;
    if (biosURL) window.EJS_biosUrl = biosURL;
    window.EJS_startOnLoaded = true;

    await loadScript(LOADER + "?v=" + Date.now());
    setStatus("Running " + romName);
  };

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load script"));
      document.body.appendChild(s);
    });

  return (
    <div style={{ padding: 20 }}>
      <h1>GBA Emulator</h1>
      <p>{message}</p>

      <button onClick={() => fileInputRef.current.click()}>Add ROMs</button>
      <input
        type="file"
        accept=".gba"
        multiple
        hidden
        ref={fileInputRef}
        onChange={(e) => onAddRom(e.target.files)}
      />

      <button onClick={() => biosInputRef.current.click()}>Add BIOS</button>
      <input
        type="file"
        accept=".bin"
        hidden
        ref={biosInputRef}
        onChange={(e) => onAddBios(e.target.files)}
      />

      <h2>ROM Library</h2>
      <ul>
        {roms.map((name) => (
          <li key={name}>
            {name}{" "}
            <button onClick={() => startEmulator(name)}>Play</button>
            <button onClick={() => onDeleteRom(name)}>Delete</button>
          </li>
        ))}
      </ul>

      <div
        id="emu-container"
        ref={containerRef}
        style={{ width: "640px", height: "480px", border: "1px solid black" }}
      ></div>
    </div>
  );
}
