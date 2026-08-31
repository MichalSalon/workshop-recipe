// Shared animation loop for canvas-based bar icons (ported from @zerops/zui).

const KF_CPU: readonly (readonly [number, number])[] = [
  [0, 0.4],
  [0.08, 0.42],
  [0.18, 0.68],
  [0.24, 0.75],
  [0.32, 0.52],
  [0.45, 0.44],
  [0.6, 0.48],
  [0.72, 0.58],
  [0.85, 0.43],
  [1, 0.4],
];

const KF_RAM: readonly (readonly [number, number])[] = [
  [0, 0.58],
  [0.2, 0.62],
  [0.4, 0.56],
  [0.6, 0.6],
  [0.8, 0.64],
  [1, 0.58],
];

const KF_DISK: readonly (readonly [number, number])[] = [
  [0, 0.38],
  [0.25, 0.42],
  [0.5, 0.36],
  [0.75, 0.4],
  [1, 0.38],
];

const ALL_KF = [KF_CPU, KF_RAM, KF_DISK];
const DURATIONS = [16, 23, 29];
const TRACK_COLOR = "rgba(216,215,215,0.4)";
const FILL_ALPHA = 0.7;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function sample(kf: readonly (readonly [number, number])[], frac: number): number {
  for (let i = 0; i < kf.length - 1; i++) {
    if (frac <= kf[i + 1][0]) {
      const seg = (frac - kf[i][0]) / (kf[i + 1][0] - kf[i][0]);
      return kf[i][1] + (kf[i + 1][1] - kf[i][1]) * easeInOut(seg);
    }
  }
  return kf[kf.length - 1][1];
}

export interface BarCanvasEntry {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  gap: number;
  r: number;
  dpr: number;
  phases: readonly [number, number, number];
  colors: readonly [string, string, string];
}

export function drawBarFrame(e: BarCanvasEntry, t: number): void {
  const { ctx, w, h, gap, r, dpr, phases, colors } = e;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h * 3 + gap * 2);

  for (let i = 0; i < 3; i++) {
    const y = i * (h + gap);
    const frac = ((t + phases[i]) / DURATIONS[i]) % 1;
    const fillW = w * sample(ALL_KF[i], frac);

    ctx.fillStyle = TRACK_COLOR;
    ctx.beginPath();
    ctx.roundRect(0, y, w, h, r);
    ctx.fill();

    if (fillW > 0.5) {
      ctx.globalAlpha = FILL_ALPHA;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.roundRect(0, y, fillW, h, r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

export function drawBarStatic(e: BarCanvasEntry): void {
  const { ctx, w, h, gap, r, dpr } = e;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h * 3 + gap * 2);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#9F9F9F";
    ctx.beginPath();
    ctx.roundRect(0, i * (h + gap), w, h, r);
    ctx.fill();
  }
}

let sharedIO: IntersectionObserver | null = null;
const ioMap = new Map<Element, BarCanvasEntry>();

function getIO(): IntersectionObserver {
  if (!sharedIO) {
    sharedIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const bar = ioMap.get(e.target);
          if (!bar) continue;
          if (e.isIntersecting) {
            loopRegister(bar);
          } else {
            loopUnregister(bar);
          }
        }
      },
      { rootMargin: "200px" },
    );
  }
  return sharedIO;
}

export function observeBarIcon(el: Element, entry: BarCanvasEntry): void {
  ioMap.set(el, entry);
  getIO().observe(el);
}

export function unobserveBarIcon(el: Element): void {
  const entry = ioMap.get(el);
  if (entry) loopUnregister(entry);
  ioMap.delete(el);
  sharedIO?.unobserve(el);
}

const active = new Set<BarCanvasEntry>();
let raf = 0;
let running = false;
let lastDraw = 0;

function loopRegister(e: BarCanvasEntry): void {
  active.add(e);
  if (!running) {
    running = true;
    tick();
  }
}

function loopUnregister(e: BarCanvasEntry): void {
  active.delete(e);
  if (!active.size) {
    running = false;
    cancelAnimationFrame(raf);
  }
}

function tick(): void {
  if (!running) return;
  raf = requestAnimationFrame(tick);

  const now = performance.now();
  if (now - lastDraw < 100) return;
  lastDraw = now;

  const t = now / 1000;
  for (const e of active) drawBarFrame(e, t);
}
