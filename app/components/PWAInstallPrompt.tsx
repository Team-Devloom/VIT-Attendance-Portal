"use client";

import "./pwa.css";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="pwa-root">
      <div className="pwa-content">
        <div className="pwa-text">
          <span className="pwa-title">Install VIT Attendance</span>
          <span className="pwa-subtitle">Get notifications and more.</span>
        </div>

        <div className="pwa-actions">
          <button className="pwa-install-btn" onClick={install}>
            Download App
          </button>
          <button className="pwa-dismiss-btn" onClick={() => setVisible(false)}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
