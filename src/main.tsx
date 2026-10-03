import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// The web site owns its cache; the POS APK uses its bundled local assets.
if (window.location.protocol === "https:" &&
    window.location.hostname !== "appassets.androidplatform.net" &&
    "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
