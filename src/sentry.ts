// Sentry error monitoring + tracing. Imported FIRST from src/main.ts so it is
// initialized before Phaser or any game module loads.
// Opt-in only: set VITE_SENTRY_DSN in .env (see .env.example). No hardcoded DSN.
import * as Sentry from '@sentry/browser';

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();

if (dsn) {
  const prod = import.meta.env.PROD === true || import.meta.env.MODE === 'production';
  Sentry.init({
    dsn,
    release: 'lantern-night@0.1.0',
    environment: import.meta.env.MODE || 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: prod ? 0.1 : 0,
  });
}

export { Sentry };
