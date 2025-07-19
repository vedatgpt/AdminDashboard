import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Preline JS
import "preline/preline";

createRoot(document.getElementById("root")!).render(<App />);
