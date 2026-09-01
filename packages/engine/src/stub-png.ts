import { crc32, deflateSync } from "node:zlib";

export const STUB_SLIDE_WIDTH = 1920;
export const STUB_SLIDE_HEIGHT = 1080;

const BG = { r: 20, g: 17, b: 14 };
const FG = { r: 244, g: 239, b: 230 };
const MUTED = { r: 184, g: 170, b: 150 };

/** 3×5 glyphs, row-major, 1 = pixel. Unknown chars draw a box. */
const GLYPHS: Record<string, string> = {
  " ": "000000000000000",
  "!": "010010010000010",
  '"': "101101000000000",
  "#": "101111101111101",
  "'": "010010000000000",
  "(": "001010010010001",
  ")": "100010010010100",
  "*": "101010111010101",
  ",": "000000000010100",
  "-": "000000111000000",
  ".": "000000000000010",
  "/": "001001010100100",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "111001111100111",
  "3": "111001111001111",
  "4": "101101111001001",
  "5": "111100111001111",
  "6": "111100111101111",
  "7": "111001010010010",
  "8": "111101111101111",
  "9": "111101111001111",
  ":": "000010000010000",
  "`": "100010000000000",
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101110110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "101111111111101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101110001",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101010",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
};

function chunk(type: string, data: Buffer): Buffer {
  const header = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header, data])) >>> 0);
  return Buffer.concat([length, header, data, crc]);
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(/\s+/);
  const rows: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) rows.push(current);
    current = word;
  }
  if (current) rows.push(current);
  return rows;
}

function slideLines(source: string): { title: string; body: string[] } {
  const raw = source
    .split("\n")
    .map((line) =>
      line
        .replace(/^#+\s*/, "")
        .replace(/^[*-]\s+/, "")
        .replace(/`+/g, "")
        .trim(),
    )
    .filter(Boolean);
  const [title = "Slide", ...rest] = raw;
  return { title, body: rest };
}

function setPixel(
  rows: Buffer,
  width: number,
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
): void {
  if (x < 0 || y < 0 || x >= width || y >= STUB_SLIDE_HEIGHT) return;
  const offset = y * (1 + width * 3) + 1 + x * 3;
  rows[offset] = color.r;
  rows[offset + 1] = color.g;
  rows[offset + 2] = color.b;
}

function drawChar(
  rows: Buffer,
  width: number,
  left: number,
  top: number,
  char: string,
  scale: number,
  color: { r: number; g: number; b: number },
): void {
  const bits = GLYPHS[char.toUpperCase()] ?? "111101101101111";
  for (let gy = 0; gy < 5; gy += 1) {
    for (let gx = 0; gx < 3; gx += 1) {
      if (bits[gy * 3 + gx] !== "1") continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          setPixel(rows, width, left + gx * scale + dx, top + gy * scale + dy, color);
        }
      }
    }
  }
}

function drawString(
  rows: Buffer,
  width: number,
  left: number,
  top: number,
  text: string,
  scale: number,
  color: { r: number; g: number; b: number },
): void {
  const advance = 4 * scale;
  for (let i = 0; i < text.length; i += 1) {
    drawChar(rows, width, left + i * advance, top, text[i] ?? " ", scale, color);
  }
}

export function renderStubSlidePng(
  source: string,
  index: number,
  total: number,
): Buffer {
  const width = STUB_SLIDE_WIDTH;
  const height = STUB_SLIDE_HEIGHT;
  const rows = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 3);
    rows[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const o = row + 1 + x * 3;
      rows[o] = BG.r;
      rows[o + 1] = BG.g;
      rows[o + 2] = BG.b;
    }
  }

  const { title, body } = slideLines(source);
  const padX = 120;
  const titleScale = 14;
  const bodyScale = 7;
  const titleWidth = Math.floor((width - padX * 2) / (4 * titleScale));
  const bodyWidth = Math.floor((width - padX * 2) / (4 * bodyScale));

  let y = 360;
  for (const line of wrapLine(title, titleWidth)) {
    drawString(rows, width, padX, y, line, titleScale, FG);
    y += 6 * titleScale;
  }
  y += 36;
  for (const paragraph of body) {
    for (const line of wrapLine(paragraph, bodyWidth)) {
      drawString(rows, width, padX, y, line, bodyScale, MUTED);
      y += 6 * bodyScale;
      if (y > height - 120) break;
    }
    y += 12;
    if (y > height - 120) break;
  }

  const meta = `${index + 1} / ${total}`;
  const metaScale = 5;
  const metaX = width - padX - meta.length * 4 * metaScale;
  drawString(rows, width, metaX, height - 80, meta, metaScale, MUTED);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows, { level: 4 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}
