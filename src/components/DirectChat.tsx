"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
};

export default function DirectChat({
  otherUserId,
  initialMessages,
  currentUserId,
  currentUserEmail,
}: {
  otherUserId: string;
  initialMessages: Message[];
  currentUserId: string;
  currentUserEmail: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  useEffect(() => {
    fetchMessages();
  }, [otherUserId, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim(),
        is_read: false,
      });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setContent("");
    fetchMessages();
  };

  const senderLabel = (msg: Message) =>
    msg.sender_id === currentUserId ? currentUserEmail ?? "You" : msg.sender_id;

  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {senderLabel(msg)}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
      {error && (
        <p className="px-3 pb-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}