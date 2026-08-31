import { containerCount } from "@/lib/workshop-resources";
import type { RecipeServiceConfig, ResourceStackConfig } from "@/lib/diagram-types";
import type {
  NetworkDiagramConfig,
  NetworkServiceConfig,
} from "@/lib/network-diagram-types";

const RUNTIME_TYPES = new Set([
  "nodejs",
  "static",
  "python",
  "go",
  "php",
  "rust",
  "java",
  "dotnet",
]);

function serviceLabel(service: RecipeServiceConfig): string {
  const port = service.ports[0]?.port;
  return port ? `${service.name}:${port}` : service.name;
}

function isDevOnlyService(name: string): boolean {
  return name === "frontenddev" || name === "apidev" || name === "workerdev";
}

function runtimeCategory(service: RecipeServiceConfig): "http-runtime" | "side-runtime" {
  if (service.typeId === "static" || service.ports.some((port) => port.scheme === "http")) {
    return "http-runtime";
  }
  return "side-runtime";
}

/** Map deployed recipe services to the marketing-style network diagram config. */
export function recipeToNetworkDiagram(config: ResourceStackConfig): NetworkDiagramConfig {
  const userServices = config.services.filter(
    (service) => service.category === "USER" || service.category === "STANDARD",
  );

  const diagramServices = userServices.filter((service) => !isDevOnlyService(service.name));

  const runtimes: NetworkServiceConfig[] = [];
  const managed: NetworkServiceConfig[] = [];

  for (const service of diagramServices) {
    const count = containerCount(service);
    const base = {
      id: service.name,
      label: serviceLabel(service),
      containers: { active: count, standby: 0 },
      techIcon: service.typeId === "static" ? "nginx" : service.typeId,
    };

    const isHaDb = service.mode === "HA" && service.typeId === "postgresql";

    if (RUNTIME_TYPES.has(service.typeId)) {
      runtimes.push({ ...base, category: runtimeCategory(service) });
      continue;
    }

    managed.push({
      ...base,
      category: "managed",
      ...(isHaDb
        ? {
            hasLoadBalancer: true,
            loadBalancer: {
              label: "load\nbalancers",
              containers: { active: 2, standby: 0 },
            },
          }
        : {}),
    });
  }

  const dbIndex = managed.findIndex((service) => service.techIcon === "postgresql");
  if (dbIndex >= 0 && dbIndex !== Math.floor(managed.length / 2)) {
    const [db] = managed.splice(dbIndex, 1);
    managed.splice(Math.floor(managed.length / 2), 0, db);
  }

  return {
    endpoint: "HTTPS://DECK-RENDERER.WORKSHOP",
    lightweight: false,
    infrastructure: {
      ctrl: { active: 1, standby: 1 },
      stats: { active: 1, standby: 0 },
      logger: { active: 1, standby: 0 },
    },
    routing: { active: 2, standby: 0 },
    services: [...runtimes, ...managed],
  };
}
