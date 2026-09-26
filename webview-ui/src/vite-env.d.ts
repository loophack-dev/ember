/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMBERS_API_BASE?: string
  readonly VITE_EMBERS_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
