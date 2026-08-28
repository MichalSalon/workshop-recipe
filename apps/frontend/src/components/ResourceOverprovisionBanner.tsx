import { AlertTriangle } from "lucide-react";
import { formatMonthlyCost } from "@/lib/zerops-pricing";
import {
  describeOversizedFix,
  oversizedFixGroups,
  type ResourceAnalysis,
} from "@/lib/workshop-resources";

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
      className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-4 sm:px-5"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="space-y-3 text-sm leading-relaxed text-amber-50/90">
          <p className="font-semibold text-amber-100">
            Fix: right-size four services to the AI Agent recipe
          </p>
          <p className="text-amber-100/85">
            Orange cards below are over-provisioned. Keep every hostname — only lower allocations
            in{" "}
            <strong className="font-mono text-xs text-white">workshop/dev/import-app.yaml</strong> to
            match{" "}
            <strong className="font-mono text-xs text-white">
              recipes/deck-renderer/0 — AI Agent/import.yaml
            </strong>
            .
          </p>

          <div>
            <p className="mb-2 font-medium text-amber-100">What to change</p>
            <ul className="space-y-3">
              {fixGroups.map((group) => (
                <li key={group.hostnames}>
                  <p className="font-medium text-white">{group.hostnames}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-amber-100/80">
                    {group.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <ul className="space-y-1 border-t border-amber-500/20 pt-3 text-xs text-amber-100/75">
            {analysis.oversizedServices.map((service) => (
              <li key={service.name}>
                <span className="font-mono text-amber-50">{service.name}</span>
                {" — "}
                {describeOversizedFix(service)}
              </li>
            ))}
          </ul>

          <p className="text-amber-100/80">
            Resources today{" "}
            <strong className="font-mono text-amber-50">
              {formatMonthlyCost(analysis.cost)}/mo
            </strong>
            {" → "}
            after fix{" "}
            <strong className="font-mono text-emerald-300">
              {formatMonthlyCost(analysis.recommendedCost)}/mo
            </strong>
            {" "}
            (save ~{" "}
            <strong className="font-mono text-emerald-300">
              ${analysis.monthlySavings.toFixed(0)}/mo
            </strong>
            ).
          </p>
        </div>
      </div>
    </div>
  );
}
