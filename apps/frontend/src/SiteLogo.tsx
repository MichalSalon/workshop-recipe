import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  markClassName?: string;
  showLabel?: boolean;
};

export function SiteLogo({ className, markClassName, showLabel = true }: SiteLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/zerops-logo.svg"
        alt="Zerops"
        className={cn("size-8 shrink-0 object-contain", markClassName)}
      />
      {showLabel ? (
        <span className="text-sm font-semibold tracking-tight">Zerops</span>
      ) : null}
    </span>
  );
}
