import type { ReactNode } from "react";
import type { ContainerSpec } from "@/lib/network-diagram-types";
import { DiagramNode } from "@/components/diagram/DiagramNode";

type ProjectShellProps = {
  infrastructure: {
    ctrl: ContainerSpec;
    stats: ContainerSpec;
    logger: ContainerSpec;
  };
  routing: ContainerSpec;
  children: ReactNode;
};

export function ProjectShell({ infrastructure, routing, children }: ProjectShellProps) {
  return (
    <div className="__project">
      <div className="__project-header">
        <span className="__project-title">Project</span>
        <span className="__vxlan-label">Private VXLAN network</span>
      </div>

      <div className="__zone __zone--infra">
        <span className="__zone-label">Dedicated infrastructure core</span>
        <div className="__infra-content">
          <div className="__infra-group">
            <div data-node-id="ctrl">
              <DiagramNode
                variant="infra-core"
                label={"Project ctrl &\nL3 balancer +\nfirewall"}
                containers={infrastructure.ctrl}
                barColor="orange"
                techIcons={["go"]}
                highlighted
              />
            </div>
            <div className="__infra-side-nodes">
              <div data-node-id="stats">
                <DiagramNode
                  variant="infra-side"
                  label="Stats"
                  containers={infrastructure.stats}
                  barColor="orange"
                  techIcon="sqlite"
                />
              </div>
              <div data-node-id="logger">
                <DiagramNode
                  variant="infra-side"
                  label="Logger"
                  containers={infrastructure.logger}
                  barColor="orange"
                  techIcon="victorialogs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="__zone-spacer __zone-spacer--infra-to-routing" />

      <div className="__zone __zone--routing">
        <span className="__zone-label">Dedicated routing and balancing</span>
        <div className="__routing-content">
          <div data-node-id="l7">
            <DiagramNode
              variant="balancer"
              label={"L7 HTTP\nbalancer"}
              containers={routing}
              barColor="orange"
              techIcon="nginx"
              highlighted
            />
          </div>
        </div>
      </div>

      <div className="__zone-spacer __zone-spacer--routing-to-services" />

      {children}
    </div>
  );
}
