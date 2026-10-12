"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Sparkles, Send, X, Bot, User, Loader2, Lightbulb, HelpCircle, FileText } from "lucide-react";
import { Button } from "../../../../../components/ui/button";

const QUICK_PROMPTS = [
  { label: "Analogy", text: "Explain the main concept of this chapter using a simple, relatable real-world analogy." },
  { label: "Example", text: "Give a concrete real-world example illustrating how this concept works in practice." },
  { label: "Key Points", text: "Summarize the 3 most important takeaways from this chapter in bullet points." },
  { label: "Quiz Me", text: "Ask me a conceptual practice question about this chapter to test my understanding." },
];

export default function AiTutorDrawer({ courseId, chapterTitle, contextNotes }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: `Hi! I'm your AI Academic Tutor for **${chapterTitle || "this chapter"}**. Ask me anything—I can give you analogies, simpler explanations, or quiz your knowledge!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText = null) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMessage = { role: "user", text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await axios.post("/api/ai/tutor", {
        question: textToSend,
        chapterTitle,
        contextNotes,
        chatHistory: messages,
      });

      if (res.data?.answer) {
        setMessages(prev => [...prev, { role: "model", text: res.data.answer }]);
      }
    } catch (err) {
      console.error("AI Tutor request failed:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 print:hidden"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Ask AI Tutor</span>
        </button>
      )}

      {/* Slide-over Drawer / Side Panel */}
      {isOpen && (
        <>
          {/* Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 transition-opacity animate-in fade-in duration-200 print:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-300 print:hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">AI Academic Tutor</h3>
                <p className="text-xs text-blue-100 truncate max-w-[260px]">{chapterTitle || "Chapter Notes"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-gray-50 border-b flex gap-1.5 overflow-x-auto text-xs">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(qp.text)}
                className="shrink-0 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-700 font-medium px-2.5 py-1 rounded-full shadow-2xs transition-colors flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                {qp.label}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-gray-100 text-gray-800 rounded-tl-xs"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start items-center text-gray-400 text-xs py-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this chapter..."
                rows={1}
                className="flex-1 bg-transparent text-sm focus:outline-none resize-none max-h-24 py-1.5"
              />
              <Button
                size="sm"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-8 w-8 p-0 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by Google Gemini 3.5 Flash Lite • Answers grounded in your course notes
            </p>
          </div>
        </div>
      </>
    )}
    </>
  );
}
