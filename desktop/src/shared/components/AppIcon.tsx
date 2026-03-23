import type { CSSProperties } from "react";

export type AppIconName =
  | "workspace"
  | "projects"
  | "catalog"
  | "templates"
  | "runs"
  | "settings"
  | "browser"
  | "layers"
  | "toolbox"
  | "inspector"
  | "parameters"
  | "ai"
  | "visibility"
  | "visibility-off"
  | "rename"
  | "delete"
  | "up"
  | "down"
  | "chevron-right"
  | "chevron-down"
  | "base-layer"
  | "ee-layer"
  | "local-layer";

function pathForIcon(name: AppIconName) {
  switch (name) {
    case "workspace":
      return (
        <>
          <rect x="3" y="4" width="7" height="7" rx="1" />
          <rect x="14" y="4" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      );
    case "projects":
    case "browser":
      return (
        <>
          <path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M3 9h18" />
        </>
      );
    case "catalog":
      return (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      );
    case "templates":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </>
      );
    case "runs":
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </>
      );
    case "layers":
      return (
        <>
          <path d="M12 4 4 8l8 4 8-4-8-4Z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </>
      );
    case "toolbox":
      return (
        <>
          <rect x="4" y="7" width="16" height="11" rx="1" />
          <path d="M9 7V5h6v2M12 11v4M10 13h4" />
        </>
      );
    case "inspector":
      return (
        <>
          <circle cx="11" cy="11" r="5" />
          <path d="m15 15 5 5" />
        </>
      );
    case "parameters":
      return (
        <>
          <path d="M5 6h14M5 12h14M5 18h14" />
          <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
        </>
      );
    case "ai":
      return (
        <>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="M18 4v4M16 6h4" />
        </>
      );
    case "visibility":
      return (
        <>
          <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      );
    case "visibility-off":
      return (
        <>
          <path d="M2.5 12S6 6.5 12 6.5c2.3 0 4.2.8 5.8 1.8" />
          <path d="M21.5 12S18 17.5 12 17.5c-2.3 0-4.2-.8-5.8-1.8" />
          <path d="M4 4l16 16" />
        </>
      );
    case "rename":
      return (
        <>
          <path d="m5 19 3.5-.7L19 7.8 16.2 5 5.7 15.5 5 19Z" />
          <path d="m14.8 6.4 2.8 2.8" />
        </>
      );
    case "delete":
      return (
        <>
          <path d="M5 7h14M9 7V5h6v2M8 7v12M16 7v12M6 7l1 13h10l1-13" />
        </>
      );
    case "up":
      return <path d="m12 6-5 6h10l-5-6Z" fill="currentColor" stroke="none" />;
    case "down":
      return <path d="m12 18 5-6H7l5 6Z" fill="currentColor" stroke="none" />;
    case "chevron-right":
      return <path d="m9 6 6 6-6 6" />;
    case "chevron-down":
      return <path d="m6 9 6 6 6-6" />;
    case "base-layer":
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="1" />
          <path d="M4 15h16" />
        </>
      );
    case "ee-layer":
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="1" />
          <path d="M8 9h8M8 12h8M8 15h5" />
        </>
      );
    case "local-layer":
      return (
        <>
          <path d="M6 4h8l4 4v12H6V4Z" />
          <path d="M14 4v4h4" />
        </>
      );
    default:
      return null;
  }
}

export function AppIcon(props: {
  name: AppIconName;
  className?: string;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={props.className}
      style={props.style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props.title ? undefined : true}
      role={props.title ? "img" : undefined}
    >
      {props.title ? <title>{props.title}</title> : null}
      {pathForIcon(props.name)}
    </svg>
  );
}
