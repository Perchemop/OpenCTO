import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Soft install tip. Uses beforeinstallprompt when available; on iOS explains Add to Home Screen.
 * Dismiss is remembered in localStorage. Pure local — no analytics.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("opencto.install.v1") === "1") return;
    } catch {
      /* ignore */
    }
    if (isStandalone()) return;

    function onBip(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS has no beforeinstallprompt — show a short tip after a beat
    let timer: number | undefined;
    if (isIos()) {
      timer = window.setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem("opencto.install.v1", "1");
    } catch {
      /* ignore */
    }
    setShow(false);
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed right-3 bottom-3 z-50 max-w-sm rounded-lg border border-line bg-surface p-3 shadow-lg sm:right-4 sm:bottom-4">
      <p className="text-sm font-medium text-fg">Keep OpenCTO on this device</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {iosHint
          ? "On iPhone: Share → Add to Home Screen. The desk stays local in this browser — no account."
          : "Install for a full-screen desk. Work still stays in this browser only."}
      </p>
      <div className="mt-3 flex gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-accent px-3 text-sm font-medium text-ink"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-line px-3 text-sm text-muted"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
