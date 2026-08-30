import devResources from "@/config/resources-dev.json";
import prodResources from "@/config/resources-prod.json";
import {
  formatResourceNumber,
  monthlyResourceCost,
  sumResources,
  type MonthlyCost,
  type ResourceTotals,
} from "@/lib/zerops-pricing";
import type { RecipeServiceConfig, ResourceStackConfig } from "@/lib/diagram-types";
import { WORKSHOP } from "@/workshop-config";

export type { RecipeServiceConfig, ResourceStackConfig };
export const DEV_RESOURCE_CONFIG = devResources as ResourceStackConfig;
export const PROD_RESOURCE_CONFIG = prodResources as ResourceStackConfig;

export type ResourceAnalysis = {
  totals: ResourceTotals;
  cost: MonthlyCost;
  oversizedServices: RecipeServiceConfig[];
  recommendedTotals: ResourceTotals;
  recommendedCost: MonthlyCost;
  monthlySavings: number;
};

function resourceSlice(service: RecipeServiceConfig, useBaseline: boolean): ResourceTotals {
  if (service.category === "OBJECT_STORAGE") {
    return { cpu: 0, ram: 0, disc: 0, storage: service.objectStorageSize ?? 0 };
  }

  const min = useBaseline && service.recipeBaseline
    ? service.recipeBaseline.minResource
    : service.autoscaling?.verticalAutoscaling?.minResource;

  return {
    cpu: min?.cpuCoreCount ?? 0,
    ram: min?.memoryGBytes ?? 0,
    disc: min?.diskGBytes ?? 0,
    storage: 0,
  };
}

function containersForService(service: RecipeServiceConfig, useBaseline: boolean): number {
  if (useBaseline && service.recipeBaseline) {
    return service.recipeBaseline.minContainerCount;
  }
  return service.autoscaling?.horizontalAutoscaling?.minContainerCount ?? 1;
}

function serviceTotals(services: RecipeServiceConfig[], useBaseline = false): ResourceTotals {
  return sumResources(
    services.map((service) => ({
      resources: resourceSlice(service, useBaseline),
      containers: containersForService(service, useBaseline),
    })),
  );
}

export function containerCount(service: RecipeServiceConfig): number {
  return containersForService(service, false);
}

/** Short label for diagram cards — e.g. "3→1 replicas, minRam 1→0.5 GB". */
export function describeOversizedFix(service: RecipeServiceConfig, compact = false): string {
  if (!service.oversizedInDev || !service.recipeBaseline?.minResource || !service.autoscaling) {
    return "";
  }

  const parts: string[] = [];
  const currentContainers = service.autoscaling.horizontalAutoscaling.minContainerCount;
  const targetContainers = service.recipeBaseline.minContainerCount;
  if (currentContainers > targetContainers) {
    parts.push(`${currentContainers}→${targetContainers} replica${targetContainers === 1 ? "" : "s"}`);
  }

  const currentRam = service.autoscaling.verticalAutoscaling.minResource.memoryGBytes;
  const targetRam = service.recipeBaseline.minResource.memoryGBytes;
  if (currentRam > targetRam) {
    parts.push(
      compact
        ? `RAM ${formatResourceNumber(currentRam)}→${formatResourceNumber(targetRam)}`
        : `minRam ${formatResourceNumber(currentRam)}→${formatResourceNumber(targetRam)} GB`,
    );
  }

  return parts.join(compact ? " · " : ", ");
}

export type OversizedFixGroup = {
  hostnames: string;
  steps: string[];
};

/** Actionable fix list for the workshop banner. */
export function oversizedFixGroups(services: RecipeServiceConfig[]): OversizedFixGroup[] {
  const oversized = services.filter((service) => service.oversizedInDev);
  if (oversized.length === 0) return [];

  const appSlots = oversized.filter((service) =>
    ["frontend", "api", "worker"].includes(service.name),
  );

  const groups: OversizedFixGroup[] = [];

  if (appSlots.length > 0) {
    groups.push({
      hostnames: appSlots.map((service) => service.name).join(", "),
      steps: [
        "In workshop/dev/import-app.yaml: remove minContainers: 3 on frontend, api, and worker (default is 1).",
        "Update apps/frontend/src/config/resources-dev.json so those three services show 1 container in the diagram.",
      ],
    });
  }

  return groups;
}

export function displayServices(config: ResourceStackConfig): RecipeServiceConfig[] {
  return config.services.filter((service) => service.category !== "CORE");
}

export function analyzeResourceConfig(config: ResourceStackConfig): ResourceAnalysis {
  const services = displayServices(config);
  const totals = serviceTotals(services);
  const cost = monthlyResourceCost(totals);
  const oversizedServices = services.filter((service) => service.oversizedInDev);
  const recommendedTotals = serviceTotals(services, true);
  const recommendedCost = monthlyResourceCost(recommendedTotals);

  return {
    totals,
    cost,
    oversizedServices,
    recommendedTotals,
    recommendedCost,
    monthlySavings: cost.total - recommendedCost.total,
  };
}

export function isWorkshopDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  return WORKSHOP.devProjectHostnameMarkers.some((marker) => host.includes(marker));
}

/**
 * Dev vs prod resource diagram. The static frontend setup bakes VITE_WORKSHOP_ENV=prod
 * for both projects, so deployed workshop-dev is detected from the hostname.
 */
export function workshopEnv(): "dev" | "prod" {
  const env = import.meta.env.VITE_WORKSHOP_ENV;
  if (env === "dev") return "dev";
  if (import.meta.env.DEV) return "dev";
  if (typeof window !== "undefined" && isWorkshopDevHost(window.location.hostname)) {
    return "dev";
  }
  if (env === "prod") return "prod";
  return "dev";
}

export function activeResourceConfig(): ResourceStackConfig {
  return workshopEnv() === "dev" ? DEV_RESOURCE_CONFIG : PROD_RESOURCE_CONFIG;
}
