import { useCallback, useEffect, useState } from "react";
import { DeckApp } from "./DeckApp";
import { WorkshopHome } from "./WorkshopHome";
import { WorkshopPrompts } from "./WorkshopPrompts";

type View = "home" | "app" | "prompts";

function viewFromPath(path: string): View {
  if (path === "/app" || path.startsWith("/app/")) return "app";
  if (path === "/prompts" || path.startsWith("/prompts/")) return "prompts";
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
          : "From Prompt to Prod — Zerops Workshop";
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

  if (view === "app") return <DeckApp onHome={openHome} />;
  if (view === "prompts") {
    return <WorkshopPrompts onOpenHome={openHome} onOpenApp={openApp} />;
  }
  return <WorkshopHome onOpenApp={openApp} onOpenPrompts={openPrompts} />;
}
