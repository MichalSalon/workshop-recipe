import { AlertTriangle } from "lucide-react";
import { formatMonthlyCost } from "@/lib/zerops-pricing";
import { oversizedFixGroups, type ResourceAnalysis } from "@/lib/workshop-resources";

type ResourceOverprovisionBannerProps = {
  analysis: ResourceAnalysis;
};

export function ResourceOverprovisionBanner({ analysis }: ResourceOverprovisionBannerProps) {
  if (analysis.oversizedServices.length === 0 || analysis.monthlySavings <= 0) {
    return null;
  }

  const fixGroups = oversizedFixGroups(analysis.oversizedServices);

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-5 py-5 sm:px-6"
    >
      <div className="flex gap-4">
        <AlertTriangle
          className="mt-1 size-5 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-4 text-sm leading-relaxed text-amber-100/90">
          <div className="space-y-1">
            <p className="text-base font-semibold text-amber-50">
              Drop frontend, api, and worker from 3 containers to 1
            </p>
            <p>
              Orange <span className="font-medium text-amber-300">TOO BIG</span> cards run
              three replicas each — the AI Agent recipe uses one. db, cache, and queue are fine.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-amber-50">What to change</p>
            <ul className="space-y-4">
              {fixGroups.map((group) => (
                <li key={group.hostnames} className="space-y-1.5">
                  <p className="font-medium text-white">{group.hostnames}</p>
                  <ul className="list-disc space-y-1 pl-5 text-amber-100/85">
                    {group.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm">
            <code className="rounded-md bg-black/25 px-2 py-1 font-mono text-amber-50">
              workshop/dev/import-app.yaml
            </code>
            <span className="self-center text-amber-100/50">→</span>
            <code className="rounded-md bg-black/25 px-2 py-1 font-mono text-amber-50">
              recipes/deck-renderer/0 — AI Agent/import.yaml
            </code>
          </div>

          <p className="border-t border-amber-500/20 pt-4 text-amber-100/85">
            <span className="text-amber-100/70">Resources today</span>{" "}
            <span className="font-mono font-medium text-amber-50">
              {formatMonthlyCost(analysis.cost)}/mo
            </span>
            <span className="mx-2 text-amber-100/40">→</span>
            <span className="text-amber-100/70">after fix</span>{" "}
            <span className="font-mono font-medium text-emerald-300">
              {formatMonthlyCost(analysis.recommendedCost)}/mo
            </span>
            <span className="text-amber-100/70">
              {" "}
              (save ~${analysis.monthlySavings.toFixed(0)}/mo)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
