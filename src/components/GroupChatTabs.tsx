"use client";

import { useState } from "react";
import GroupChat from "@/components/GroupChat";
import AcceptCoverageButton from "@/components/AcceptCoverageButton";

type Request = {
  id: string;
  status: string | null;
  tasks: { title: string | null; date: string | null; start_time: string | null } | null;
  pickup_place?: string | null;
  pickup_time?: string | null;
  requester_phone?: string | null;
  owner_phone?: string | null;
  links?: string | null;
  image_urls?: string | null;
  requested_by: string;
};

function isRequestExpired(r: Request) {
  const date = r.tasks?.date;
  if (!date) return false;
  const start = r.tasks?.start_time || "00:00";
  const parsed = new Date(`${date}T${start.length === 5 ? start + ":00" : start}`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now() - 10 * 60 * 1000;
}

export default function GroupChatTabs({
  groupId,
  initialMessages,
  currentUserId,
  currentUserEmail,
  requests,
}: {
  groupId: string;
  initialMessages: any[];
  currentUserId: string;
  currentUserEmail: string | null;
  requests: Request[];
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
        <GroupChat
          groupId={groupId}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
        />
      ) : (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No active requests.
            </p>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className={`rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
                  isRequestExpired(r) ? "opacity-50 blur-sm" : ""
                }`}
              >
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {r.tasks?.title ?? "Unknown task"}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {r.tasks?.date ? `Date: ${r.tasks.date}` : ""}
                  {r.pickup_place ? ` · Place: ${r.pickup_place}` : ""}
                  {r.pickup_time ? ` · Time: ${r.pickup_time}` : ""}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {r.requester_phone ? `Requester Phone: ${r.requester_phone}` : ""}
                  {r.owner_phone ? ` · Owner Phone: ${r.owner_phone}` : ""}
                </div>
                {r.links && (
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Links: {r.links}
                  </div>
                )}
                {r.image_urls && (
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Images: {r.image_urls}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <AcceptCoverageButton requestId={r.id} disabled={isRequestExpired(r)} />
                  <button
                    type="button"
                    disabled={isRequestExpired(r)}
                    onClick={async () => {
                      const supabase = (await import("@/utils/supabase/client")).createClient();
                      await supabase
                        .from("coverage_requests")
                        .update({ status: "DECLINED" })
                        .eq("id", r.id);
                      window.location.reload();
                    }}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}