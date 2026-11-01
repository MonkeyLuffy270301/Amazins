"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

type PendingAction = {
  title: string;
  date: string;
  start_time: string;
};

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setPendingAction(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Request failed.");
      } else if (data?.tool_calls && Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
        const tc = data.tool_calls[0] as ToolCall;
        let args: Record<string, string> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }
        setPendingAction({
          title: args.title ?? "",
          date: args.date ?? "",
          start_time: args.start_time ?? "",
        });
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: "I can create this task for you. Please confirm or cancel below.",
          },
        ]);
      } else {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.response ?? "No response." },
        ]);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "You must be logged in to create a task." },
        ]);
        setPendingAction(null);
        return;
      }
      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: pendingAction.title,
        date: pendingAction.date || null,
        start_time: pendingAction.start_time || null,
        status: "pending",
      });
      if (insertError) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Failed to create task: ${insertError.message}` },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Task created successfully." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Failed to create task." },
      ]);
    } finally {
      setPendingAction(null);
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
    setMessages((m) => [...m, { role: "assistant", content: "Action cancelled." }]);
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ask me anything about your schedule or tasks.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "mr-8 bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="mr-8 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Thinking...
          </div>
        )}

        {pendingAction && (
          <div className="mr-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              The AI wants to create a task:
            </p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {pendingAction.title} on {pendingAction.date}
              {pendingAction.start_time ? ` at ${pendingAction.start_time}` : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {actionLoading ? "Creating..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}