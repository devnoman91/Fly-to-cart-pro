import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_LOCALE,
  en,
  messages,
  type Locale,
  type MessageKey,
} from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export type TFunction = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

// useT returns a translate function `t(key, vars?)`. Missing keys in the active
// locale fall back to English; `{name}`-style placeholders are interpolated.
export function useT(): TFunction {
  const locale = useContext(LocaleContext);
  return useMemo<TFunction>(() => {
    const catalog = messages[locale] ?? {};
    return (key, vars) => {
      let str = catalog[key] ?? en[key] ?? key;
      if (vars) {
        for (const name of Object.keys(vars)) {
          str = str.replace(`{${name}}`, String(vars[name]));
        }
      }
      return str;
    };
  }, [locale]);
}
