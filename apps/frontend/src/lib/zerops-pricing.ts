/** Hourly unit prices — mirrors frontend-legacy `ZEROPS_HOURLY_RESOURCE_PRICES`. */
export const ZEROPS_HOURLY_RESOURCE_PRICES = {
  cpu: 0.00833333333333334,
  vcpu: 0.0008333333333333,
  ram: 0.004166666666667,
  disc: 0.000138889,
  objectStorage: 0.0000138889,
} as const;

export const ZEROPS_CORE_PACKAGE_PRICES = {
  light: 0,
  serious: 10,
} as const;

const HOURS_PER_MONTH = 24 * 30;

export type ResourceTotals = {
  cpu: number;
  ram: number;
  disc: number;
  storage: number;
};

export type MonthlyCost = {
  amount: number;
  decimal: string;
  total: number;
};

export function sumResources(
  services: Array<{ resources: ResourceTotals; containers: number }>,
): ResourceTotals {
  return services.reduce(
    (total, service) => ({
      cpu: total.cpu + service.resources.cpu * service.containers,
      ram: total.ram + service.resources.ram * service.containers,
      disc: total.disc + service.resources.disc * service.containers,
      storage: total.storage + service.resources.storage,
    }),
    { cpu: 0, ram: 0, disc: 0, storage: 0 },
  );
}

/** Recipe cards price shared vCPU even when a service runs dedicated CPU. */
export function monthlyResourceCost(totals: ResourceTotals): MonthlyCost {
  const { vcpu, ram, disc, objectStorage } = ZEROPS_HOURLY_RESOURCE_PRICES;
  const totalCost =
    totals.cpu * (vcpu * HOURS_PER_MONTH) +
    totals.ram * (ram * HOURS_PER_MONTH) +
    totals.disc * (disc * HOURS_PER_MONTH) +
    totals.storage * (objectStorage * HOURS_PER_MONTH);

  return {
    total: totalCost,
    amount: Math.floor(totalCost),
    decimal: ((totalCost % 1) * 100).toFixed(0).padStart(2, "0"),
  };
}

export function formatMonthlyCost(cost: MonthlyCost): string {
  return `$${cost.amount}.${cost.decimal}`;
}

/** Strip float noise — 0.25 not 0.25000000000000002. */
export function formatResourceNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function cpuCoreLabel(count: number, mode: "SHARED" | "DEDICATED" = "SHARED"): string {
  const kind = mode === "SHARED" ? "Shared" : "Dedicated";
  return `${kind} ${count > 1 ? "Cores" : "Core"}`;
}
