import type { ContainerSpec } from "@/lib/network-diagram-types";
import { BarIcon } from "@/components/diagram/BarIcon";
import { techIconSvg } from "@/lib/tech-icons";
import { cn } from "@/lib/utils";

function formatLabel(label: string): string {
  return label.replace(/\n/g, " ");
}

function BarRow({
  containers,
  color,
  infra,
}: {
  containers: ContainerSpec;
  color: "cyan" | "orange";
  infra?: boolean;
}) {
  return (
    <div className={cn("__bar-row", infra && "__bar-row--infra")}>
      {Array.from({ length: containers.active }, (_, i) => (
        <BarIcon key={`a-${i}`} color={color} active />
      ))}
      {Array.from({ length: containers.standby }, (_, i) => (
        <BarIcon key={`s-${i}`} color={color} active={false} />
      ))}
    </div>
  );
}

function TechIcon({ id }: { id?: string }) {
  const svg = techIconSvg(id);
  if (!svg) return null;
  return (
    <span
      className="__tech-icon"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export type DiagramNodeProps = {
  label: string;
  sublabel?: string;
  containers?: ContainerSpec;
  techIcon?: string;
  techIcons?: string[];
  variant:
    | "endpoint"
    | "infra-core"
    | "infra-side"
    | "balancer"
    | "service"
    | "service-highlighted"
    | "external";
  barColor?: "cyan" | "orange";
  highlighted?: boolean;
};

export function DiagramNode({
  label,
  containers,
  techIcon,
  techIcons,
  variant,
  barColor = "orange",
  highlighted = false,
}: DiagramNodeProps) {
  const hostClass = cn("__node", `__node--${variant}`, highlighted && "__node--highlighted");

  if (variant === "endpoint") {
    return (
      <div className={hostClass}>
        <div className="__endpoint-pill">
          <span className="__endpoint-label">{label}</span>
        </div>
      </div>
    );
  }

  if (variant === "infra-side") {
    return (
      <div className={hostClass}>
        <div className="__infra-side-box">
          <div className="__bar-col">
            {containers
              ? Array.from({ length: containers.active }, (_, i) => (
                  <BarIcon key={i} color={barColor} />
                ))
              : null}
          </div>
          <div className="__side-bottom">
            <span className="__node-label __node-label--mono __node-label--side">
              {formatLabel(label)}
            </span>
            <TechIcon id={techIcon} />
          </div>
        </div>
      </div>
    );
  }

  const boxClass =
    variant === "infra-core"
      ? "__infra-core-box"
      : variant === "balancer"
        ? "__balancer-box"
        : variant === "service-highlighted"
          ? "__service-highlighted-box"
          : "__service-box";

  const labelClass = cn(
    "__node-label",
    variant === "infra-core" ? "__node-label--mono-core" : "__node-label--mono",
    label.includes("\n") && "__node-label--multiline",
  );

  return (
    <div className={hostClass}>
      <div className={boxClass}>
        {containers ? (
          <BarRow containers={containers} color={barColor} infra={variant === "infra-core"} />
        ) : null}
        {variant === "balancer" ? (
          <div className="__balancer-label-area">
            <span className={labelClass}>{label}</span>
            <TechIcon id={techIcon} />
          </div>
        ) : variant === "service" ? (
          <div className="__label-block">
            <span className={labelClass}>{formatLabel(label)}</span>
            <TechIcon id={techIcon} />
          </div>
        ) : (
          <>
            <span className={labelClass}>{label}</span>
            {techIcons?.length ? (
              <div className="__tech-icons-row">
                {techIcons.map((icon) => (
                  <TechIcon key={icon} id={icon} />
                ))}
              </div>
            ) : (
              <TechIcon id={techIcon} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
