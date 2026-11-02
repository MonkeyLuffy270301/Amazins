"use client";

import { useState } from "react";
import DirectChat from "@/components/DirectChat";

export default function DirectChatTabs({
  otherUserId,
  initialMessages,
  currentUserId,
  currentUserEmail,
}: {
  otherUserId: string;
  initialMessages: any[];
  currentUserId: string;
  currentUserEmail: string | null;
}) {
  const [tab, setTab] = useState<"chat" | "requests">("chat");

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("chat")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            tab === "chat"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            tab === "requests"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Requests
        </button>
      </div>

      {tab === "chat" ? (
        <DirectChat
          otherUserId={otherUserId}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
        />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No requests for direct messages.
        </p>
      )}
    </div>
  );
}