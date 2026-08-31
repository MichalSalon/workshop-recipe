import type {
  AnnotatedPath,
  ContainerSpec,
  NetworkServiceConfig,
} from "@/lib/network-diagram-types";

const RADIUS = 16;
const NEAR_GAP = 27;

function n(v: number): number {
  return Math.round(v * 10) / 10;
}

function branch(exit: [number, number], entry: [number, number], juncY: number): string {
  const [ex, ey] = exit;
  const [nx, ny] = entry;
  const dx = nx - ex;

  if (Math.abs(dx) < 3) {
    const mx = n((ex + nx) / 2);
    return `M${mx},${n(ey)}L${mx},${n(ny)}`;
  }

  const r = Math.min(RADIUS, Math.abs(dx) / 2, Math.abs(juncY - ey) / 2, Math.abs(ny - juncY) / 2);
  const hDir = Math.sign(dx);
  const vDir = Math.sign(ny - juncY) || 1;

  return [
    `M${n(ex)},${n(ey)}`,
    `L${n(ex)},${n(juncY - r)}`,
    `Q${n(ex)},${n(juncY)},${n(ex + r * hDir)},${n(juncY)}`,
    `L${n(nx - r * hDir)},${n(juncY)}`,
    `Q${n(nx)},${n(juncY)},${n(nx)},${n(juncY + r * vDir)}`,
    `L${n(nx)},${n(ny)}`,
  ].join("");
}

export type ComputePathsInput = {
  canvas: HTMLElement;
  scale: number;
  lightweight: boolean;
  infrastructure: { ctrl: ContainerSpec };
  routing: ContainerSpec;
  row1MainServices: NetworkServiceConfig[];
  row1SideServices: NetworkServiceConfig[];
  row2Services: NetworkServiceConfig[];
};

