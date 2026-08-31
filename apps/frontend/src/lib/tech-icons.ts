import go from "@/assets/tech-icons/go.svg?raw";
import nats from "@/assets/tech-icons/nats.svg?raw";
import nginx from "@/assets/tech-icons/nginx.svg?raw";
import nodejs from "@/assets/tech-icons/nodejs.svg?raw";
import postgresql from "@/assets/tech-icons/postgresql.svg?raw";
import sqlite from "@/assets/tech-icons/sqlite.svg?raw";
import valkey from "@/assets/tech-icons/valkey.svg?raw";
import victorialogs from "@/assets/tech-icons/victorialogs.svg?raw";

const TECH_ICON_SVG: Record<string, string> = {
  go,
  nats,
  nginx,
  nodejs,
  postgresql,
  sqlite,
  static: nginx,
  valkey,
  victorialogs,
};

export function techIconSvg(id?: string): string | undefined {
  if (!id) return undefined;
  return TECH_ICON_SVG[id];
}
