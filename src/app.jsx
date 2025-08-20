import React, { useEffect, useRef, useState } from "react";
import "./App.css";

import GBA from "./cores/gba";
import GBC from "./cores/gbc";
import DS from "./cores/ds";
import _3DS from "./cores/_3ds";
import NES from "./cores/nes";
import SNES from "./cores/snes";
import PS1 from "./cores/ps1";

const SYSTEMS = { GBA, GBC, DS, _3DS, NES, SNES, PS1 };

export default function App() {
  const canvasRef = useRef(null);
  const [activeSystem, setActiveSystem] = useState("GBA");
  const [Module, setModule] = useState(null);
  const [romFile, setRomFile] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadCore = async () => {
      const core = SYSTEMS[activeSystem];
      const mod = await core.init({ canvas: canvasRef.current });
      setModule(mod);
      setIsRunning(false);
    };
    loadCore();
  }, [activeSystem]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setRomFile(new Uint8Array(evt.target.result));
    reader.readAsArrayBuffer(file);
  };

  const startEmulator = () => {
    if (!Module || !romFile) return;
    SYSTEMS[activeSystem].loadROM(Module, romFile);
    SYSTEMS[activeSystem].start(Module);
    setIsRunning(true);
  };

  const stopEmulator = () => {
    if (!Module) return;
    SYSTEMS[activeSystem].stop(Module);
    setIsRunning(false);
  };

  const saveState = () => {
    if (!Module || !isRunning) return;
    const state = SYSTEMS[activeSystem].saveState(Module);
    localStorage.setItem(activeSystem + "-save", JSON.stringify(Array.from(state)));
    alert("State saved!");
  };

  const loadState = () => {
    if (!Module) return;
    const saved = localStorage.getItem(activeSystem + "-save");
    if (!saved) return alert("No saved state for this system.");
    const stateArray = new Uint8Array(JSON.parse(saved));
    SYSTEMS[activeSystem].loadState(Module, stateArray);
    alert("State loaded!");
  };

  return (
    <div className="emulator-container">
      <h1 className="emulator-title">Multi-System Emulator</h1>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={240} height={160} className="gba-canvas" />
      </div>

      <div className="controls">
        <button onClick={() => setMenuOpen(!menuOpen)} className="control-btn">
          {menuOpen ? "Close Menu" : "Quick Menu"}
        </button>
      </div>

      <div className={`quick-menu ${menuOpen ? "open" : ""}`}>
        <h2>Quick Menu</h2>
        <div className="menu-item">
          <label>Select System:</label>
          <select value={activeSystem} onChange={(e) => setActiveSystem(e.target.value)}>
            {Object.keys(SYSTEMS).map((sys) => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>
        </div>

        <div className="menu-item">
          <label>Load ROM:</label>
          <input type="file" accept=".gba,.gbc,.gb,.nds,.3ds,.nes,.sfc,.smc,.iso,.bin" onChange={handleFileChange} />
        </div>

        <div className="menu-buttons">
          <button onClick={startEmulator} disabled={!romFile || isRunning} className="control-btn">Start</button>
          <button onClick={stopEmulator} disabled={!isRunning} className="control-btn">Stop</button>
          <button onClick={saveState} disabled={!isRunning} className="control-btn">Save State</button>
          <button onClick={loadState} disabled={!Module} className="control-btn">Load State</button>
        </div>
      </div>
    </div>
  );
}

