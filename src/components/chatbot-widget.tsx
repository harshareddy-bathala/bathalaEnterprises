"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { role: "user" | "bot"; content: string };

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi there! 👋 I'm the Bathala AI Assistant. I can help you with information about our properties, services, locations, and pricing. What would you like to know?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRequestInProgress = useRef(false); // Prevent double API calls

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (!input.trim() || isLoading || isRequestInProgress.current) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    isRequestInProgress.current = true; // Lock to prevent duplicate calls

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6)
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { 
        role: "bot", 
        content: data.reply || "I apologize, but I couldn't process that request. Please try again or contact us directly."
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { 
        role: "bot", 
        content: "I'm having trouble connecting right now. Please try again later or contact us at +91 98765 43210."
      }]);
    } finally {
      setIsLoading(false);
      isRequestInProgress.current = false; // Unlock after completion
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerClasses = useMemo(
    () => "fixed bottom-6 right-4 z-40 flex flex-col gap-3 text-sm sm:right-6 transition-all duration-300",
    []
  );

  const suggestedQuestions = [
    "What properties are available?",
    "Tell me about your services",
    "What areas do you cover?",
  ];

  return (
    <div className={containerClasses}>
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass-panel w-80 sm:w-96 rounded-2xl border border-white/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/50 px-4 py-3 bg-gradient-to-r from-royal/10 to-purple/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal to-purple flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-royal">Bathala AI</p>
                  <p className="text-xs text-slateInk">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 hover:bg-white/60 transition"
              >
                <X className="h-4 w-4 text-slate-900" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 space-y-3 overflow-y-auto px-4 py-3 bg-gradient-to-b from-white/20 to-white/40">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-royal to-purple" 
                      : "bg-white/80 border border-royal/20"
                  }`}>
                    {msg.role === "user" 
                      ? <User className="h-3 w-3 text-white" />
                      : <Bot className="h-3 w-3 text-royal" />
                    }
                  </div>
                  <span
                    className={
                      msg.role === "user"
                        ? "inline-block rounded-2xl rounded-tr-sm bg-gradient-to-r from-royal to-purple px-4 py-2 text-xs text-white max-w-[75%] break-words"
                        : "inline-block rounded-2xl rounded-tl-sm bg-white/90 px-4 py-2 text-xs text-slate-900 max-w-[75%] break-words shadow-sm"
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
                  className="flex gap-2"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/80 border border-royal/20 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-royal" />
                  </div>
                  <div className="inline-block rounded-2xl rounded-tl-sm bg-white/90 px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-royal/60 animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="h-2 w-2 rounded-full bg-royal/60 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 rounded-full bg-royal/60 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions (show only at start) */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t border-white/30 bg-white/20">
                <p className="text-xs text-slateInk mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-royal/10 text-royal hover:bg-royal/20 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-white/60 p-3 bg-white/60">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about properties, services..."
                className="min-h-[40px] max-h-24 resize-none text-xs bg-white/80"
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
            <p className="text-xs font-semibold text-slate-900">Need help finding a property? 🏠</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-royal to-purple text-white shadow-lg shadow-royal/30 transition-all hover:shadow-xl hover:shadow-royal/40"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </motion.div>
    </div>
  );
}