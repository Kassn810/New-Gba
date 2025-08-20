// src/pages/EmulatorPage.jsx
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadEmulator, stopEmulator } from "../utils/emulatorLoader";

export default function EmulatorPage() {
  const canvasRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { romFile, system } = location.state || {};
    if (!romFile || !system) return navigate("/");

    loadEmulator(romFile, system, canvasRef.current);
    return () => stopEmulator();
  }, [location.state]);

  return <canvas ref={canvasRef} width={240} height={160} />;
}
