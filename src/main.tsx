import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA (production only, not in iframes/preview)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const enableServiceWorker = import.meta.env.PROD && !isInIframe;

if (enableServiceWorker && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Unregister SWs in preview/iframe
if (!enableServiceWorker) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}
