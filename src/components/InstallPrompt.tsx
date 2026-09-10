import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, Download } from "lucide-react";

const DISMISS_KEY = "dopamine.install.dismissedAt";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // re-ask after a week

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
  !(window as unknown as { MSStream?: unknown }).MSStream;

/**
 * "Add Dopamine to your home screen" sheet.
 * Android/Chrome gets the real one-tap install; iOS Safari gets the
 * Share → Add to Home Screen walkthrough (Apple has no install API).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < SNOOZE_MS) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // keep the mini-infobar away; we show our own
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2500); // let them watch a beat first
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires beforeinstallprompt — offer the manual path
    let iosTimer: ReturnType<typeof setTimeout>;
    if (isIos()) {
      setIosMode(true);
      iosTimer = setTimeout(() => setShow(true), 4000);
    }

    const onInstalled = () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setShow(false);
    else dismiss();
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-deep-space/70 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[96] rounded-t-3xl bg-obsidian border-t-2 border-electric-violet/30 px-6 pt-3 pb-8 md:max-w-md md:mx-auto md:bottom-8 md:rounded-3xl md:border-2"
          >
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
            </div>

            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
              aria-label="Not now"
            >
              <X className="w-4 h-4 text-chrome-silver" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src="/icons/icon-192.png"
                alt="Dopamine"
                className="w-16 h-16 rounded-2xl shadow-glow-magenta flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-display text-lg text-pure-white uppercase tracking-tight">
                  Add Dopamine to your home screen
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Full screen, instant launch, no browser bar.
                </p>
              </div>
            </div>

            {iosMode ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-deep-space border border-chrome-silver/10 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-electric-violet/20 text-electric-violet text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <span className="text-sm text-chrome-silver flex items-center gap-1.5">
                      Tap <Share className="w-4 h-4 text-electric-violet inline" /> in the toolbar
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-electric-violet/20 text-electric-violet text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <span className="text-sm text-chrome-silver flex items-center gap-1.5">
                      Choose <Plus className="w-4 h-4 text-electric-violet inline" /> Add to Home Screen
                    </span>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-2xl border border-chrome-silver/20 text-sm font-medium text-chrome-silver"
                >
                  Got it
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <motion.button
                  onClick={install}
                  className="w-full h-14 rounded-2xl bg-gradient-button shadow-glow-magenta flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5 text-pure-white" />
                  <span className="font-display text-base text-pure-white uppercase tracking-wide">
                    Add to Home Screen
                  </span>
                </motion.button>
                <button
                  onClick={dismiss}
                  className="w-full py-2.5 text-sm text-muted-foreground"
                >
                  Not now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
