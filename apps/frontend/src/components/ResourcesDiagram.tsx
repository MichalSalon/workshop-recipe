import { useLayoutEffect, useRef } from "react";
import { drawResourcesDiagram, measureResourcesDiagram } from "@/draw-resources-diagram";
import { formatMonthlyCost } from "@/lib/zerops-pricing";
import type { ResourceStackConfig } from "@/lib/diagram-types";
import { analyzeResourceConfig } from "@/lib/workshop-resources";

type ResourcesDiagramProps = {
  config: ResourceStackConfig;
  highlightOversized?: boolean;
};

export function ResourcesDiagram({ config, highlightOversized = false }: ResourcesDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const render = () => {
      const width = Math.max(320, Math.floor(container.clientWidth));
      const height = measureResourcesDiagram({ config, width });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawResourcesDiagram(ctx, { config, highlightOversized, width });
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(container);
    return () => observer.disconnect();
  }, [config, highlightOversized]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Project resources diagram with monthly cost"
        className="mx-auto block max-w-full"
      />
    </div>
  );
}

export function ResourcesCostSummary({ config }: { config: ResourceStackConfig }) {
  const cost = analyzeResourceConfig(config).cost;
  return <span className="font-mono text-emerald-700">{formatMonthlyCost(cost)}/mo</span>;
}
