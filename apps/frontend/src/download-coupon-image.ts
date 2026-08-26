type CouponImageInput = {
  code: string;
  verificationPaymentUsd: number;
  defaultBonusUsd: number;
  workshopBonusUsd: number;
  defaultTotalUsd: number;
  workshopTotalUsd: number;
};

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

export function downloadCouponImage(coupon: CouponImageInput): void {
  const width = 1200;
  const height = 740;
  const pad = 48;
  const innerBottom = height - pad;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0f1115");
  bg.addColorStop(1, "#12141a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(94, 234, 212, 0.08)";
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
  ctx.fill();

  ctx.strokeStyle = "rgba(94, 234, 212, 0.35)";
  ctx.lineWidth = 3;
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
  ctx.stroke();

  ctx.fillStyle = "#5eead4";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("ZEROPS WORKSHOP COUPON", 96, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 88px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(coupon.code, 96, 230);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillText("Enter during the $10 verification top-up", 96, 290);
  ctx.fillStyle = "#71717a";
  ctx.font = "500 20px Inter, system-ui, sans-serif";
  ctx.fillText("Total credits after payment:", 96, 322);

  ctx.fillStyle = "#71717a";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText(`Usually $${coupon.defaultTotalUsd} total`, 96, 380);
  ctx.fillStyle = "#52525b";
  ctx.font = "600 36px Inter, system-ui, sans-serif";
  ctx.fillText(`$${coupon.defaultTotalUsd}`, 96, 430);

  ctx.fillStyle = "#5eead4";
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText("With this coupon", 520, 380);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px Inter, system-ui, sans-serif";
  ctx.fillText(`$${coupon.workshopTotalUsd}`, 520, 450);
  ctx.fillStyle = "#5eead4";
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillText(`$${coupon.workshopBonusUsd} bonus (not $${coupon.defaultBonusUsd})`, 520, 490);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  const lines = [
    "Open Credit & Spend and start a $10 verification top-up.",
    `Enter ${coupon.code} in the coupon field before you complete payment.`,
    "app.zerops.io/dashboard/finances",
  ];
  const lineHeight = 34;
  const footerStartY = innerBottom - pad - (lines.length - 1) * lineHeight - 8;
  lines.forEach((line, index) => {
    ctx.fillText(line, 96, footerStartY + index * lineHeight);
  });

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
