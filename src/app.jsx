// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// Core loaders
import GBA from "./cores/gba";
import GBC from "./cores/gbc";
import GB from "./cores/gb";
import NES from "./cores/nes";
import SNES from "./cores/snes";
import N64 from "./cores/n64";
import DS from "./cores/ds";
import _3DS from "./cores/_3ds";
import PS1 from "./cores/ps1";

// Utils
import { readROM, validateROM } from "./utils/fileHelpers";
import { saveState, loadState } from "./utils/saveState";

export default function App() {
  const [modules, setModules] = useState({});
  const [activeCore, setActiveCore] = useState("gba");

  // Canvas refs
  const gbaRef = useRef(null);
  const gbcRef = useRef(null);
  const gbRef = useRef(null);
  const nesRef = useRef(null);
  const snesRef = useRef(null);
  const n64Ref = useRef(null);
  const dsTopRef = useRef(null);
  const dsBottomRef = useRef(null);
  const _3dsTopRef = useRef(null);
  const _3dsBottomRef = useRef(null);
  const ps1Ref = useRef(null);

  // Initialize cores
  useEffect(() => {
    const initCore = async (coreName, loader, canvas, bottomCanvas) => {
      const module = await loader.init({ canvas, bottomCanvas });
      setModules((prev) => ({ ...prev, [coreName]: module }));
    };

    initCore("gba", GBA, gbaRef.current);
    initCore("gbc", GBC, gbcRef.current);
    initCore("gb", GB, gbRef.current);
    initCore("nes", NES, nesRef.current);
    initCore("snes", SNES, snesRef.current);
    initCore("n64", N64, n64Ref.current);
    initCore("ds", DS, dsTopRef.current, dsBottomRef.current);
    initCore("_3ds", _3DS, _3dsTopRef.current, _3dsBottomRef.current);
    initCore("ps1", PS1, ps1Ref.current);
  }, []);

  // Load ROM
  const handleROMLoad = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateROM(file, activeCore)) {
      alert(`Invalid ROM for ${activeCore}`);
      return;
    }

    const data = await readROM(file);
    const module = modules[activeCore];
    if (!module?.loadROM || !module?.start) return;

    module.loadROM(module, data);
    module.start(module);
  };

  // Save/load state
  const handleSaveState = () => saveState(activeCore, modules[activeCore]);
  const handleLoadState = () => loadState(activeCore, modules[activeCore]);

  // Core selection
  const handleCoreChange = (e) => setActiveCore(e.target.value);

  return (
    <div className="app-container">
      <header>
        <h1>Multi-Core Emulator</h1>
        <div className="controls">
          <select value={activeCore} onChange={handleCoreChange}>
            <option value="gba">GBA</option>
            <option value="gbc">GBC</option>
            <option value="gb">GB</option>
            <option value="nes">NES</option>
            <option value="snes">SNES</option>
            <option value="n64">N64</option>
            <option value="ds">DS</option>
            <option value="_3ds">3DS</option>
            <option value="ps1">PS1</option>
          </select>
          <input type="file" onChange={handleROMLoad} />
          <button onClick={handleSaveState}>Save State</button>
          <button onClick={handleLoadState}>Load State</button>
        </div>
      </header>

      <main className="screens-container">
        {/* Group 1: GBA, GB, GBC */}
        <canvas ref={gbaRef} className="screen gba-screen" />
        <canvas ref={gbcRef} className="screen gbc-screen" />
        <canvas ref={gbRef} className="screen gb-screen" />

        {/* Group 2: NES, SNES, N64 */}
        <canvas ref={nesRef} className="screen nes-screen" />
        <canvas ref={snesRef} className="screen snes-screen" />
        <canvas ref={n64Ref} className="screen n64-screen" />

        {/* Group 3: DS dual screens */}
        <div className="dual-screen ds">
          <canvas ref={dsTopRef} className="screen ds-top" />
          <canvas ref={dsBottomRef} className="screen ds-bottom" />
        </div>

        {/* Group 4: 3DS dual screens */}
        <div className="dual-screen _3ds">
          <canvas ref={_3dsTopRef} className="screen _3ds-top" />
          <canvas ref={_3dsBottomRef} className="screen _3ds-bottom" />
        </div>

        {/* Group 5: PS1 */}
        <canvas ref={ps1Ref} className="screen ps1-screen" />
      </main>
    </div>
  );
}
