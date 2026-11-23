import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { attachPersistence } from "./engine/persistence";
import { store } from "./engine/store";
import "./index.css";

attachPersistence(store);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
