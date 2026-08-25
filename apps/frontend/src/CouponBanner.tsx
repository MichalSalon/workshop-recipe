import { ArrowRight, Download, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadCouponImage } from "@/download-coupon-image";
import { LINKS, WORKSHOP } from "@/workshop-config";

const { coupon } = WORKSHOP;

type CouponBannerProps = {
  embedded?: boolean;
};

export function CouponBanner({ embedded = false }: CouponBannerProps) {
  return (
    <section
      aria-label="Workshop coupon"
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
        embedded
          ? "rounded-2xl border border-primary/30"
          : "z-10 border-t border-primary/30",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(94,234,212,0.25),transparent)]"
      />
      <div className={cn("relative", embedded ? "px-5 py-6 sm:px-6 sm:py-8" : "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-5xl")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Ticket className="size-6" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-widest sm:text-base">
                Workshop coupon
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="rounded-xl border-2 border-primary/40 bg-black/30 px-6 py-4 shadow-[0_0_40px_-8px_rgba(94,234,212,0.45)]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Your code
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-primary sm:text-4xl">
                  {coupon.code}
                </p>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Usually</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-500 line-through sm:text-3xl">
                    ${coupon.defaultTotalUsd}
                  </p>
                  <p className="text-xs text-zinc-600">${coupon.defaultBonusUsd} bonus</p>
                </div>
                <ArrowRight className="size-6 shrink-0 text-primary" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-primary">With coupon</p>
                  <p className="mt-1 text-3xl font-bold text-white sm:text-4xl">
                    ${coupon.workshopTotalUsd}
                  </p>
                  <p className="text-sm font-medium text-primary">${coupon.workshopBonusUsd} bonus</p>
                </div>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              You already have an account — open{" "}
              <strong className="text-white">Credit &amp; Spend</strong>, top up $
              {coupon.verificationPaymentUsd} (verification payment), and enter{" "}
              <strong className="text-white">{coupon.code}</strong> in the coupon field on the
              payment screen.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <a href={LINKS.payment} target="_blank" rel="noreferrer">
                Go to payment
                <ArrowRight />
              </a>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-black/20 px-8 text-base text-white hover:bg-black/40 hover:text-white"
              onClick={() => downloadCouponImage(coupon)}
            >
              <Download />
              Download coupon image
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
