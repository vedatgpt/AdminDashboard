import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Preline UI components - temporarily disabled to fix syntax errors
// if (typeof window !== 'undefined') {
//   // Dynamically import Preline to avoid syntax errors
//   import("preline/preline").then(() => {
//     setTimeout(() => {
//       if ((window as any).HSAccordion) {
//         (window as any).HSAccordion.autoInit();
//       }
//       if ((window as any).HSOverlay) {
//         (window as any).HSOverlay.autoInit();
//       }
//       if ((window as any).HSDropdown) {
//         (window as any).HSDropdown.autoInit();
//       }
//     }, 100);
//   }).catch(error => {
//     console.warn('Preline UI failed to load:', error);
//   });
// }

createRoot(document.getElementById("root")!).render(<App />);
