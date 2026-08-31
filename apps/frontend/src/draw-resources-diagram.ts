import {
  ZEROPS_CORE_PACKAGE_PRICES,
  cpuCoreLabel,
  formatResourceNumber,
  monthlyResourceCost,
  sumResources,
} from "@/lib/zerops-pricing";
import type { RecipeServiceConfig, ResourceStackConfig } from "@/lib/diagram-types";
import { containerCount, displayServices } from "@/lib/workshop-resources";

const COLORS = {
  coreBg: "#082335",
  coreTitle: "#64b5ff",
  serviceBg: "rgba(255, 255, 255, 0.04)",
  serviceFlaggedBg: "rgba(245, 158, 11, 0.12)",
  serviceFlaggedBorder: "rgba(245, 158, 11, 0.45)",
  hostname: "#e9eeec",
  type: "#9faea9",
  resourceNum: "#e9eeec",
  resourceUnit: "rgba(233, 238, 236, 0.7)",
  resourceLabel: "#9faea9",
  containerDot: "#56d364",
  price: "#66bb6a",
  separator: "rgba(255, 255, 255, 0.12)",
  sumIcon: "rgba(159, 174, 169, 0.35)",
  badgeBg: "#f59e0b",
  badgeText: "#451a03",
} as const;

const FONT = "Inter, system-ui, sans-serif";

type DrawOptions = {
  config: ResourceStackConfig;
  highlightOversized?: boolean;
  width: number;
};

type Layout = {
  height: number;
  pad: number;
  coreW: number;
  cols: number;
  cardW: number;
  cardH: number;
  gap: number;
};

function gridCols(count: number, width: number): number {
  if (width < 520) return 1;
  if (width < 820) return count === 1 ? 1 : 2;
  if (count === 1) return 1;
  if (count === 2 || count === 4) return 2;
  return 3;
}

function computeLayout(width: number, serviceCount: number): Layout {
  const pad = 24;
  const gap = 14;
  const cols = gridCols(serviceCount, width);
  const coreW = Math.min(270, width - pad * 2);
  const cardW = Math.floor((width - pad * 2 - gap * (cols - 1)) / cols);
  const cardH = cardW >= 300 ? 132 : 144;
  const rows = Math.ceil(serviceCount / cols);
  const coreBlock = 96;
  const gridH = rows * cardH + Math.max(0, rows - 1) * gap;
  const footer = width >= 640 ? 118 : 160;
  const height = pad + coreBlock + 24 + gridH + 32 + footer + pad;
  return { height, pad, coreW, cols, cardW, cardH, gap };
}

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

