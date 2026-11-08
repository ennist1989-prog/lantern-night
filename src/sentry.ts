// Sentry (browser SDK). Must be imported first in main.ts so it initialises before Phaser.
// The DSN comes only from the env (VITE_SENTRY_DSN in .env or the shell). Without one, nothing is initialised or sent.
// Events and transactions from localhost/127.0.0.1 are dropped unless the build sets VITE_SENTRY_DEV=1.
import * as Sentry from '@sentry/browser';
import { browserTracingIntegration } from '@sentry/browser';
import { shouldDrop, tagValue } from './sentryfilter';

declare const __APP_RELEASE__: string; // injected by vite.config.ts `define`: lantern-night@<package version>+<short sha | nogit>

const env = import.meta.env;
const dsn = env.VITE_SENTRY_DSN;
const prod = env.PROD;
const host = typeof location !== 'undefined' ? location.hostname : '';
const drop = shouldDrop(host, env.VITE_SENTRY_DEV);
export const release = typeof __APP_RELEASE__ === 'string' ? __APP_RELEASE__ : 'lantern-night@unknown';
export const enabled = !!dsn;

if (dsn) {
  Sentry.init({
    dsn,
    release,
    environment: env.VITE_SENTRY_ENV || env.MODE || 'development',
    // On a dropped host, also leave out the session integration so local runs don't add sessions to release health.
    integrations: (defaults) => [...(drop ? defaults.filter((i) => i.name !== 'BrowserSession') : defaults), browserTracingIntegration()],
    tracesSampleRate: drop ? 0 : prod ? 0.1 : 0,
    beforeSend: (event) => (drop ? null : withGameTags(event)),
    beforeSendTransaction: (event) => (drop ? null : withGameTags(event)),
  });
}

// ---------------------------------------------------------------- game-context tags (map / chapter / scene / realm)
type GameTag = 'map' | 'chapter' | 'scene' | 'realm';
const current: Partial<Record<GameTag, string>> = {};
let snapshot: (() => Partial<Record<GameTag, unknown>>) | null = null;

/** Set a game-context tag when it changes. Cheap and null-safe; a no-op without a DSN. */
export function setGameTag(key: GameTag, value: unknown): void {
  try {
    const v = tagValue(value);
    if (v === null || current[key] === v) return;
    current[key] = v;
    if (enabled) Sentry.setTag(key, v);
  } catch { /* never let telemetry break the game */ }
}

/** Register a getter that is read again just before each event is sent, so tags are never stale. */
export function setGameContextProvider(fn: () => Partial<Record<GameTag, unknown>>): void { snapshot = fn; }

function withGameTags<T extends { tags?: Record<string, unknown> }>(event: T): T {
  try {
    const s = snapshot?.() || {};
    for (const k of Object.keys(s) as GameTag[]) setGameTag(k, s[k]);
    event.tags = { ...(event.tags || {}), ...current }; // scope tags were applied before beforeSend; overwrite them with the fresh values
  } catch { /* ignore */ }
  return event;
}

export { Sentry };
