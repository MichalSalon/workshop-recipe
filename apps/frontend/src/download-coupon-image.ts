import { couponPromoUrl } from "@/workshop-config";

type CouponImageInput = {
  code: string;
  verificationPaymentUsd: number;
  defaultBonusUsd: number;
  workshopBonusUsd: number;
  defaultTotalUsd: number;
  workshopTotalUsd: number;
};

const FONT = "Geologica, ui-sans-serif, system-ui, sans-serif";
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const SCALE = 2;

const COLORS = {
  pageFrom: "#f3f5f7",
  pageTo: "#e8eef0",
  card: "#ffffff",
  cardBorder: "rgba(2, 179, 164, 0.45)",
  primary: "#02b3a4",
  ink: "#1a1a1a",
  muted: "#475569",
  dim: "#64748b",
  codeFill: "rgba(2, 179, 164, 0.07)",
  colFill: "rgba(26, 26, 26, 0.035)",
  colHiFill: "rgba(2, 179, 164, 0.1)",
  footerFill: "rgba(2, 179, 164, 0.1)",
  urlFill: "#ffffff",
} as const;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  lineWidth = 2,
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    roundRect(ctx, x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

async function loadLogo(): Promise<HTMLImageElement | null> {
  const img = new Image();
  img.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo"));
      img.src = "/zerops-logo.svg";
    });
    return img;
  } catch {
    return null;
  }
}

export async function downloadCouponImage(coupon: CouponImageInput): Promise<void> {
  if (document.fonts?.ready) await document.fonts.ready;
  const logo = await loadLogo();

  const width = 1200;
  const height = 840;
  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const frame = { x: 48, y: 48, w: width - 96, h: height - 96 };
  const left = frame.x + 52;
  const innerW = frame.w - 104;

  const page = ctx.createLinearGradient(0, 0, width, height);
  page.addColorStop(0, COLORS.pageFrom);
  page.addColorStop(1, COLORS.pageTo);
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, width, height);

  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  fillRound(ctx, frame.x, frame.y, frame.w, frame.h, 28, COLORS.card);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 28);
  ctx.strokeStyle = COLORS.cardBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  let y = frame.y + 40;

  if (logo) {
    ctx.drawImage(logo, left, y, 36, 43);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = COLORS.ink;
  ctx.fillText("Zerops", left + (logo ? 48 : 0), y + 30);

  ctx.textAlign = "right";
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.letterSpacing = "0.16em";
  ctx.fillText("WORKSHOP COUPON", left + innerW, y + 28);
  ctx.letterSpacing = "0";
  ctx.textAlign = "left";

  y += 68;

  const codeH = 168;
  fillRound(ctx, left, y, innerW, codeH, 20, COLORS.codeFill, COLORS.cardBorder, 2.5);

  ctx.textAlign = "center";
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.letterSpacing = "0.18em";
  ctx.fillText("YOUR CODE", left + innerW / 2, y + 42);
  ctx.letterSpacing = "0.22em";
  ctx.font = `700 72px ${MONO}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(coupon.code, left + innerW / 2, y + 118);
  ctx.letterSpacing = "0";
  ctx.textAlign = "left";

  y += codeH + 28;

  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  const subtitle = wrapText(
    ctx,
    `Make a verification top-up — coupon applied at checkout.`,
    innerW,
  );
  for (const line of subtitle) {
    ctx.fillText(line, left, y);
    y += 28;
  }
  y += 16;

  const colGap = 20;
  const arrowW = 56;
  const colW = Math.floor((innerW - colGap * 2 - arrowW) / 2);
  const colH = 148;

  fillRound(ctx, left, y, colW, colH, 16, COLORS.colFill, "rgba(26, 26, 26, 0.08)", 1.5);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.letterSpacing = "0.14em";
  ctx.fillText("USUALLY", left + 28, y + 38);
  ctx.letterSpacing = "0";
  ctx.font = `700 44px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  const usual = `$${coupon.defaultTotalUsd}`;
  ctx.fillText(usual, left + 28, y + 90);
  const usualW = ctx.measureText(usual).width;
  ctx.strokeStyle = COLORS.dim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left + 28, y + 74);
  ctx.lineTo(left + 28 + usualW, y + 74);
  ctx.stroke();
  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`$${coupon.defaultBonusUsd} bonus`, left + 28, y + 122);

  ctx.font = `600 32px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.textAlign = "center";
  ctx.fillText("→", left + colW + colGap + arrowW / 2, y + colH / 2 + 12);
  ctx.textAlign = "left";

  const rightX = left + colW + colGap + arrowW;
  fillRound(ctx, rightX, y, colW, colH, 16, COLORS.colHiFill, COLORS.cardBorder, 2);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.letterSpacing = "0.14em";
  ctx.fillText("WITH COUPON", rightX + 28, y + 38);
  ctx.letterSpacing = "0";
  ctx.font = `700 44px ${FONT}`;
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(`$${coupon.workshopTotalUsd}`, rightX + 28, y + 90);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`$${coupon.workshopBonusUsd} bonus`, rightX + 28, y + 122);

  y += colH + 24;

  const footerH = frame.y + frame.h - 40 - y;
  fillRound(ctx, left, y, innerW, footerH, 16, COLORS.footerFill);

  const pad = 24;
  ctx.font = `500 15px ${FONT}`;
  ctx.fillStyle = COLORS.ink;
  const bodyLines = [
    "🎟️ Use the code on your first top-up, or redeem it later on its own.",
    "🪙 Codes on the coins add credit with no payment.",
  ];
  let footerY = y + 32;
  for (const line of bodyLines) {
    ctx.fillText(line, left + pad, footerY);
    footerY += 24;
  }
  footerY += 10;

  const promoPath = couponPromoUrl(coupon.code).replace(/^https:\/\//, "");
  ctx.font = `500 18px ${MONO}`;
  const urlH = 48;
  fillRound(
    ctx,
    left + pad,
    footerY,
    innerW - pad * 2,
    urlH,
    10,
    COLORS.urlFill,
    "rgba(2, 179, 164, 0.35)",
    1.5,
  );
  ctx.fillStyle = COLORS.primary;
  ctx.textBaseline = "middle";
  ctx.fillText(promoPath, left + pad + 16, footerY + urlH / 2);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zerops-coupon-${coupon.code}.png`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
