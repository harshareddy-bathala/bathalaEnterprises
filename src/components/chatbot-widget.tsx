"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "bot"; content: string };

const CHAT_CLIENT_ID_STORAGE_KEY = "bathala-chat-client-id";
const CHAT_CLIENT_ID_HEADER = "x-chat-client-id";

function createChatClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateChatClientId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(CHAT_CLIENT_ID_STORAGE_KEY);
    if (existing && existing.length >= 8 && existing.length <= 128) {
      return existing;
    }

    const created = createChatClientId();
    window.localStorage.setItem(CHAT_CLIENT_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export default function ChatbotWidget() {
  const shouldReduceMotion = useReducedMotionPreference();
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [chatViewportHeight, setChatViewportHeight] = useState<number | null>(null);
  const [lockedPanelHeight, setLockedPanelHeight] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi there! 👋 I'm the Bathala AI Assistant. I can help you with information about our properties, services, locations, and pricing. What would you like to know?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRequestInProgress = useRef(false);
  const previousMessageCount = useRef(messages.length);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [messages, shouldReduceMotion]);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      const latest = messages[messages.length - 1];
      if (!open && latest?.role === "bot") {
        setHasUnread(true);
      }
    }
    previousMessageCount.current = messages.length;
  }, [messages, open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      const visualHeight = window.visualViewport?.height ?? window.innerHeight;
      setChatViewportHeight(Math.max(320, Math.round(visualHeight)));
      setIsCompactViewport(window.innerWidth < 640);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!open || !isCompactViewport || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [open, isCompactViewport]);

  const sendMessage = async (rawMessage: string) => {
    const userMessage = rawMessage.trim();
    if (!userMessage || isLoading || isRequestInProgress.current) {
      return;
    }

    const historySnapshot = messages.slice(-6);
    setMessages((prev) => [...prev, { role: "user" as const, content: userMessage }]);
    setIsLoading(true);
    isRequestInProgress.current = true;

    try {
      const chatClientId = getOrCreateChatClientId();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (chatClientId) {
        headers[CHAT_CLIENT_ID_HEADER] = chatClientId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage, history: historySnapshot }),
      });

      const data = await response.json();
      const reply =
        (typeof data?.reply === "string" && data.reply) ||
        (typeof data?.data?.reply === "string" && data.data.reply) ||
        "I apologize, but I couldn't process that request. Please try again or contact us directly.";

      setMessages((prev) => [...prev, {
        role: "bot",
        content: reply,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        role: "bot",
        content: "I'm having trouble connecting right now. Please try again later or contact us at +91 98765 43210."
      }]);
    } finally {
      setIsLoading(false);
      isRequestInProgress.current = false;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const outgoing = input;
    setInput("");
    await sendMessage(outgoing);
  };

  const handleSuggestedQuestion = async (question: string) => {
    setShowPopup(false);
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerClasses = useMemo(
    () => "fixed right-3 z-40 flex flex-col items-end gap-3 text-sm transition-all duration-300 sm:right-6",
    []
  );

  const containerStyle = useMemo(
    () => ({ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.9rem)" }),
    []
  );

  const topSafeOffset = useMemo(() => (isCompactViewport ? 84 : 92), [isCompactViewport]);
  const launcherReservedHeight = 72;
  const bottomReservedHeight = 14;

  const mobileWindowHeight = useMemo(() => {
    if (!isCompactViewport || !chatViewportHeight) {
      return null;
    }

    const availableHeight = chatViewportHeight - topSafeOffset - bottomReservedHeight - launcherReservedHeight;
    return Math.max(320, Math.min(620, availableHeight));
  }, [bottomReservedHeight, chatViewportHeight, isCompactViewport, launcherReservedHeight, topSafeOffset]);

  const desktopWindowHeight = useMemo(() => {
    if (isCompactViewport || !chatViewportHeight) {
      return null;
    }

    const availableHeight = chatViewportHeight - topSafeOffset - bottomReservedHeight - launcherReservedHeight;
    return Math.max(360, Math.min(620, availableHeight));
  }, [bottomReservedHeight, chatViewportHeight, isCompactViewport, launcherReservedHeight, topSafeOffset]);

  useEffect(() => {
    const targetHeight = isCompactViewport ? mobileWindowHeight : desktopWindowHeight;

    if (!open) {
      setLockedPanelHeight(null);
      return;
    }

    if (!targetHeight) {
      return;
    }

    setLockedPanelHeight((current) => {
      if (current === null) {
        return targetHeight;
      }

      if (Math.abs(current - targetHeight) >= 140) {
        return targetHeight;
      }

      return current;
    });
  }, [desktopWindowHeight, isCompactViewport, mobileWindowHeight, open]);

  const chatWindowStyle = useMemo(() => {
    const targetPanelHeight = isCompactViewport ? mobileWindowHeight : desktopWindowHeight;
    const effectiveHeight = open ? lockedPanelHeight ?? targetPanelHeight : targetPanelHeight;

    if (!effectiveHeight) {
      return undefined;
    }

    return {
      height: `${effectiveHeight}px`,
      maxHeight: `${effectiveHeight}px`,
    };
  }, [desktopWindowHeight, isCompactViewport, lockedPanelHeight, mobileWindowHeight, open]);

  const suggestedQuestions = [
    "What properties are available?",
    "Tell me about your services",
    "What areas do you cover?",
  ];

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            id="bathala-chat-dialog"
            role="dialog"
            aria-modal="false"
            aria-label="Bathala AI Chat"
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
              isCompactViewport
                ? "w-[calc(100vw-1rem)] max-w-none"
                : "w-80 max-w-[calc(100vw-2rem)] sm:w-96"
            )}
            style={chatWindowStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ece7de] bg-[#f8f6f2] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f1e5]">
                  <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a1f2e]">Bathala AI</p>
                  <p className="text-xs text-[#9ca3af]">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 transition hover:bg-[#efebe4]"
              >
                <span className="material-symbols-outlined text-lg text-[#6b7280]">close</span>
              </button>
            </div>

            {/* Messages */}
            <div
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#fbfaf7] px-4 py-3 [touch-action:pan-y]"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={
                    shouldReduceMotion
                      ? false
                      : msg.role === "user"
                        ? { opacity: 0, y: 8, x: 10 }
                        : { opacity: 0, y: 8, x: -10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-primary"
                      : "border border-[#e8e4dc] bg-white"
                  }`}>
                    <span className={`material-symbols-outlined text-xs ${msg.role === "user" ? "text-[#2c3340]" : "text-[#6b7280]"}`}>
                      {msg.role === "user" ? "person" : "smart_toy"}
                    </span>
                  </div>
                  <span
                    className={
                      msg.role === "user"
                        ? "inline-block max-w-[75%] break-words rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-xs text-[#2c3340]"
                        : "inline-block max-w-[75%] break-words rounded-2xl rounded-tl-sm border border-[#e8e4dc] bg-white px-4 py-2 text-xs text-[#4a5568]"
                    }
                  >
                    {msg.content}
                  </span>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="flex gap-2"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#e8e4dc] bg-white">
                    <span className="material-symbols-outlined text-xs text-[#6b7280]">smart_toy</span>
                  </div>
                  <div className="inline-block rounded-2xl rounded-tl-sm border border-[#e8e4dc] bg-white px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="border-t border-[#ece7de] bg-[#f8f6f2] px-4 py-2">
                <p className="mb-2 text-xs text-[#9ca3af]">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void handleSuggestedQuestion(q)}
                      aria-label={`Use suggested question: ${q}`}
                      className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-[#8f7445] transition hover:bg-primary/20"
                      disabled={isLoading}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-[#ece7de] bg-white p-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about properties, services..."
                aria-label="Type your chat message"
                className="min-h-[40px] max-h-24 resize-none text-xs"
                disabled={isLoading}
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="self-end flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Message */}
      <AnimatePresence>
        {showPopup && !open && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2 }}
            className="absolute bottom-20 right-0 max-w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold text-[#1a1f2e]">Need help finding a property?</p>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="rounded-full p-1 text-[#7b8593] hover:bg-[#f3eee5]"
                aria-label="Dismiss assistant hint"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        type="button"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
        onClick={() => {
          setOpen((v) => !v);
          setShowPopup(false);
          setHasUnread(false);
        }}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[#2c3340] shadow-lg shadow-primary/30 transition-[transform,box-shadow] duration-150 hover:shadow-primary/35",
          hasUnread && !open ? "animate-attention-pulse" : ""
        )}
        aria-controls="bathala-chat-dialog"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open chat"
      >
        <span className="material-symbols-outlined text-2xl">chat</span>
      </motion.button>
    </div>
  );
}