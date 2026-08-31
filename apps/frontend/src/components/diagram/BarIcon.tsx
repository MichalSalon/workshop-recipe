import { useEffect, useRef } from "react";
import {
  drawBarFrame,
  drawBarStatic,
  observeBarIcon,
  unobserveBarIcon,
  type BarCanvasEntry,
} from "@/lib/bar-anim-loop";
import { cn } from "@/lib/utils";

type BarIconProps = {
  color?: "cyan" | "orange";
  active?: boolean;
};

export function BarIcon({ color = "cyan", active = true }: BarIconProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entryRef = useRef<BarCanvasEntry | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const w = 19;
    const h = 4;
    const gap = 3;
    const r = 3;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.width = w * dpr;
    canvas.height = (h * 3 + gap * 2) * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = getComputedStyle(host);
    const entry: BarCanvasEntry = {
      ctx,
      w,
      h,
      gap,
      r,
      dpr,
      phases: [Math.random() * 30, Math.random() * 30, Math.random() * 30],
      colors: [
        cs.getPropertyValue("--metric-cpu").trim() || "#2196f3",
        cs.getPropertyValue("--metric-ram").trim() || "#009688",
        cs.getPropertyValue("--metric-disc").trim() || "#e91e63",
      ],
    };
    entryRef.current = entry;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      drawBarFrame(entry, 0);
      return () => {
        entryRef.current = null;
      };
    }

    drawBarFrame(entry, performance.now() / 1000);
    if (active) observeBarIcon(host, entry);
    else drawBarStatic(entry);

    return () => {
      unobserveBarIcon(host);
      entryRef.current = null;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const entry = entryRef.current;
    if (!host || !entry) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (active) {
      observeBarIcon(host, entry);
    } else {
      unobserveBarIcon(host);
      drawBarStatic(entry);
    }
  }, [active]);

  return (
    <div
      ref={hostRef}
      data-bar-icon=""
      className={cn("__bar-icon", active && "__bar-icon--active", `color-${color}`)}
    >
      <canvas ref={canvasRef} className="__cvs" />
    </div>
  );
}
