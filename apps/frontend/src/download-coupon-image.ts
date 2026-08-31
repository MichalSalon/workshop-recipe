import { couponPromoUrl } from "@/workshop-config";

type CouponImageInput = {
  code: string;
  verificationPaymentUsd: number;
  defaultBonusUsd: number;
  workshopBonusUsd: number;
  defaultTotalUsd: number;
  workshopTotalUsd: number;
};

const FONT = "Inter, system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const COLORS = {
  bg: "#12141a",
  card: "#161922",
  cardBorder: "rgba(94, 234, 212, 0.28)",
  primary: "#5eead4",
  white: "#ffffff",
  muted: "#a1a1aa",
  dim: "#71717a",
  footerBg: "rgba(0, 0, 0, 0.28)",
  urlBg: "rgba(94, 234, 212, 0.1)",
} as const;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
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
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }
    let chunk = "";
    for (const char of word) {
      const next = chunk + char;
      if (ctx.measureText(next).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = next;
      }
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
): number {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  let cursor = y;
  for (const line of lines) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

type PriceColumn = {
  label: string;
  amount: string;
  bonus: string;
  highlight?: boolean;
  strike?: boolean;
};

function drawPriceColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  column: PriceColumn,
) {
  roundRect(ctx, x, y, width, height, 16);
  ctx.fillStyle = column.highlight ? "rgba(94, 234, 212, 0.07)" : "rgba(255, 255, 255, 0.03)";
  ctx.fill();
  ctx.strokeStyle = column.highlight ? COLORS.cardBorder : "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, width, height, 16);
  ctx.stroke();

  const pad = 28;
  const cx = x + pad;
  const innerW = width - pad * 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = column.highlight ? COLORS.primary : COLORS.dim;
  ctx.fillText(column.label.toUpperCase(), cx, y + 40);

  ctx.font = `700 48px ${FONT}`;
  ctx.fillStyle = column.highlight ? COLORS.white : COLORS.dim;
  const amountY = y + 92;
  if (column.strike) {
    ctx.fillText(column.amount, cx, amountY);
    const amountW = ctx.measureText(column.amount).width;
    ctx.strokeStyle = COLORS.dim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, amountY - 18);
    ctx.lineTo(cx + amountW, amountY - 18);
    ctx.stroke();
  } else {
    ctx.fillText(column.amount, cx, amountY);
  }

  ctx.font = `500 18px ${FONT}`;
  ctx.fillStyle = column.highlight ? COLORS.primary : COLORS.muted;
  const bonusLines = wrapText(ctx, column.bonus, innerW);
  drawTextBlock(ctx, bonusLines, cx, y + 128, 22);
}

export function downloadCouponImage(coupon: CouponImageInput): void {
  const width = 1200;
  const height = 800;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const frame = { x: 56, y: 56, w: width - 112, h: height - 112 };
  const inner = {
    left: frame.x + 56,
    right: frame.x + frame.w - 56,
    top: frame.y + 56,
    width: frame.w - 112,
  };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0f1115");
  bg.addColorStop(1, COLORS.bg);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(94, 234, 212, 0.06)";
  roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 28);
  ctx.fill();
  ctx.strokeStyle = COLORS.cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 28);
  ctx.stroke();

  let y = inner.top;

  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ZEROPS WORKSHOP COUPON", inner.left, y + 14);
  y += 36;

  const codeBoxH = 96;
  roundRect(ctx, inner.left, y, 360, codeBoxH, 16);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fill();
  ctx.strokeStyle = COLORS.cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, inner.left, y, 360, codeBoxH, 16);
  ctx.stroke();

  ctx.font = `500 12px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText("YOUR CODE", inner.left + 28, y + 34);

  ctx.font = `700 48px ${MONO}`;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(coupon.code, inner.left + 28, y + 78);
  y += codeBoxH + 24;

  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = COLORS.muted;
  const subtitle = wrapText(
    ctx,
    `Top up $${coupon.verificationPaymentUsd} to verify your account — coupon applied at checkout.`,
    inner.width,
  );
  y = drawTextBlock(ctx, subtitle, inner.left, y + 20, 28) + 28;

  const colGap = 24;
  const arrowW = 48;
  const colW = Math.floor((inner.width - colGap * 2 - arrowW) / 2);
  const colH = 176;
  const colLeftX = inner.left;
  const colRightX = inner.left + colW + colGap + arrowW;

  drawPriceColumn(ctx, colLeftX, y, colW, colH, {
    label: "Usually",
    amount: `$${coupon.defaultTotalUsd}`,
    bonus: `$${coupon.defaultBonusUsd} bonus`,
    strike: true,
  });

  ctx.font = `500 28px ${FONT}`;
  ctx.fillStyle = COLORS.primary;
  ctx.textAlign = "center";
  ctx.fillText("→", colLeftX + colW + colGap + arrowW / 2, y + colH / 2 + 10);

  drawPriceColumn(ctx, colRightX, y, colW, colH, {
    label: "With coupon",
    amount: `$${coupon.workshopTotalUsd}`,
    bonus: `$${coupon.workshopBonusUsd} bonus (not $${coupon.defaultBonusUsd})`,
    highlight: true,
  });

  y += colH + 32;

  const footerH = 156;
  roundRect(ctx, inner.left, y, inner.width, footerH, 16);
  ctx.fillStyle = COLORS.footerBg;
  ctx.fill();

  const footerPad = 28;
  const footerTextW = inner.width - footerPad * 2;

  ctx.textAlign = "left";
  ctx.font = `400 19px ${FONT}`;
  ctx.fillStyle = "#d4d4d8";
  const body = wrapText(
    ctx,
    "You already have a Zerops account — open the promo link below to top up. The coupon is applied automatically.",
    footerTextW,
  );
  let footerY = drawTextBlock(ctx, body, inner.left + footerPad, y + 36, 26) + 18;

  const promoPath = couponPromoUrl(coupon.code).replace(/^https:\/\//, "");
  ctx.font = `500 17px ${MONO}`;
  const urlLines = wrapText(ctx, promoPath, footerTextW - 32);
  const urlLineH = 22;
  const urlBlockH = urlLines.length * urlLineH + 24;
  roundRect(ctx, inner.left + footerPad, footerY, footerTextW, urlBlockH, 10);
  ctx.fillStyle = COLORS.urlBg;
  ctx.fill();
  ctx.strokeStyle = "rgba(94, 234, 212, 0.22)";
  ctx.lineWidth = 1;
  roundRect(ctx, inner.left + footerPad, footerY, footerTextW, urlBlockH, 10);
  ctx.stroke();

  ctx.fillStyle = COLORS.primary;
  drawTextBlock(ctx, urlLines, inner.left + footerPad + 16, footerY + 28, urlLineH);

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
