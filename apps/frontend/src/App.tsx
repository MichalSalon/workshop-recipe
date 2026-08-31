import { useCallback, useEffect, useState } from "react";
import { CapabilityInventory } from "./CapabilityInventory";
import { DeckApp } from "./DeckApp";
import { WorkshopHome } from "./WorkshopHome";
import { WorkshopPrompts } from "./WorkshopPrompts";

type View = "home" | "app" | "prompts" | "capabilities";

function viewFromPath(path: string): View {
  if (path === "/app" || path.startsWith("/app/")) return "app";
  if (path === "/prompts" || path.startsWith("/prompts/")) return "prompts";
  if (path === "/capabilities" || path.startsWith("/capabilities/")) return "capabilities";
  return "home";
}

export function App() {
  const [view, setView] = useState<View>(() => viewFromPath(window.location.pathname));

  useEffect(() => {
    document.title =
      view === "app"
        ? "Deck Renderer — Zerops"
        : view === "prompts"
          ? "ZCP Prompts — Zerops Workshop"
          : view === "capabilities"
            ? "Zerops capability inventory"
            : "Zerops — CYC2026 workshop";
  }, [view]);

  useEffect(() => {
    const onPopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openApp = useCallback(() => {
    window.history.pushState({}, "", "/app");
    setView("app");
  }, []);

  const openHome = useCallback(() => {
    window.history.pushState({}, "", "/");
    setView("home");
  }, []);

  const openPrompts = useCallback(() => {
    window.history.pushState({}, "", "/prompts");
    setView("prompts");
  }, []);

  const openCapabilities = useCallback(() => {
    window.history.pushState({}, "", "/capabilities");
    setView("capabilities");
  }, []);

  if (view === "app") return <DeckApp onHome={openHome} />;
  if (view === "prompts") {
    return <WorkshopPrompts onOpenHome={openHome} onOpenApp={openApp} />;
  }
  if (view === "capabilities") {
    return (
      <CapabilityInventory
        onOpenHome={openHome}
        onOpenPrompts={openPrompts}
        onOpenApp={openApp}
      />
    );
  }
  return (
    <WorkshopHome
      onOpenApp={openApp}
      onOpenPrompts={openPrompts}
      onOpenCapabilities={openCapabilities}
    />
  );
}
