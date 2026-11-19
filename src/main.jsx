import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import { installModernSelect } from "./utils/modernSelect.js";
import { installReveal } from "./utils/reveal.js";
import { installScrollBorder } from "./utils/scrollBorder.js";
import { installSpotlight } from "./utils/spotlight.js";

installModernSelect();
installReveal();
installScrollBorder();
installSpotlight();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);