import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { messages, type Locale, type MessageKey } from "./catalog";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider(props: { locale: Locale; setLocale: (locale: Locale) => void; children: ReactNode }) {
  const value: I18nContextValue = {
    locale: props.locale,
    setLocale: props.setLocale,
    t: (key) => messages[props.locale][key]
  };

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
