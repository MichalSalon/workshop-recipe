import { AlertTriangle } from "lucide-react";
import { formatMonthlyCost } from "@/lib/zerops-pricing";
import { oversizedFixGroups, type ResourceAnalysis } from "@/lib/workshop-resources";

type ResourceOverprovisionBannerProps = {
  analysis: ResourceAnalysis;
};

const ZCP_SCALE_EXAMPLE =
  'Scale frontend, api, and worker to 1 container each in workshop-dev. Leave db, cache, and queue as they are.';

export function ResourceOverprovisionBanner({ analysis }: ResourceOverprovisionBannerProps) {
  if (analysis.oversizedServices.length === 0 || analysis.monthlySavings <= 0) {
    return null;
  }

  const fixGroups = oversizedFixGroups(analysis.oversizedServices);

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 sm:px-6"
    >
      <div className="flex gap-4">
        <AlertTriangle
          className="mt-1 size-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-4 text-sm leading-relaxed text-amber-950">
          <div className="space-y-1">
            <p className="text-base font-semibold text-amber-950">
              Drop frontend, api, and worker from 3 containers to 1
            </p>
            <p>
              Orange <span className="font-medium text-amber-800">TOO BIG</span> cards run
              three replicas each — the AI Agent recipe uses one. db, cache, and queue are fine.
            </p>
            <p className="text-amber-900">
              Import YAML only creates the initial project shape. To cut cost on this running
              project, change live autoscaling in ZCP — not the import file.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-amber-950">What to do</p>
            <ul className="space-y-4">
              {fixGroups.map((group) => (
                <li key={group.hostnames} className="space-y-1.5">
                  <p className="font-medium text-amber-950">{group.hostnames}</p>
                  <ul className="list-disc space-y-1 pl-5 text-amber-900">
                    {group.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-amber-950">Try in ZCP</p>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-amber-200 bg-white p-3 font-mono text-xs text-amber-950 sm:text-sm">
              {ZCP_SCALE_EXAMPLE}
            </pre>
          </div>

          <p className="border-t border-amber-200 pt-4 text-amber-900">
            <span>Resources today</span>{" "}
            <span className="font-mono font-medium text-amber-950">
              {formatMonthlyCost(analysis.cost)}/mo
            </span>
            <span className="mx-2 text-amber-700">→</span>
            <span>after scaling</span>{" "}
            <span className="font-mono font-medium text-emerald-800">
              {formatMonthlyCost(analysis.recommendedCost)}/mo
            </span>
            <span>
              {" "}
              (save ~${analysis.monthlySavings.toFixed(0)}/mo)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
