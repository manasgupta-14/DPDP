import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import { installModernSelect } from "./utils/modernSelect.js";
import { installReveal } from "./utils/reveal.js";
import { installScrollBorder } from "./utils/scrollBorder.js";
import { installRipple } from "./utils/ripple.js";
import "./styles/pro.css";

// Reveal pehle paint se pehle (warna content jhatke se chhupta), baaki listeners idle me (main thread free rehta hai)
installReveal();
const later = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 600));
later(() => {
    installModernSelect();
    installScrollBorder();
    installRipple();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);