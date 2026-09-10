import { Component, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/** The "Upscale" concierge — a public ElevenLabs agent locked to this origin,
 *  grounded in a knowledge base generated from the live catalog. */
const AGENT_ID = import.meta.env.VITE_VOICE_AGENT_ID as string | undefined;

/** Say this and the concierge wakes up. */
const WAKE_WORD = "upscale";
const WAKE_PREF_KEY = "dopamine.voice.wake";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  return r;
}

/** useConversation only works inside a provider, and a throw in here must never
 *  be able to blank the app — hence the wrapper and the boundary around it. */
export function VoiceAssistant() {
  if (!AGENT_ID) return null;
  return (
    <VoiceErrorBoundary>
      <ConversationProvider>
        <VoiceConcierge />
      </ConversationProvider>
    </VoiceErrorBoundary>
  );
}

function VoiceConcierge() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(() => {
    try {
      return localStorage.getItem(WAKE_PREF_KEY) === "on";
    } catch {
      return false;
    }
  });

  const conversation = useConversation({
    onDisconnect: () => setOpen(false),
    onError: () => {
      setConnecting(false);
      toast({
        title: "Voice unavailable",
        description: "Upscale couldn't connect. Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const active = conversation.status === "connected";
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wakeSupported = useRef(typeof window !== "undefined" && Boolean(getRecognition())).current;

  const startSession = useCallback(async () => {
    if (!AGENT_ID || connecting || active) return;
    setConnecting(true);
    setOpen(true);
    // Stop the wake-word listener first — two consumers of the mic at once
    // makes both of them flaky.
    recognitionRef.current?.abort();
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({ agentId: AGENT_ID, connectionType: "webrtc" });
    } catch {
      toast({
        title: "Microphone needed",
        description: "Allow microphone access to talk to Upscale.",
        variant: "destructive",
      });
      setOpen(false);
    } finally {
      setConnecting(false);
    }
  }, [conversation, connecting, active]);

  const endSession = useCallback(() => {
    try {
      conversation.endSession();
    } catch {
      /* already closed */
    }
    setOpen(false);
  }, [conversation]);

  // Wake-word listening. Opt-in and remembered, never on by default — an
  // always-open microphone is the viewer's call to make, not ours.
  const offDuty = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    if (!wakeEnabled || !wakeSupported || active || connecting || offDuty) return;

    const rec = getRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    let stopped = false;

    rec.onresult = (e) => {
      const said = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .toLowerCase();
      // An episode's own dialogue must not summon the concierge, so ignore the
      // wake word while a video is audibly playing.
      const videoPlaying = Array.from(document.querySelectorAll("video")).some(
        (v) => !v.paused && !v.muted && v.volume > 0,
      );
      if (said.includes(WAKE_WORD) && !videoPlaying) {
        stopped = true;
        rec.abort();
        startSession();
      }
    };
    // Chrome ends recognition every ~60s of quiet; restart so it keeps listening.
    rec.onend = () => {
      if (!stopped) {
        try {
          rec.start();
        } catch {
          /* already starting */
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        setWakeEnabled(false);
        toast({
          title: "Microphone blocked",
          description: "Allow the mic to wake Upscale by voice, or just tap the button.",
        });
      }
    };

    try {
      rec.start();
    } catch {
      /* a previous instance is still shutting down */
    }
    return () => {
      stopped = true;
      rec.onend = null;
      rec.abort();
      recognitionRef.current = null;
    };
  }, [wakeEnabled, wakeSupported, active, connecting, offDuty, startSession]);

  const toggleWake = () => {
    setWakeEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem(WAKE_PREF_KEY, next ? "on" : "off");
      } catch {
        /* private mode */
      }
      if (next) {
        toast({ title: 'Listening for "Upscale"', description: "Say it any time and I'll pick up." });
      }
      return next;
    });
  };

  // The concierge is for viewers — it has no business on auth or admin screens.
  if (offDuty) return null;

  return (
    <>
      {/* Launcher. Deliberately small and hugging the corner: cover art is the
          product here, so the concierge never spreads a label across it.
          Long-press (or right-click) toggles wake-word listening. */}
      <div className="fixed right-3 bottom-24 z-[60] flex flex-col items-end gap-2">
        <motion.button
          onClick={active ? endSession : startSession}
          onContextMenu={(e) => {
            if (!wakeSupported) return;
            e.preventDefault();
            toggleWake();
          }}
          whileTap={{ scale: 0.9 }}
          aria-label={active ? "End voice chat" : 'Talk to Upscale — long-press to listen for the wake word'}
          className={cn(
            "relative w-11 h-11 rounded-full bg-gradient-button flex items-center justify-center shadow-lg",
            wakeEnabled && "ring-2 ring-liquid-gold/60",
          )}
        >
          {wakeEnabled && !active && (
            <motion.span
              className="absolute inset-0 rounded-full bg-electric-violet/40"
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          )}
          {connecting ? (
            <Loader2 className="w-6 h-6 text-pure-white animate-spin" />
          ) : active ? (
            <MicOff className="w-6 h-6 text-pure-white" />
          ) : (
            <Mic className="w-6 h-6 text-pure-white" />
          )}
        </motion.button>
      </div>

      {/* Live session panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="voice-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-4 bottom-40 z-[60] mx-auto max-w-sm rounded-2xl bg-deep-space/95 backdrop-blur-xl border border-pure-white/10 p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-gradient-button flex items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-neon-magenta/40"
                    animate={
                      conversation.isSpeaking
                        ? { scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }
                        : { scale: 1, opacity: 0 }
                    }
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                  <Mic className="w-4 h-4 text-pure-white relative" />
                </div>
                <div>
                  <p className="font-accent font-semibold text-sm text-pure-white">Upscale</p>
                  <p className="font-body text-xs text-chrome-silver">
                    {connecting
                      ? "Connecting…"
                      : conversation.isSpeaking
                        ? "Speaking…"
                        : active
                          ? "Listening — ask me anything"
                          : "Ending…"}
                  </p>
                </div>
              </div>
              <button onClick={endSession} aria-label="Close voice chat" className="p-1">
                <X className="w-5 h-5 text-chrome-silver" />
              </button>
            </div>

            <p className="mt-3 font-body text-xs text-chrome-silver/80 leading-relaxed">
              Ask for a recommendation, what a series is about, how the free episodes work,
              or how to install the app.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}

/**
 * The concierge is a nice-to-have bolted onto a streaming app. If its SDK
 * throws, the app must keep playing video — so it fails silently to nothing
 * rather than taking the tree down with it.
 */
class VoiceErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Voice concierge unavailable:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
