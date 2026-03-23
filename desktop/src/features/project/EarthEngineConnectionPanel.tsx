import { useEffect, useState } from "react";
import type { BrowserLoginStartResponse, GeeAuthStatus } from "../../shared/types";
import { useI18n } from "../../shared/i18n";

declare global {
  interface Window {
    geeAiDesktop?: {
      platform?: string;
      saveFile?: (sourcePath: string, defaultName?: string) => Promise<{ cancelled: boolean; filePath?: string; error?: string }>;
      openExternal?: (url: string) => Promise<{ ok: boolean; error?: string }>;
      selectFile?: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{ cancelled: boolean; filePath?: string; error?: string }>;
    };
  }
}

export function EarthEngineConnectionPanel(props: {
  authStatus?: GeeAuthStatus;
  browserLogin?: BrowserLoginStartResponse;
  onStartBrowserLogin: () => void;
  onCompleteBrowserLogin: (payload: { state: string; accountEmail?: string; projectId?: string }) => void;
  onLoginServiceAccount: (credentialsPath: string, projectId?: string) => void;
  onValidate: () => void;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const [browserOpen, setBrowserOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [credentialsPath, setCredentialsPath] = useState("");
  const [projectId, setProjectId] = useState(props.authStatus?.projectId ?? "");
  const [accountEmail, setAccountEmail] = useState(props.authStatus?.accountEmail ?? "browser-user@example.com");

  useEffect(() => {
    setProjectId(props.authStatus?.projectId ?? "");
    setAccountEmail(props.authStatus?.accountEmail ?? "browser-user@example.com");
  }, [props.authStatus?.projectId, props.authStatus?.accountEmail]);

  useEffect(() => {
    if (!props.browserLogin) {
      return;
    }
    setBrowserOpen(true);
    if (window.geeAiDesktop?.openExternal) {
      void window.geeAiDesktop.openExternal(props.browserLogin.loginUrl);
    } else {
      window.open(props.browserLogin.loginUrl, "_blank", "noopener,noreferrer");
    }
  }, [props.browserLogin]);

  const chooseCredentialsFile = async () => {
    const result = await window.geeAiDesktop?.selectFile?.([
      { name: "Service Account JSON", extensions: ["json"] }
    ]);
    if (!result?.cancelled && result.filePath) {
      setCredentialsPath(result.filePath);
      setServiceOpen(true);
    }
  };

  return (
    <section className="card">
      <div className="panel-title">{t("auth.title")}</div>
      <div className="kv-list">
        <div><span>{t("auth.mode")}</span><strong>{props.authStatus?.mode ?? "none"}</strong></div>
        <div><span>{t("auth.status")}</span><strong>{props.authStatus?.authenticated ? t("toolbar.connected") : props.authStatus?.message ?? t("toolbar.disconnected")}</strong></div>
        <div><span>{t("auth.project")}</span><strong>{props.authStatus?.projectId ?? "-"}</strong></div>
      </div>

      <div className="button-row">
        <button type="button" onClick={props.onStartBrowserLogin}>{t("auth.browser")}</button>
        <button type="button" onClick={() => { setServiceOpen(true); void chooseCredentialsFile(); }}>{t("auth.serviceAccount")}</button>
        <button type="button" onClick={props.onValidate}>{t("auth.test")}</button>
        <button type="button" onClick={props.onLogout}>{t("auth.disconnect")}</button>
      </div>

      {browserOpen && props.browserLogin ? (
        <div className="tree-card">
          <div className="panel-title">{t("auth.browser")}</div>
          <input value={props.browserLogin.loginUrl} readOnly aria-label="Browser login URL" />
          <label>
            <span>{t("auth.accountEmail")}</span>
            <input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder={t("auth.accountEmail")} />
          </label>
          <label>
            <span>{t("auth.projectOptional")}</span>
            <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={t("auth.projectOptional")} />
          </label>
          <div className="button-row">
            <button type="button" onClick={() => props.onCompleteBrowserLogin({ state: props.browserLogin!.state, accountEmail, projectId })}>{t("auth.complete")}</button>
            <button type="button" onClick={() => setBrowserOpen(false)}>{t("basemap.cancel")}</button>
          </div>
        </div>
      ) : null}

      {serviceOpen ? (
        <div className="tree-card">
          <div className="panel-title">{t("auth.serviceAccount")}</div>
          <label>
            <span>{t("auth.path")}</span>
            <div className="button-row">
              <input value={credentialsPath} onChange={(e) => setCredentialsPath(e.target.value)} placeholder={t("auth.path")} />
              <button type="button" onClick={() => void chooseCredentialsFile()}>Browse</button>
            </div>
          </label>
          <label>
            <span>{t("auth.project")}</span>
            <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={t("auth.project")} />
          </label>
          <div className="button-row">
            <button type="button" onClick={() => props.onLoginServiceAccount(credentialsPath, projectId)} disabled={!credentialsPath}>{t("auth.serviceAccount")}</button>
            <button type="button" onClick={() => setServiceOpen(false)}>{t("basemap.cancel")}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
