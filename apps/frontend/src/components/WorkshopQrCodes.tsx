import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { AskAgentLinks } from "@/components/AskAgentLinks";
import { cn } from "@/lib/utils";
import { WORKSHOP_QR_CODES } from "@/workshop-config";

type WorkshopQrCodesProps = {
  className?: string;
  onOpenLearn?: () => void;
};

export function WorkshopQrCodes({ className, onOpenLearn }: WorkshopQrCodesProps) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 sm:gap-8", className)}>
      {WORKSHOP_QR_CODES.map((entry) => {
        const href =
          entry.href.startsWith("/") && origin ? `${origin}${entry.href}` : entry.href;
        const isInternal = entry.href.startsWith("/");

        return (
          <article
            key={entry.id}
            className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-8 text-center sm:px-8"
          >
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {entry.title}
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {entry.description}
            </p>

            <div className="mt-6 rounded-xl bg-white p-4">
              <QRCode
                value={href}
                size={168}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                aria-label={`QR code for ${entry.title}`}
              />
            </div>

            <a
              href={entry.href}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noreferrer"}
              onClick={
                isInternal && onOpenLearn
                  ? (event) => {
                      event.preventDefault();
                      onOpenLearn();
                    }
                  : undefined
              }
              className="mt-5 font-mono text-xs text-primary underline-offset-4 hover:underline"
            >
              {entry.urlLabel}
            </a>

            {entry.chatLinks ? <AskAgentLinks compact className="mt-4" /> : null}
          </article>
        );
      })}
    </div>
  );
}
