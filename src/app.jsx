// src/App.jsx
import React, { useRef, useEffect, useState } from "react";
import GB from "./cores/gb";
import GBC from "./cores/gbc";
import NES from "./cores/nes";
import SNES from "./cores/snes";
import N64 from "./cores/n64";
import GBA from "./cores/gba";
import DS from "./cores/ds";
import _3DS from "./cores/_3ds";
import "./App.css";

export default function App() {
  const gbRef = useRef(null);
  const gbcRef = useRef(null);
  const consoleRef = useRef(null);
  const dsTopRef = useRef(null);
  const dsBottomRef = useRef(null);
  const _3dsTopRef = useRef(null);
  const _3dsBottomRef = useRef(null);

  const [modules, setModules] = useState({});
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [volume, setVolume] = useState(1.0);

  useEffect(() => {
    GB.init({ canvas: gbRef.current }).then((mod) =>
      setModules((m) => ({ ...m, gb: mod }))
    );
    GBC.init({ canvas: gbcRef.current }).then((mod) =>
      setModules((m) => ({ ...m, gbc: mod }))
    );
    NES.init({ canvas: consoleRef.current }).then((mod) =>
      setModules((m) => ({ ...m, nes: mod }))
    );
    SNES.init({ canvas: consoleRef.current }).then((mod) =>
      setModules((m) => ({ ...m, snes: mod }))
    );
    N64.init({ canvas: consoleRef.current }).then((mod) =>
      setModules((m) => ({ ...m, n64: mod }))
    );
    GBA.init({ canvas: consoleRef.current }).then((mod) =>
      setModules((m) => ({ ...m, gba: mod }))
    );
    DS.init({ canvas: dsTopRef.current, bottomCanvas: dsBottomRef.current }).then((mod) =>
      setModules((m) => ({ ...m, ds: mod }))
    );
    _3DS.init({ canvas: _3dsTopRef.current, bottomCanvas: _3dsBottomRef.current }).then((mod) =>
      setModules((m) => ({ ...m, _3ds: mod }))
    );
  }, []);

  const handleLoadROM = (event, coreName) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      modules[coreName]?.loadROM?.(modules[coreName], data);
      modules[coreName]?.start?.(modules[coreName]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveState = (coreName) => {
    const state = modules[coreName]?.saveState?.(modules[coreName]);
    if (state) {
      const blob = new Blob([state]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${coreName}-state.sav`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleLoadState = (event, coreName) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      modules[coreName]?.loadState?.(modules[coreName], data);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Multi-System Emulator</h1>
        <button onClick={() => setQuickMenuOpen(!quickMenuOpen)}>
          {quickMenuOpen ? "Close Menu" : "Quick Menu"}
        </button>
      </div>

      {/* --- GB / GBC --- */}
      <div className="screen-group">
        <canvas ref={gbRef} className="screen-gb" />
        <canvas ref={gbcRef} className="screen-gb" />
        <div className="controls">
          <label className="label-file">
            Load GB
            <input type="file" accept=".gb" onChange={(e) => handleLoadROM(e, "gb")} />
          </label>
          <label className="label-file">
            Load GBC
            <input type="file" accept=".gbc" onChange={(e) => handleLoadROM(e, "gbc")} />
          </label>
        </div>
      </div>

      {/* --- NES / SNES / N64 / GBA --- */}
      <div className="screen-group">
        <canvas ref={consoleRef} className="screen-console" />
        <div className="controls">
          <label className="label-file">
            Load NES
            <input type="file" accept=".nes" onChange={(e) => handleLoadROM(e, "nes")} />
          </label>
          <label className="label-file">
            Load SNES
            <input type="file" accept=".sfc,.smc" onChange={(e) => handleLoadROM(e, "snes")} />
          </label>
          <label className="label-file">
            Load N64
            <input type="file" accept=".n64,.z64" onChange={(e) => handleLoadROM(e, "n64")} />
          </label>
          <label className="label-file">
            Load GBA
            <input type="file" accept=".gba" onChange={(e) => handleLoadROM(e, "gba")} />
          </label>
        </div>
      </div>

      {/* --- DS --- */}
      <div className="dual-screen-ds">
        <canvas ref={dsTopRef} className="screen-ds-top" />
        <canvas ref={dsBottomRef} className="screen-ds-bottom" />
        <div className="controls">
          <label className="label-file">
            Load DS
            <input type="file" accept=".nds" onChange={(e) => handleLoadROM(e, "ds")} />
          </label>
        </div>
      </div>

      {/* --- 3DS --- */}
      <div className="dual-screen-3ds">
        <canvas ref={_3dsTopRef} className="screen-3ds-top" />
        <canvas ref={_3dsBottomRef} className="screen-3ds-bottom" />
        <div className="controls">
          <label className="label-file">
            Load 3DS
            <input type="file" accept=".3ds" onChange={(e) => handleLoadROM(e, "_3ds")} />
          </label>
        </div>
      </div>

      {/* --- Quick Menu --- */}
      <div className={`quick-menu ${quickMenuOpen ? "open" : ""}`}>
        <h2>Quick Menu</h2>
        <label>
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </label>

        {Object.keys(modules).map((core) => (
          <div key={core}>
            <button onClick={() => handleSaveState(core)}>Save {core}</button>
            <label className="label-file">
              Load {core} State
              <input type="file" onChange={(e) => handleLoadState(e, core)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
