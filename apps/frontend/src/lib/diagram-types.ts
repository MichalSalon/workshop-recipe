/** recipe-resources / RecipeService subset used by the resources canvas. */
export type RecipeServiceResource = {
  cpuCoreCount: number;
  memoryGBytes: number;
  diskGBytes: number;
};

export type RecipeServiceConfig = {
  name: string;
  typeId: string;
  typeName: string;
  typeVersionName: string;
  exactVersionNumber: string;
  category: "USER" | "STANDARD" | "OBJECT_STORAGE" | "SHARED_STORAGE" | "CORE";
  mode: "HA" | "NON_HA";
  gitRepo: string;
  content: string;
  zeropsYaml: string;
  ports: Array<{ protocol: string; port: number; description: string; scheme: string }>;
  autoscaling?: {
    verticalAutoscaling: {
      minResource: RecipeServiceResource;
      maxResource: RecipeServiceResource;
      minFreeResource: RecipeServiceResource & {
        cpuCorePercent?: number;
        memoryPercent?: number;
      };
      cpuMode: "SHARED" | "DEDICATED";
      startCpuCoreCount: number;
      swapEnabled: boolean;
    };
    horizontalAutoscaling: {
      minContainerCount: number;
      maxContainerCount: number;
    };
  };
  objectStorageSize?: number;
  /** Workshop-only: allocated above the recipe baseline for this env. */
  oversizedInDev?: boolean;
  /** Recipe-correct floor when oversizedInDev is set. */
  recipeBaseline?: {
    minResource: RecipeServiceResource;
    minContainerCount: number;
  };
};

export type ResourceStackConfig = {
  projectMode: "LIGHT" | "SERIOUS";
  importYamlRaw: string;
  services: RecipeServiceConfig[];
};
