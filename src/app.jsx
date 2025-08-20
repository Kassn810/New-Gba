import React, { useState } from "react";
import GBA from "./cores/gba";
import GBC from "./cores/gbc";
import GB from "./cores/gb";
import DS from "./cores/ds";
import _3DS from "./cores/_3ds";
import NES from "./cores/nes";
import SNES from "./cores/snes";
import N64 from "./cores/n64";
import PS1 from "./cores/ps1";

export default function App() {
  const [page, setPage] = useState("menu");
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [romFile, setRomFile] = useState(null);

  const handleRomUpload = (e) => {
    const file = e.target.files[0];
    if (file) setRomFile(file);
  };

  const startEmulator = () => {
    if (selectedConsole && romFile) setPage("emulator");
  };

  const renderEmulator = () => {
    switch (selectedConsole) {
      case "gba": return <GBA rom={romFile} />;
      case "gbc": return <GBC rom={romFile} />;
      case "gb": return <GB rom={romFile} />;
      case "ds": return <DS rom={romFile} />;
      case "3ds": return <_3DS rom={romFile} />;
      case "nes": return <NES rom={romFile} />;
      case "snes": return <SNES rom={romFile} />;
      case "n64": return <N64 rom={romFile} />;
      case "ps1": return <PS1 rom={romFile} />;
      default: return <p>No console selected</p>;
    }
  };

  return (
    <div className="app">
      {page === "menu" && (
        <div className="menu">
          <h1 className="title">🎮 Retro Emulator Hub</h1>
          <p className="subtitle">Choose your console and load a ROM</p>
          <div className="console-grid">
            {["gba", "gbc", "gb", "ds", "3ds", "nes", "snes", "n64", "ps1"].map((c) => (
              <button
                key={c}
                className={`console-btn ${selectedConsole === c ? "active" : ""}`}
                onClick={() => setSelectedConsole(c)}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
          <input
            type="file"
            accept=".gba,.gbc,.gb,.nds,.3ds,.nes,.sfc,.smc,.z64,.n64,.v64,.bin,.cue"
            onChange={handleRomUpload}
            className="file-input"
          />
          <button
            onClick={startEmulator}
            className="start-btn"
            disabled={!selectedConsole || !romFile}
          >
            ▶ Start Emulator
          </button>
        </div>
      )}

      {page === "emulator" && (
        <div className="emulator">
          <div className="emulator-header">
            <button onClick={() => setPage("menu")} className="back-btn">⬅ Menu</button>
            <h2>{selectedConsole.toUpperCase()} Emulator</h2>
          </div>
          <div className="emulator-screen">
            {renderEmulator()}
          </div>
        </div>
      )}
    </div>
  );
}
