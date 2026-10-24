/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  /** '1' = also report from localhost/127.0.0.1 (off by default). */
  readonly VITE_SENTRY_DEV?: string;
  /** Overrides the Sentry environment (default: Vite mode), e.g. 'qa-verify'. */
  readonly VITE_SENTRY_ENV?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
