import React, { useEffect, useRef } from "react";
import { loadEmulator, stopEmulator } from "../utils/emulatorLoader";

export default function EmulatorScreen({ consoleType, romData, goBack }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (romData && canvasRef.current) {
      loadEmulator(consoleType, romData, canvasRef.current);
    }
    return () => stopEmulator();
  }, [consoleType, romData]);

  return (
    <div className="emulator-screen">
      <div className="quick-menu">
        <button onClick={goBack}>⬅ Back</button>
        <button onClick={() => stopEmulator()}>⏸ Pause</button>
      </div>
      <canvas ref={canvasRef} width={800} height={600}></canvas>
    </div>
  );
}
