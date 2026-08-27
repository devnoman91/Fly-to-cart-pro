import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  en,
  messages,
  type Locale,
  type MessageKey,
} from "./messages";

// Resolve a Shopify-provided locale string (e.g. "es", "es-ES", "pt-BR", "de-AT")
// to one of our supported locales, falling back to English.
export function resolveLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const raw = input.trim();
  // Exact match first (covers region-specific locales like "pt-BR").
  if ((SUPPORTED_LOCALES as readonly string[]).includes(raw)) return raw as Locale;
  // Otherwise match on the base language (e.g. "es-ES" → "es", "de-AT" → "de").
  const base = raw.split("-")[0].toLowerCase();
  const match = SUPPORTED_LOCALES.find(
    (l) => l === base || l.split("-")[0].toLowerCase() === base,
  );
  return match ?? DEFAULT_LOCALE;
}

// Shopify appends the merchant's admin locale as a `locale` query param to embedded
// app requests. Read it from the request URL in a loader.
export function getRequestLocale(request: Request): Locale {
  const url = new URL(request.url);
  return resolveLocale(url.searchParams.get("locale"));
}

// Server-side translate — for loaders/actions that return user-facing strings
// (e.g. toast error messages). Same fallback rules as the client `useT`.
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let str = messages[locale]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const name of Object.keys(vars)) {
      str = str.replace(`{${name}}`, String(vars[name]));
    }
  }
  return str;
}

// Convenience: build a bound translate function from the request's locale.
export function getServerT(request: Request) {
  const locale = getRequestLocale(request);
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./messages";
export type { Locale, MessageKey } from "./messages";
