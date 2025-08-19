import React, { useState } from "react";

export default function App() {
  const [romName, setRomName] = useState(null);

  const handleRomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRomName(file.name);
      console.log("ROM selected:", file.name);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>GBA Emulator</h1>
      <p>
        {romName
          ? `Loaded ROM: ${romName}`
          : "Upload a Game Boy Advance ROM file to get started."}
      </p>

      <input type="file" accept=".gba" onChange={handleRomUpload} />

      <div style={{ marginTop: "1rem" }}>
        <button
          style={{ marginRight: "0.5rem" }}
          onClick={() => alert("Start emulator (not wired yet)")}
        >
          ▶️ Start
        </button>
        <button onClick={() => alert("Reset emulator (not wired yet)")}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
