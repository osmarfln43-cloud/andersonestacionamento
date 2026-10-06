import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// The web site owns its cache; the POS APK uses its bundled local assets.
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const enableServiceWorker = import.meta.env.PROD && !isInIframe &&
  window.location.protocol === "https:" &&
  window.location.hostname !== "appassets.androidplatform.net";

if (enableServiceWorker && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Remove service workers registered by earlier versions in embedded/local contexts.
if (!enableServiceWorker) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}
