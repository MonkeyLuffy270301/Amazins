"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GroupChat from "@/components/GroupChat";
import { createClient } from "@/utils/supabase/client";

type Request = {
  id: string;
  task_id: string;
  status: string | null;
  tasks: { title: string | null; date: string | null; start_time: string | null } | null;
  place?: string | null;
  pickup_time?: string | null;
  order_reference?: string | null;
  phone_requester?: string | null;
  phone_owner?: string | null;
  links?: string | null;
  image_urls?: string | null;
  requester_id: string;
  accepted_by?: string | null;
  accepter_name?: string | null;
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
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ id: string; action: "accept" | "decline" } | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [forwardRequest, setForwardRequest] = useState<Request | null>(null);
  const [forwardGroups, setForwardGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedForward, setSelectedForward] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);

  const confirmAccept = async () => {
    if (!confirm || confirm.action !== "accept") return;
    setProcessing(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_coverage", {
      request_id: confirm.id,
    });
    setProcessing(false);
    setConfirm(null);
    if (error) {
      alert("Sorry, someone else already accepted this.");
      return;
    }
    router.refresh();
  };

  const confirmDecline = async () => {
    if (!confirm || confirm.action !== "decline") return;
    setProcessing(true);
    const supabase = createClient();
    await supabase
      .from("coverage_requests")
      .update({ status: "DECLINED" })
      .eq("id", confirm.id);
    setProcessing(false);
    setConfirm(null);
    router.refresh();
  };

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
            requests.map((r) => {
              const expired = r.status === "OPEN" && isRequestExpired(r);
              const accepted = r.status === "ACCEPTED";
              const declined = r.status === "DECLINED";
              const blurred = accepted || declined || expired;
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
                    blurred ? "opacity-50 blur-sm" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {r.tasks?.title ?? "Unknown task"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {r.tasks?.date ? `Date: ${r.tasks.date}` : ""}
                    {r.place ? ` · Place: ${r.place}` : ""}
                    {r.pickup_time ? ` · Time: ${r.pickup_time}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {r.phone_requester ? `Requester Phone: ${r.phone_requester}` : ""}
                    {r.phone_owner ? ` · Owner Phone: ${r.phone_owner}` : ""}
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

                  {accepted && (
                    <div className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Accepted by: {r.accepter_name ?? "someone"}
                    </div>
                  )}
                  {declined && (
                    <div className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Declined
                    </div>
                  )}
                  {r.status === "OPEN" && expired && (
                    <div className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Expired
                    </div>
                  )}

                  {r.status === "OPEN" && !expired && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirm({ id: r.id, action: "accept" })}
                        className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm({ id: r.id, action: "decline" })}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setForwardRequest(r);
                          const supabase = createClient();
                          const {
                            data: { user },
                          } = await supabase.auth.getUser();
                          if (!user) return;
                          const { data: memberships } = await supabase
                            .from("group_members")
                            .select("group_id, groups(id, name)")
                            .eq("user_id", user.id);
                          const groups = (memberships ?? [])
                            .map((m: { groups: { id: string; name: string }[] | null }) =>
                              Array.isArray(m.groups) ? m.groups[0] : m.groups
                            )
                            .filter((g: { id: string; name: string } | null) => g && g.id !== groupId) as {
                            id: string;
                            name: string;
                          }[];
                          setForwardGroups(groups);
                          setSelectedForward([]);
                        }}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Forward
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              Are you sure you want to {confirm.action} this request?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={confirm.action === "accept" ? confirmAccept : confirmDecline}
                className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {processing ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {forwardRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Forward to groups
            </h3>
            <div className="max-h-40 space-y-1 overflow-auto">
              {forwardGroups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedForward.includes(g.id)}
                    onChange={() =>
                      setSelectedForward((prev) =>
                        prev.includes(g.id)
                          ? prev.filter((x) => x !== g.id)
                          : [...prev, g.id]
                      )
                    }
                  />
                  {g.name}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForwardRequest(null)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={forwarding || selectedForward.length === 0}
                onClick={async () => {
                  setForwarding(true);
                  const supabase = createClient();
                  for (const gid of selectedForward) {
                    await supabase.from("coverage_requests").insert({
                      task_id: forwardRequest.task_id,
                      group_id: gid,
                      requester_id: forwardRequest.requester_id,
                      status: "OPEN",
                      place: forwardRequest.place ?? null,
                      pickup_time: forwardRequest.pickup_time ?? null,
                      order_reference: forwardRequest.order_reference ?? null,
                      phone_requester: forwardRequest.phone_requester ?? null,
                      phone_owner: forwardRequest.phone_owner ?? null,
                      links: forwardRequest.links ?? null,
                      image_urls: forwardRequest.image_urls ?? null,
                    });
                  }
                  setForwarding(false);
                  setForwardRequest(null);
                  router.refresh();
                }}
                className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {forwarding ? "..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}