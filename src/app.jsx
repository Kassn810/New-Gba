// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import pages
import Home from "./pages/Home.jsx";
import EmulatorPage from "./pages/EmulatorPage.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Home page: ROM and system selection */}
        <Route path="/" element={<Home />} />

        {/* Emulator page: canvas + emulator */}
        <Route path="/emulator" element={<EmulatorPage />} />
      </Routes>
    </Router>
  );
}

