import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import InstallPrompt from "./pwa/InstallPrompt.jsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <InstallPrompt />
  </React.StrictMode>
);
