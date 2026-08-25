import { useCallback, useEffect, useState } from "react";
import { DeckApp } from "./DeckApp";
import { WorkshopHome } from "./WorkshopHome";

type View = "home" | "app";

function viewFromPath(path: string): View {
  return path === "/app" || path.startsWith("/app/") ? "app" : "home";
}

export function App() {
  const [view, setView] = useState<View>(() => viewFromPath(window.location.pathname));

  useEffect(() => {
    document.title =
      view === "app"
        ? "Deck Renderer — Zerops"
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

  if (view === "app") return <DeckApp onHome={openHome} />;
  return <WorkshopHome onOpenApp={openApp} />;
}
