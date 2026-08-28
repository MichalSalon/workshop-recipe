/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WORKSHOP_ENV?: "dev" | "prod";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
