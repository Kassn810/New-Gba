import React, { useState } from "react";
import EmulatorScreen from "./components/EmulatorScreen";
import "./App.css";
import { readROM } from "./utils/fileHelpers";

export default function App() {
  const [consoleType, setConsoleType] = useState(null);
  const [romData, setRomData] = useState(null);
  const [step, setStep] = useState("menu"); // "menu" | "emulator"

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const romBuffer = await readROM(file);
      setRomData(romBuffer);
    }
  };

  const handleStart = () => {
    if (consoleType && romData) {
      setStep("emulator");
    } else {
      alert("Please select a console and a ROM file first.");
    }
  };

  if (step === "menu") {
    return (
      <div className="menu-screen">
        <h1>🎮 Web Emulator Hub</h1>

        <label htmlFor="consoleSelect">Choose a console:</label>
        <select
          id="consoleSelect"
          value={consoleType || ""}
          onChange={(e) => setConsoleType(e.target.value)}
        >
          <option value="">-- Select Console --</option>
          <option value="gb">Game Boy</option>
          <option value="gbc">Game Boy Color</option>
          <option value="gba">Game Boy Advance</option>
          <option value="nes">NES</option>
          <option value="snes">SNES</option>
          <option value="n64">Nintendo 64</option>
          <option value="ds">Nintendo DS</option>
          <option value="3ds">Nintendo 3DS</option>
          <option value="ps1">PlayStation 1</option>
        </select>

        <input
          type="file"
          accept=".gb,.gbc,.gba,.nes,.smc,.sfc,.n64,.nds,.3ds,.bin,.iso"
          onChange={handleFileUpload}
        />

        <button onClick={handleStart}>▶ Start Emulator</button>
      </div>
    );
  }

  return (
    <EmulatorScreen
      consoleType={consoleType}
      romData={romData}
      goBack={() => setStep("menu")}
    />
  );
}
