import React from "react";
import { usePWAInstallState } from "./usePWAInstall.js";

/**
 * Fixed-position install banner. Renders nothing (returns null) unless:
 *  - the browser has signalled installability (beforeinstallprompt), or
 *  - we're on iOS/Safari and want to show "Add to Home Screen" instructions
 * and only while the app is not already running standalone / not dismissed.
 */
export default function InstallPrompt() {
  const { canInstall, showIOSHint, showBanner, install, dismiss } = usePWAInstallState();

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Install BioVerse"
      data-testid="pwa-install-banner"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "18px",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "min(92vw, 420px)",
        background: "#0A1628",
        color: "#fff",
        borderRadius: "14px",
        padding: "14px 16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          flexShrink: 0,
          borderRadius: "10px",
          background: "linear-gradient(135deg,#10B981,#059669)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        🧬
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700 }}>Install BioVerse</div>
        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>
          {showIOSHint && !canInstall
            ? "Tap Share, then \u201cAdd to Home Screen\u201d"
            : "Add BioVerse to your home screen for quick access"}
        </div>
      </div>
      {canInstall ? (
        <button
          onClick={install}
          data-testid="pwa-install-button"
          style={{
            padding: "8px 14px",
            borderRadius: "9px",
            background: "#10B981",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Install
        </button>
      ) : null}
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        data-testid="pwa-install-dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: "16px",
          padding: "2px 4px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
