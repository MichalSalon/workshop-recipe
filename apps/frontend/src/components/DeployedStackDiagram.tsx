import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AnnotatedPath, NetworkDiagramConfig, NetworkServiceConfig } from "@/lib/network-diagram-types";
import { computeNetworkDiagramPaths } from "@/lib/compute-network-diagram-paths";
import { useNetworkDiagramTrace } from "@/lib/use-network-diagram-trace";
import { DiagramNode } from "@/components/diagram/DiagramNode";
import { ProjectShell } from "@/components/diagram/ProjectShell";
import { cn } from "@/lib/utils";
import "./diagram/network-diagram.css";

const DIAGRAM_WIDTH = 660;

type DeployedStackDiagramProps = {
  config: NetworkDiagramConfig;
  className?: string;
};

function serviceBarColor(category: NetworkServiceConfig["category"]): "cyan" | "orange" {
  return category === "managed" ? "orange" : "cyan";
}

export function DeployedStackDiagram({ config, className }: DeployedStackDiagramProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<AnnotatedPath[]>([]);

  const row1MainServices = useMemo(
    () => config.services.filter((s) => s.category === "http-runtime"),
    [config.services],
  );
  const row1SideServices = useMemo(
    () => config.services.filter((s) => s.category === "side-runtime"),
    [config.services],
  );
  const row2Services = useMemo(
    () =>
      config.services.filter(
        (s) => s.category !== "http-runtime" && s.category !== "side-runtime",
      ),
    [config.services],
  );

  const row1SideServiceIds = useMemo(
    () => row1SideServices.map((service) => service.id),
    [row1SideServices],
  );

  useNetworkDiagramTrace({
    hostRef,
    canvasRef,
    paths,
    row1SideServiceIds,
  });

  useLayoutEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let pending = 0;

    const recompute = () => {
      const nextScale = Math.min(1, host.clientWidth / DIAGRAM_WIDTH);
      host.style.setProperty("--diagram-scale", String(nextScale));
      host.style.height = `${canvas.scrollHeight * nextScale}px`;

      setPaths(
        computeNetworkDiagramPaths({
          canvas,
          scale: nextScale,
          lightweight: false,
          infrastructure: config.infrastructure,
          routing: config.routing,
          row1MainServices,
          row1SideServices,
          row2Services,
        }),
      );
    };

    const schedule = () => {
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        pending = requestAnimationFrame(() => {
          pending = 0;
          recompute();
        });
      });
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(host);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      if (pending) cancelAnimationFrame(pending);
    };
  }, [config, row1MainServices, row1SideServices, row2Services]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paths.length === 0) return;

    let outer = 0;
    let inner = 0;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const svgLayer = canvas.querySelector(":scope > .__svg-layer") as SVGElement | null;
        if (!svgLayer) return;

        setPaths((current) => {
          let changed = false;
          const next = current.map((path, index) => {
            if (path.cachedLength != null) return path;
            const pathEl = svgLayer.querySelector(
              `[data-path-idx="${index}"]`,
            ) as SVGPathElement | null;
            if (!pathEl) return path;
            changed = true;
            return { ...path, cachedLength: Math.ceil(pathEl.getTotalLength()) };
          });
          return changed ? next : current;
        });
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [paths]);

  return (
    <div
      ref={hostRef}
      className={cn("zw-network-diagram-host", className)}
      aria-label="Deployed stack network diagram"
    >
      <div ref={canvasRef} className="__canvas">
        <div className="__endpoint-row" data-node-id="endpoint">
          <DiagramNode variant="endpoint" label={config.endpoint} />
        </div>

        <ProjectShell infrastructure={config.infrastructure} routing={config.routing}>
          <div className="__zone __zone--services">
            <span className="__zone-label">
              Your services
              <br />
              with system containers
            </span>
            <div className="__services-content">
              <div className="__services-row __services-row--top">
                <div />
                <div className="__services-main-nodes">
                  {row1MainServices.map((service) => (
                    <div key={service.id} data-node-id={service.id}>
                      <DiagramNode
                        variant="service"
                        label={service.label}
                        containers={service.containers}
                        barColor={serviceBarColor(service.category)}
                        techIcon={service.techIcon}
                      />
                    </div>
                  ))}
                </div>
                {row1SideServices.length ? (
                  <div className="__services-side-nodes">
                    {row1SideServices.map((service) => (
                      <div key={service.id} data-node-id={service.id}>
                        <DiagramNode
                          variant="service"
                          label={service.label}
                          containers={service.containers}
                          barColor={serviceBarColor(service.category)}
                          techIcon={service.techIcon}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div />
                )}
              </div>

              <div className="__services-spacer" />

              <div className="__services-row __services-row--bottom">
                {row2Services.map((service) =>
                  service.hasLoadBalancer && service.loadBalancer ? (
                    <div
                      key={service.id}
                      className="__compound"
                      data-node-id={`${service.id}-compound`}
                    >
                      <div className="__compound-lb" data-node-id={`${service.id}-lb`}>
                        <DiagramNode
                          variant="service-highlighted"
                          label={service.loadBalancer.label ?? "load\nbalancers"}
                          containers={service.loadBalancer.containers}
                          barColor="orange"
                          highlighted
                        />
                      </div>
                      <div className="__compound-service" data-node-id={service.id}>
                        <DiagramNode
                          variant="service"
                          label={service.label}
                          containers={service.containers}
                          barColor={serviceBarColor(service.category)}
                          techIcon={service.techIcon}
                        />
                      </div>
                    </div>
                  ) : (
                    <div key={service.id} data-node-id={service.id}>
                      <DiagramNode
                        variant="service"
                        label={service.label}
                        containers={service.containers}
                        barColor={serviceBarColor(service.category)}
                        techIcon={service.techIcon}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </ProjectShell>

        <svg className="__svg-layer" aria-hidden="true">
          {paths.map((path, index) =>
            path.renderMode !== "glow-only" ? (
              <path key={`base-${index}`} d={path.d} className="__path-base" />
            ) : null,
          )}
          {paths.map((path, index) =>
            path.renderMode !== "base-only" ? (
              <path
                key={`glow-${index}`}
                d={path.d}
                className="__path-glow"
                data-path-idx={index}
              />
            ) : null,
          )}
        </svg>
      </div>
    </div>
  );
}
