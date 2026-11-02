"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function GroupChat({
  groupId,
  initialMessages,
  currentUserId,
  currentUserEmail,
}: {
  groupId: string;
  initialMessages: Message[];
  currentUserId: string;
  currentUserEmail: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  useEffect(() => {
    fetchMessages();
  }, [groupId]);

  const handleCreateRequest = async () => {
    const title = window.prompt("Task title:")?.trim();
    if (!title) return;
    const date = window.prompt("Date (YYYY-MM-DD):")?.trim() ?? "";
    const startTime = window.prompt("Start time (HH:MM):")?.trim() ?? "";
    const requesterPhone = window.prompt("Requester phone:") ?? "";
    const ownerPhone = window.prompt("Owner phone:") ?? "";
    const links = window.prompt("Links (comma separated):") ?? "";
    const imageUrls = window.prompt("Image URLs (comma separated):") ?? "";

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const taskId = crypto.randomUUID();
    const { error: taskError } = await supabase.from("tasks").insert({
      id: taskId,
      user_id: user.id,
      title,
      date: date || null,
      start_time: startTime || null,
      status: "pending",
    });
    if (taskError) {
      setError(taskError.message);
      return;
    }

    const { error: requestError } = await supabase.from("coverage_requests").insert({
      task_id: taskId,
      group_id: groupId,
      requested_by: user.id,
      status: "OPEN",
      requester_phone: requesterPhone || null,
      owner_phone: ownerPhone || null,
      links: links || null,
      image_urls: imageUrls || null,
    });

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setError(null);
    alert("Coverage request created.");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("messages").insert({
      group_id: groupId,
      user_id: currentUserId,
      content: content.trim(),
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
    msg.user_id === currentUserId
      ? currentUserEmail ?? "You"
      : msg.user_id;

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
        <button
          type="button"
          onClick={handleCreateRequest}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          +
        </button>
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