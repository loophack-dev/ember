/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMBERS_API_BASE?: string
  readonly VITE_EMBERS_API_TOKEN?: string
  readonly VITE_EMBERS_WEBSOCKET_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
