import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "preline/preline";

// Initialize Preline UI components
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if ((window as any).HSAccordion) {
      (window as any).HSAccordion.autoInit();
    }
    if ((window as any).HSOverlay) {
      (window as any).HSOverlay.autoInit();
    }
  }, 100);
}

createRoot(document.getElementById("root")!).render(<App />);
