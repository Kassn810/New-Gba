// src/pages/Home.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SYSTEMS = ["gba"]; // Add other systems later: "gb", "nes", etc.

export default function Home() {
  const [romFile, setRomFile] = useState(null);
  const [system, setSystem] = useState("gba");
  const navigate = useNavigate();

  const handleStart = () => {
    if (!romFile) return alert("Select a ROM!");
    navigate("/emulator", { state: { romFile, system } });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Web Emulator</h1>

      <select
        value={system}
        onChange={(e) => setSystem(e.target.value)}
        className="p-2 border rounded"
      >
        {SYSTEMS.map((s) => (
          <option key={s} value={s}>
            {s.toUpperCase()}
          </option>
        ))}
      </select>

      <input type="file" accept="*" onChange={(e) => setRomFile(e.target.files[0])} />

      <button
        onClick={handleStart}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start Emulator
      </button>
    </div>
  );
}
