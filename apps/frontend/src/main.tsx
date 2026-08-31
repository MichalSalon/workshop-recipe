import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RECIPE_DEPLOY_URL } from "./workshop-config";
import "./styles.css";

const path = window.location.pathname;
if (path === "/deploy" || path.startsWith("/deploy/")) {
  window.location.replace(RECIPE_DEPLOY_URL);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
