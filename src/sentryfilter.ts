// Pure helpers for src/sentry.ts. No imports, so the Node unit test (tests/sentry_filter.cjs) can compile and run them without a browser.

/** Hosts that count as "local dev": events and transactions from these are dropped unless VITE_SENTRY_DEV=1. */
export function isLocalHost(host: string | null | undefined): boolean {
  const h = String(host ?? '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true; // file:// or no window.location: never report
  return h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0' || h === '::1' || /^127(\.\d{1,3}){3}$/.test(h);
}

/** True when Sentry should drop everything (local host and no explicit VITE_SENTRY_DEV=1 opt-in). */
export function shouldDrop(host: string | null | undefined, devFlag: string | boolean | null | undefined): boolean {
  return isLocalHost(host) && !(devFlag === true || devFlag === '1' || devFlag === 'true');
}

/** Normalises a tag value. Returns null for missing values so callers can skip them. Sentry caps tag values at 200 chars. */
export function tagValue(v: unknown): string | null {
  if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) return null;
  const s = String(v).trim();
  return s ? s.slice(0, 200) : null;
}
