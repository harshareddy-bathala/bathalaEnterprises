"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { role: "user" | "bot"; content: string };

const contextAwareFAQ: Record<string, string> = {
  security: "We provide 24/7 monitoring with trained responders and tiered escalation SLAs for all properties.",
  leasing: "We offer flexible lease terms from 12 to 60 months with fit-out support across Bangalore.",
  pricing: "Pricing is tailored to your needs. Submit the contact form and we will send a proposal within 24 hours.",
  bangalore: "We operate across all major areas of Bangalore including Whitefield, Indiranagar, Koramangala, HSR Layout, and more.",
  location: "Please visit our Contact page or check the footer for our office address and contact details.",
  properties: "Browse our Properties page to see our available properties for sale, lease, and rent across Bangalore.",
  services: "Our services include property management, advisory, maintenance, and security solutions. Visit our Services page for details.",
  contact: "Please use our contact form or visit the Contact page for inquiries. We typically respond within 24 hours.",
  default: "Thank you for reaching out to Bathala Enterprises! How can I assist you with your real estate needs today?"
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi there! 👋 I'm the Bathala AI Assistant. I can help you with information about our properties, services, and more. What would you like to know?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Show popup after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [open]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const reply = generateContextAwareReply(userMessage);
      setMessages((prev) => [...prev, { role: "bot", content: reply }]);
      setIsLoading(false);
    }, 500);
  };

  const generateContextAwareReply = (content: string): string => {
    const normalized = content.toLowerCase();

    // Check for exact matches
    if (normalized.includes("security")) return contextAwareFAQ.security;
    if (normalized.includes("lease") || normalized.includes("rent")) return contextAwareFAQ.leasing;
    if (normalized.includes("price") || normalized.includes("cost")) return contextAwareFAQ.pricing;
    if (normalized.includes("bangalore")) return contextAwareFAQ.bangalore;
    if (normalized.includes("location") || normalized.includes("address")) return contextAwareFAQ.location;
    if (normalized.includes("propert")) return contextAwareFAQ.properties;
    if (normalized.includes("service")) return contextAwareFAQ.services;
    if (normalized.includes("contact") || normalized.includes("call")) return contextAwareFAQ.contact;

    return contextAwareFAQ.default;
  };

  const containerClasses = useMemo(
    () => "fixed bottom-6 right-4 z-40 flex flex-col gap-3 text-sm sm:right-6 transition-all duration-300",
    []
  );

  return (
    <div className={containerClasses}>
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass-panel w-80 rounded-2xl border border-white/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/50 px-4 py-3 bg-gradient-to-r from-royal/5 to-purple/5">
              <div>
                <p className="text-sm font-bold text-royal">Bathala AI</p>
                <p className="text-xs text-slateInk">Context-aware assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1 hover:bg-white/60 transition"
              >
                <X className="h-4 w-4 text-slate-900" />
              </button>
            </div>

            {/* Messages */}
            <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={msg.role === "user" ? "text-right" : "text-left"}
                >
                  <span
                    className={
                      msg.role === "user"
                        ? "inline-block rounded-2xl bg-gradient-to-r from-royal to-purple px-4 py-2 text-xs text-white max-w-xs break-words"
                        : "inline-block rounded-2xl bg-white/80 px-4 py-2 text-xs text-slate-900 max-w-xs break-words"
                    }
                  >
                    {msg.content}
                  </span>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left"
                >
                  <div className="inline-block rounded-2xl bg-white/80 px-4 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-white/60 p-3 bg-white/40">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about properties..."
                className="min-h-[40px] resize-none text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleSend}
                disabled={isLoading}
                className="self-end"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Message */}
      <AnimatePresence>
        {showPopup && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 right-0 glass-panel rounded-2xl px-4 py-3 whitespace-nowrap border border-white/50 shadow-lg"
          >
            <p className="text-xs font-semibold text-slate-900">Any queries?</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button - Circular */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <button
          onClick={() => {
            setOpen((v) => !v);
            setShowPopup(false);
          }}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-royal to-purple text-white shadow-lg shadow-royal/40 hover:shadow-xl hover:shadow-purple/50 transition-all duration-300 border border-white/20"
          aria-label="Open chat"
        >
          <motion.div animate={open ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </motion.div>
        </button>
      </motion.div>
    </div>
  );
}