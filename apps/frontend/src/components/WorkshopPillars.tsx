import { SiteLogo } from "@/SiteLogo";
import { cn } from "@/lib/utils";
import { ZEROPS_PILLARS } from "@/workshop-config";

type WorkshopPillarsProps = {
  className?: string;
};

/**
 * Four-pillar Zerops summary — layout inspired by frontend-legacy
 * `apps/web/src/app/components/selling-points/selling-points.component.*`
 */
export function WorkshopPillars({ className }: WorkshopPillarsProps) {
  return (
    <section aria-labelledby="zerops-pillars-title" className={cn("space-y-10", className)}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <SiteLogo showLabel={false} markClassName="size-10 sm:size-12" />
        </div>
        <h2
          id="zerops-pillars-title"
          className="mx-auto max-w-3xl text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.625rem]"
        >
          The ideal mix of developer experience, affordability, flexibility, and scale
        </h2>
      </div>

      <ul className="grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-12 xl:grid-cols-4 xl:gap-8">
        {ZEROPS_PILLARS.map((pillar) => (
          <li key={pillar.title} className="max-w-md sm:max-w-none">
            <h3 className="border-l-2 border-primary/50 pl-5 text-base font-semibold leading-snug text-white sm:text-lg">
              {pillar.title}
            </h3>
            <ul className="mt-4 space-y-4">
              {pillar.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="relative pl-6 text-sm leading-relaxed text-zinc-400 before:absolute before:left-0 before:top-[0.65em] before:h-0.5 before:w-3.5 before:bg-primary/50"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
