import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";  relative import, must be in the same folder

// Attach React app to the div with id="root" in index.html
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