function drawStackedMetric(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  colWidth: number,
  value: string,
  label: string,
  valueSize: number,
  unit?: string,
) {
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 ${valueSize}px ${FONT}`;
  ctx.fillStyle = COLORS.resourceNum;
  const valueW = ctx.measureText(value).width;
  let unitW = 0;
  if (unit) {
    ctx.font = `500 ${Math.round(valueSize * 0.85)}px ${FONT}`;
    unitW = ctx.measureText(unit).width;
  }
  const lineW = valueW + (unit ? 3 + unitW : 0);
  const lineX = centerX - lineW / 2;

  ctx.textAlign = "left";
  ctx.font = `700 ${valueSize}px ${FONT}`;
  ctx.fillStyle = COLORS.resourceNum;
  ctx.fillText(value, lineX, y);

  if (unit) {
    ctx.font = `500 ${Math.round(valueSize * 0.85)}px ${FONT}`;
    ctx.fillStyle = COLORS.resourceUnit;
    ctx.fillText(unit, lineX + valueW + 3, y);
  }

  ctx.font = `500 ${Math.max(9, Math.round(valueSize * 0.72))}px ${FONT}`;
  ctx.fillStyle = COLORS.resourceLabel;
  ctx.textAlign = "center";

  const words = label.split(" ");
  let line = "";
  let lineY = y + 15;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > colWidth - 4 && line) {
      ctx.fillText(line, centerX, lineY);
      line = word;
      lineY += 11;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, centerX, lineY);

  ctx.textAlign = "left";
}

function drawMetricColumns(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  metrics: Array<{ value: string; label: string; unit?: string }>,
  valueSize: number,
) {
  const colWidth = width / metrics.length;
  metrics.forEach((metric, index) => {
    drawStackedMetric(
      ctx,
      x + colWidth * index + colWidth / 2,
      y,
      colWidth,
      metric.value,
      metric.label,
      valueSize,
      metric.unit,
    );
  });
}

function drawContainerDots(ctx: CanvasRenderingContext2D, x: number, y: number, count: number) {
  const size = 10;
  const spacing = 3;
  for (let index = 0; index < count; index += 1) {
    ctx.beginPath();
    ctx.arc(x + index * (size + spacing) + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.containerDot;
    ctx.fill();
  }
}

function drawContainerBlock(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  count: number,
  valueSize: number,
) {
  const dotY = y - valueSize + 4;
  const dotW = Math.max(count, 1) * 13 - 3;
  const label = count > 1 ? "Containers" : "Container";
  ctx.font = `500 ${Math.round(valueSize * 0.6)}px ${FONT}`;
  const labelW = ctx.measureText(label).width;
  const startX = centerX - (dotW + 6 + labelW) / 2;

  drawContainerDots(ctx, startX, dotY, count);
  ctx.fillStyle = COLORS.resourceLabel;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, startX + dotW + 6, y);
}

function serviceTypeLabel(service: RecipeServiceConfig): string {
  return `${service.typeName} ${service.exactVersionNumber}`.trim();
}

function serviceHostname(service: RecipeServiceConfig): string {
  let text = service.name;
  const ports = service.ports?.slice(0, 2).map((port) => port.port) ?? [];
  if (ports.length) {
    text += ports.map((port) => `:${port}`).join(",");
    if ((service.ports?.length ?? 0) > 2) {
      text += ` +${(service.ports?.length ?? 0) - 2}`;
    }
  }
  return text;
}

function drawFlaggedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const badge = "TOO BIG";
  ctx.font = `600 9px ${FONT}`;
  const badgeW = ctx.measureText(badge).width + 12;
  const badgeX = x + width - badgeW - 10;
  const badgeY = y + 10;

  roundRect(ctx, badgeX, badgeY, badgeW, 16, 4);
  ctx.fillStyle = COLORS.badgeBg;
  ctx.fill();
  ctx.fillStyle = COLORS.badgeText;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(badge, badgeX + 6, badgeY + 11);
}

function drawServiceCard(
  ctx: CanvasRenderingContext2D,
  service: RecipeServiceConfig,
  x: number,
  y: number,
  width: number,
  height: number,
  flagged: boolean,
) {
  roundRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = flagged ? COLORS.serviceFlaggedBg : COLORS.serviceBg;
  ctx.fill();
  if (flagged) {
    ctx.strokeStyle = COLORS.serviceFlaggedBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, width, height, 6);
    ctx.stroke();
    drawFlaggedBadge(ctx, x, y, width);
  }

  const innerX = x + 14;
  const innerW = width - 28;
  const centerX = x + width / 2;
  const headerY = y + 24;
  const hostname = serviceHostname(service);

  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = COLORS.hostname;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const hostnameMaxW = flagged ? innerW - 58 : innerW;
  const hostnameText =
    ctx.measureText(hostname).width > hostnameMaxW
      ? `${hostname.slice(0, Math.max(8, Math.floor(hostnameMaxW / 8)))}…`
      : hostname;
  ctx.fillText(hostnameText, centerX, headerY);

  ctx.font = `500 12px ${FONT}`;
  ctx.fillStyle = COLORS.type;
  const typeLine = serviceTypeLabel(service);
  ctx.fillText(
    ctx.measureText(typeLine).width > innerW ? `${typeLine.slice(0, 18)}…` : typeLine,
    centerX,
    headerY + 18,
  );

  const min = service.autoscaling?.verticalAutoscaling?.minResource;
  const cpuMode = service.autoscaling?.verticalAutoscaling?.cpuMode ?? "SHARED";
  const containers = containerCount(service);
  const metricSize = width >= 300 ? 12 : 11;

  if (!min) return;

  const containersY = headerY + 40;
  const metricsY = containersY + 26;

  drawContainerBlock(ctx, centerX, containersY, containers, metricSize);
  drawMetricColumns(
    ctx,
    innerX,
    metricsY,
    innerW,
    [
      {
        value: formatResourceNumber(min.cpuCoreCount),
        label: cpuCoreLabel(min.cpuCoreCount, cpuMode),
      },
      {
        value: formatResourceNumber(min.memoryGBytes),
        label: "RAM",
        unit: "GB",
      },
      {
        value: formatResourceNumber(min.diskGBytes),
        label: "Disk (SSD)",
        unit: "GB",
      },
    ],
    metricSize,
  );
}

function drawCoreBlock(
  ctx: CanvasRenderingContext2D,
  mode: ResourceStackConfig["projectMode"],
  centerX: number,
  y: number,
  width: number,
) {
  const height = 88;
  const x = centerX - width / 2;
  roundRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = COLORS.coreBg;
  ctx.fill();

  const serious = mode === "SERIOUS";
  const title = serious ? "Serious project core" : "Lightweight project core";
  const subtitle = serious
    ? "Highly-available dedicated balancers (L3/L7), logger and statistics services"
    : "Single dedicated container with balancers (L3/L7), logger and statistics services";

  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = COLORS.coreTitle;
  ctx.textAlign = "center";
  ctx.fillText(title, centerX, y + 22);
  drawContainerDots(ctx, centerX - (serious ? 26 : 5), y + 30, serious ? 5 : 1);
  ctx.font = `500 11px ${FONT}`;
  ctx.fillStyle = COLORS.type;
  const words = subtitle.split(" ");
  let line = "";
  let lineY = y + 56;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width - 20 && line) {
      ctx.fillText(line, centerX, lineY);
      line = word;
      lineY += 14;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, centerX, lineY);
  ctx.textAlign = "left";
}

function drawPriceAmount(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  amount: number,
  decimal: string,
): number {
  const amountText = String(amount);
  const decimalText = `.${decimal}`;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.font = `700 24px ${FONT}`;
  const symbolW = ctx.measureText("$").width;
  const amountW = ctx.measureText(amountText).width;

  ctx.fillStyle = COLORS.price;
  ctx.globalAlpha = 0.4;
  ctx.fillText("$", x, y);
  ctx.globalAlpha = 1;
  ctx.fillText(amountText, x + symbolW + 2, y);

  ctx.font = `500 16px ${FONT}`;
  ctx.globalAlpha = 0.5;
  ctx.fillText(decimalText, x + symbolW + 2 + amountW + 2, y);
  ctx.globalAlpha = 1;

  return x + symbolW + 2 + amountW + ctx.measureText(decimalText).width + 2;
}

function drawAddonAmount(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  y: number,
  packagePrice: number,
) {
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = COLORS.price;

  if (packagePrice === 0) {
    ctx.fillText("Free", rightX, y);
  } else {
    ctx.fillText(`$${packagePrice}.00`, rightX, y);
  }

  ctx.textAlign = "left";
}

function drawFooterCaption(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  maxWidth: number,
  align: "left" | "right",
) {
  ctx.font = `500 10px ${FONT}`;
  ctx.fillStyle = COLORS.resourceLabel;
  ctx.globalAlpha = 0.55;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * 13);
  });

  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  config: ResourceStackConfig,
  services: RecipeServiceConfig[],
  layout: Layout,
  width: number,
  y: number,
) {
  const totals = sumResources(
    services.map((service) => ({
      resources: {
        cpu: service.autoscaling?.verticalAutoscaling?.minResource?.cpuCoreCount ?? 0,
        ram: service.autoscaling?.verticalAutoscaling?.minResource?.memoryGBytes ?? 0,
        disc: service.autoscaling?.verticalAutoscaling?.minResource?.diskGBytes ?? 0,
        storage: service.objectStorageSize ?? 0,
      },
      containers: containerCount(service),
    })),
  );
  const cost = monthlyResourceCost(totals);
  const packageKey = config.projectMode === "LIGHT" ? "light" : "serious";
  const packagePrice = ZEROPS_CORE_PACKAGE_PRICES[packageKey];
  const packageName = config.projectMode === "LIGHT" ? "Lightweight" : "Serious";
  const { pad } = layout;

  ctx.strokeStyle = COLORS.separator;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();

  const metrics = [
    {
      value: formatResourceNumber(totals.cpu),
      label: cpuCoreLabel(totals.cpu),
    },
    {
      value: formatResourceNumber(totals.ram),
      label: "RAM",
      unit: "GB",
    },
    {
      value: formatResourceNumber(totals.disc),
      label: "Disk (SSD)",
      unit: "GB",
    },
  ];

  const rowY = y + 32;
  const captionY = rowY + 30;
  const gridLeft = pad;
  const gridRight = width - pad;
  const gridW = gridRight - gridLeft;

  if (gridW >= 520) {
    const totalsW = Math.floor(gridW * 0.44);
    const sigmaW = 22;
    const gap = 12;
    const priceW = 96;
    const totalsX = gridLeft;
    const sigmaX = totalsX + totalsW + gap;
    const priceX = sigmaX + sigmaW + gap;
    const plusX = priceX + priceW + 4;
    const addonX = gridRight;

    drawMetricColumns(ctx, totalsX, rowY, totalsW, metrics, 20);

    ctx.font = `500 18px ${FONT}`;
    ctx.fillStyle = COLORS.sumIcon;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Σ", sigmaX + sigmaW / 2, rowY + 2);
    ctx.textAlign = "left";

    drawPriceAmount(ctx, priceX, rowY + 2, cost.amount, cost.decimal);

    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = COLORS.sumIcon;
    ctx.fillText("+", plusX, rowY + 2);

    drawAddonAmount(ctx, addonX, rowY + 2, packagePrice);

    drawFooterCaption(ctx, ["Resources cost", "per month"], priceX, captionY, priceW, "left");
    drawFooterCaption(
      ctx,
      [`${packageName} pkg.`, "per month"],
      addonX,
      captionY,
      96,
      "right",
    );
  } else {
    drawMetricColumns(ctx, gridLeft, rowY, gridW, metrics, 18);
    drawPriceAmount(ctx, gridLeft, rowY + 44, cost.amount, cost.decimal);

    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = COLORS.sumIcon;
    ctx.fillText("+", gridLeft + 8, rowY + 92);
    drawAddonAmount(ctx, gridRight, rowY + 96, packagePrice);

    drawFooterCaption(ctx, ["Resources cost per month"], gridLeft, rowY + 72, gridW, "left");
    drawFooterCaption(
      ctx,
      [`${packageName} pkg. per month`],
      gridRight,
      rowY + 118,
      gridW,
      "right",
    );
  }
}

export function measureResourcesDiagram(
  options: Pick<DrawOptions, "config" | "width">,
): number {
  const services = displayServices(options.config);
  return computeLayout(options.width, services.length).height;
}

export function drawResourcesDiagram(ctx: CanvasRenderingContext2D, options: DrawOptions): number {
  const { config, highlightOversized = false, width } = options;
  const services = displayServices(config);
  const layout = computeLayout(width, services.length);
  const centerX = width / 2;

  ctx.clearRect(0, 0, width, layout.height);

  let y = layout.pad;
  drawCoreBlock(ctx, config.projectMode, centerX, y, layout.coreW);
  y += 96 + 24;

  const gridX = layout.pad;
  services.forEach((service, index) => {
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    const x = gridX + col * (layout.cardW + layout.gap);
    const cardY = y + row * (layout.cardH + layout.gap);
    drawServiceCard(
      ctx,
      service,
      x,
      cardY,
      layout.cardW,
      layout.cardH,
      highlightOversized && !!service.oversizedInDev,
    );
  });

  const rows = Math.ceil(services.length / layout.cols);
  y += rows * layout.cardH + Math.max(0, rows - 1) * layout.gap + 32;
  drawFooter(ctx, config, services, layout, width, y);

  return layout.height;
}
