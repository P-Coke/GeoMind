import { EarthEngineConnectionPanel } from "../project/EarthEngineConnectionPanel";
import { useEffect, useState } from "react";
import type { AIConfigStatus, BrowserLoginStartResponse, GeeAuthStatus } from "../../shared/types";
import type { Locale } from "../../shared/i18n/catalog";
import { useI18n } from "../../shared/i18n";

export function SettingsPage(props: {
  locale: Locale;
  authStatus?: GeeAuthStatus;
  aiConfigStatus?: AIConfigStatus;
  browserLogin?: BrowserLoginStartResponse;
  onLocaleChange: (locale: Locale) => void;
  onSaveAiConfig: (payload: { provider: "openai_compatible"; model: string; baseUrl?: string; apiKey?: string; enabled: boolean }) => void;
  onStartBrowserLogin: () => void;
  onCompleteBrowserLogin: (payload: { state: string; accountEmail?: string; projectId?: string }) => void;
  onLoginServiceAccount: (credentialsPath: string, projectId?: string) => void;
  onValidate: () => void;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const [model, setModel] = useState(props.aiConfigStatus?.model ?? "gpt-4.1-mini");
  const [baseUrl, setBaseUrl] = useState(props.aiConfigStatus?.baseUrl ?? "https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(props.aiConfigStatus?.enabled ?? false);

  useEffect(() => {
    setModel(props.aiConfigStatus?.model ?? "gpt-4.1-mini");
    setBaseUrl(props.aiConfigStatus?.baseUrl ?? "https://api.openai.com/v1");
    setEnabled(props.aiConfigStatus?.enabled ?? false);
  }, [props.aiConfigStatus?.model, props.aiConfigStatus?.baseUrl, props.aiConfigStatus?.enabled]);

  return (
    <div className="page-grid" data-testid="settings-page">
      <section className="card page-hero">
        <div className="panel-title">{t("page.settings.title")}</div>
        <p>{t("page.settings.subtitle")}</p>
      </section>
      <section className="card">
        <div className="panel-title">{t("settings.language")}</div>
        <select aria-label={t("settings.language")} value={props.locale} onChange={(event) => props.onLocaleChange(event.target.value as Locale)}>
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>
      </section>
      <section className="card">
        <div className="panel-title">{t("settings.aiProvider")}</div>
        <div className="form-grid">
          <label>
            <span>{t("settings.aiProviderName")}</span>
            <input value="openai_compatible" disabled />
          </label>
          <label>
            <span>{t("settings.aiModel")}</span>
            <input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
          <label>
            <span>{t("settings.aiBaseUrl")}</span>
            <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </label>
          <label>
            <span>{t("settings.aiApiKey")}</span>
            <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={props.aiConfigStatus?.hasKey ? "Saved locally" : "sk-..."} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            <span>{t("settings.aiEnabled")}</span>
          </label>
        </div>
        <div className="info-callout">{props.aiConfigStatus?.message ?? t("settings.aiHint")}</div>
        <div className="button-row">
          <button
            type="button"
            onClick={() => props.onSaveAiConfig({ provider: "openai_compatible", model, baseUrl, apiKey: apiKey || undefined, enabled })}
          >
            {t("settings.aiSave")}
          </button>
        </div>
      </section>
      <EarthEngineConnectionPanel
        authStatus={props.authStatus}
        browserLogin={props.browserLogin}
        onStartBrowserLogin={props.onStartBrowserLogin}
        onCompleteBrowserLogin={props.onCompleteBrowserLogin}
        onLoginServiceAccount={props.onLoginServiceAccount}
        onValidate={props.onValidate}
        onLogout={props.onLogout}
      />
    </div>
  );
}