export function computeNetworkDiagramPaths(input: ComputePathsInput): AnnotatedPath[] {
  const {
    canvas,
    scale,
    lightweight,
    infrastructure,
    routing,
    row1MainServices,
    row1SideServices,
    row2Services,
  } = input;

  const canvasRect = canvas.getBoundingClientRect();
  if (canvasRect.width === 0) return [];

  const toNative = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - canvasRect.left) / scale,
      y: (r.top - canvasRect.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
    };
  };

  const topCenter = (el: HTMLElement): [number, number] => {
    const r = toNative(el);
    return [r.x + r.w / 2, r.y];
  };

  const bottomCenter = (el: HTMLElement): [number, number] => {
    const r = toNative(el);
    return [r.x + r.w / 2, r.y + r.h];
  };

  const nodeEl = (id: string): HTMLElement | null =>
    canvas.querySelector(`[data-node-id="${id}"]`);

  interface BarTarget {
    point: [number, number];
    barIndex: number;
    active: boolean;
  }

  const barIconTargets = (nodeId: string, activeCount?: number): BarTarget[] => {
    const el = nodeEl(nodeId);
    if (!el) return [];
    return Array.from(el.querySelectorAll("[data-bar-icon]")).map((icon, idx) => ({
      point: topCenter(icon as HTMLElement),
      barIndex: idx,
      active: activeCount !== undefined ? idx < activeCount : true,
    }));
  };

  const all: AnnotatedPath[] = [];

  // Segment 1: endpoint → ctrl
  const endpointEl = nodeEl("endpoint");
  const ctrlTargets = barIconTargets("ctrl", infrastructure.ctrl.active);
  if (endpointEl && ctrlTargets.length) {
    const exit = bottomCenter(endpointEl);
    const minY = Math.min(...ctrlTargets.map((t) => t.point[1]));
    const juncY = minY - NEAR_GAP;
    for (const target of ctrlTargets) {
      all.push({
        d: branch(exit, target.point, juncY),
        depth: 0,
        sourceNodeId: "endpoint",
        targetNodeId: "ctrl",
        targetBarIndex: target.barIndex,
        active: target.active,
      });
    }
  }

  const ctrlEl = nodeEl("ctrl");
  const infraGroupEl = canvas.querySelector(".__infra-group") as HTMLElement | null;
  const l7El = nodeEl("l7");

  // Segment 2: ctrl → L7 (heavyweight) or ctrl → row1 (lightweight)
  if (!lightweight && ctrlEl && l7El && infraGroupEl) {
    const l7Targets = barIconTargets("l7", routing.active);
    if (l7Targets.length) {
      const ctrlX = bottomCenter(ctrlEl)[0];
      const infraBottomY = bottomCenter(infraGroupEl)[1];
      const exit: [number, number] = [ctrlX, infraBottomY];
      const minY = Math.min(...l7Targets.map((t) => t.point[1]));
      const juncY = minY - NEAR_GAP;
      for (const target of l7Targets) {
        all.push({
          d: branch(exit, target.point, juncY),
          depth: 1,
          sourceNodeId: "ctrl",
          targetNodeId: "l7",
          targetBarIndex: target.barIndex,
          active: target.active,
        });
      }
    }
  } else if (lightweight && infraGroupEl) {
    for (const svc of row1MainServices) {
      const targets = barIconTargets(svc.id, svc.containers.active);
      if (targets.length) {
        const exitX = bottomCenter(infraGroupEl)[0];
        const exitY = bottomCenter(infraGroupEl)[1];
        const exit: [number, number] = [exitX, exitY];
        const minEntryY = Math.min(...targets.map((t) => t.point[1]));
        const juncY = (exitY + minEntryY) / 2;
        for (const target of targets) {
          all.push({
            d: branch(exit, target.point, juncY),
            depth: 2,
            sourceNodeId: "ctrl",
            targetNodeId: svc.id,
            targetBarIndex: target.barIndex,
            active: target.active,
          });
        }
      }
    }
  }

  // Segment 3: L7 → row1 main services
  if (l7El && !lightweight) {
    for (const svc of row1MainServices) {
      const targets = barIconTargets(svc.id, svc.containers.active);
      if (targets.length) {
        const exit = bottomCenter(l7El);
        const minEntryY = Math.min(...targets.map((t) => t.point[1]));
        const juncY = (exit[1] + minEntryY) / 2;
        for (const target of targets) {
          all.push({
            d: branch(exit, target.point, juncY),
            depth: 2,
            sourceNodeId: "l7",
            targetNodeId: svc.id,
            targetBarIndex: target.barIndex,
            active: target.active,
          });
        }
      }
    }
  }

  // Segment 4: row1 → row2
  const STORAGE_OFFSET = 19;
  const COMPOUND_OFFSET = 11;

  const row2SideTargets: (BarTarget & { nodeId: string })[] = [];
  const row2CompoundTargets: (BarTarget & { nodeId: string })[] = [];

  for (const row2Svc of row2Services) {
    if (row2Svc.hasLoadBalancer && row2Svc.loadBalancer) {
      const lbId = `${row2Svc.id}-lb`;
      for (const t of barIconTargets(lbId, row2Svc.loadBalancer.containers.active)) {
        row2CompoundTargets.push({ ...t, nodeId: lbId });
      }
    } else {
      for (const t of barIconTargets(row2Svc.id, row2Svc.containers.active)) {
        row2SideTargets.push({ ...t, nodeId: row2Svc.id });
      }
    }
  }

  const storageEl = nodeEl("storage");
  const storagePt = storageEl ? topCenter(storageEl) : null;

  let sharedMainJuncY = 0;
  let mainExitX = 0;

  for (const row1Svc of row1MainServices) {
    const row1El = nodeEl(row1Svc.id);
    if (!row1El) continue;

    const exit = bottomCenter(row1El);
    mainExitX = exit[0];

    const sideMinY = row2SideTargets.length
      ? Math.min(...row2SideTargets.map((t) => t.point[1]))
      : row2CompoundTargets.length
        ? Math.min(...row2CompoundTargets.map((t) => t.point[1]))
        : 0;
    const mainJuncY = Math.max(exit[1] + RADIUS, sideMinY - NEAR_GAP);
    sharedMainJuncY = mainJuncY;

    if (storagePt) {
      all.push({
        d: branch(exit, storagePt, mainJuncY - STORAGE_OFFSET),
        depth: 3,
        sourceNodeId: row1Svc.id,
        targetNodeId: "storage",
        targetBarIndex: -1,
        active: true,
      });
    }

    for (const target of row2SideTargets) {
      all.push({
        d: branch(exit, target.point, mainJuncY),
        depth: 3,
        sourceNodeId: row1Svc.id,
        targetNodeId: target.nodeId,
        targetBarIndex: target.barIndex,
        active: target.active,
      });
    }

    for (const target of row2CompoundTargets) {
      all.push({
        d: branch(exit, target.point, mainJuncY + COMPOUND_OFFSET),
        depth: 3,
        sourceNodeId: row1Svc.id,
        targetNodeId: target.nodeId,
        targetBarIndex: target.barIndex,
        active: target.active,
      });
    }
  }

  for (const sideSvc of row1SideServices) {
    const sideEl = nodeEl(sideSvc.id);
    if (!sideEl || !sharedMainJuncY) continue;

    const exit = bottomCenter(sideEl);

    all.push({
      d: `M${n(exit[0])},${n(exit[1])}L${n(exit[0])},${n(sharedMainJuncY)}`,
      depth: 3,
      sourceNodeId: sideSvc.id,
      targetNodeId: "bus-rail",
      targetBarIndex: -1,
      active: true,
      renderMode: "base-only",
    });

    if (storagePt) {
      all.push({
        d: branch(exit, storagePt, sharedMainJuncY - STORAGE_OFFSET),
        depth: 3,
        sourceNodeId: sideSvc.id,
        targetNodeId: "storage",
        targetBarIndex: -1,
        active: true,
        renderMode: "glow-only",
      });
    }

    for (const target of row2SideTargets) {
      all.push({
        d: branch(exit, target.point, sharedMainJuncY),
        depth: 3,
        sourceNodeId: sideSvc.id,
        targetNodeId: target.nodeId,
        targetBarIndex: target.barIndex,
        active: target.active,
        renderMode: "glow-only",
      });
    }

    for (const target of row2CompoundTargets) {
      const [wx, wy] = exit;
      const [tx, ty] = target.point;
      const railY = sharedMainJuncY;
      const viaX = mainExitX;

      const dx1 = viaX - wx;
      const r1 = Math.min(RADIUS, Math.abs(dx1) / 2, Math.abs(railY - wy) / 2);
      const h1 = Math.sign(dx1);
      const dx2 = tx - viaX;

      let d: string;
      if (Math.abs(dx2) < 3) {
        const mx = n((viaX + tx) / 2);
        d = [
          `M${n(wx)},${n(wy)}`,
          `L${n(wx)},${n(railY - r1)}`,
          `Q${n(wx)},${n(railY)},${n(wx + r1 * h1)},${n(railY)}`,
          `L${n(mx)},${n(railY)}`,
          `L${n(mx)},${n(ty)}`,
        ].join("");
      } else {
        const compoundRailY = railY + COMPOUND_OFFSET;
        const h2 = Math.sign(dx2);
        const rDrop = Math.min(RADIUS, COMPOUND_OFFSET / 2, Math.abs(dx2) / 2);
        const rTarget = Math.min(RADIUS, Math.abs(dx2) / 2, Math.abs(ty - compoundRailY) / 2);
        d = [
          `M${n(wx)},${n(wy)}`,
          `L${n(wx)},${n(railY - r1)}`,
          `Q${n(wx)},${n(railY)},${n(wx + r1 * h1)},${n(railY)}`,
          `L${n(viaX)},${n(railY)}`,
          `L${n(viaX)},${n(compoundRailY - rDrop)}`,
          `Q${n(viaX)},${n(compoundRailY)},${n(viaX + rDrop * h2)},${n(compoundRailY)}`,
          `L${n(tx - rTarget * h2)},${n(compoundRailY)}`,
          `Q${n(tx)},${n(compoundRailY)},${n(tx)},${n(compoundRailY + rTarget)}`,
          `L${n(tx)},${n(ty)}`,
        ].join("");
      }

      all.push({
        d,
        depth: 3,
        sourceNodeId: sideSvc.id,
        targetNodeId: target.nodeId,
        targetBarIndex: target.barIndex,
        active: target.active,
        renderMode: "glow-only",
      });
    }
  }

  // Segment 5: compound LB → managed service
  for (const row2Svc of row2Services) {
    if (row2Svc.hasLoadBalancer && row2Svc.loadBalancer) {
      const lbId = `${row2Svc.id}-lb`;
      const lbEl = nodeEl(lbId);
      const svcTargets = barIconTargets(row2Svc.id, row2Svc.containers.active);
      if (lbEl && svcTargets.length) {
        const exit = bottomCenter(lbEl);
        const minEntryY = Math.min(...svcTargets.map((t) => t.point[1]));
        const juncY = (exit[1] + minEntryY) / 2;
        for (const target of svcTargets) {
          all.push({
            d: branch(exit, target.point, juncY),
            depth: 4,
            sourceNodeId: lbId,
            targetNodeId: row2Svc.id,
            targetBarIndex: target.barIndex,
            active: target.active,
          });
        }
      }
    }
  }

  return all;
}
