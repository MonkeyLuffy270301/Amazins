"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import AiChat from "@/components/AiChat";

export default function FloatingAiBot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        aria-label="AI Assistant"
      >
        <Bot size={20} />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              AI Assistant
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-3">
            <AiChat />
          </div>
        </div>
      )}
    </>
  );
}