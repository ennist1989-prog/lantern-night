// Sentry error monitoring + tracing. Imported FIRST from src/main.ts so it is
// initialized before Phaser or any game module loads.
// The DSN is a public client key; it can be overridden with VITE_SENTRY_DSN (see .env.example).
import * as Sentry from '@sentry/browser';

const DEFAULT_DSN = 'https://5ff3be018e9345a6ff2db0394c206841@o4512284006547456.ingest.us.sentry.io/4512284026863616';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || DEFAULT_DSN,
  release: 'lantern-night@0.1.0',
  environment: import.meta.env.MODE || 'development',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

export { Sentry };
