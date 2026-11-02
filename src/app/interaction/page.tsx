"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function InteractionPage() {
  const [tab, setTab] = useState<"groups" | "dms">("groups");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id);

      const gs = (memberships ?? [])
        .map((m: { groups: { id: string; name: string }[] | null }) =>
          Array.isArray(m.groups) ? m.groups[0] : m.groups
        )
        .filter(Boolean) as { id: string; name: string }[];
      setGroups(gs);

      const { data: sent } = await supabase
        .from("direct_messages")
        .select("receiver_id")
        .eq("sender_id", user.id);
      const { data: received } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("receiver_id", user.id);

      const ids = Array.from(
        new Set([
          ...(sent ?? []).map((r: { receiver_id: string }) => r.receiver_id),
          ...(received ?? []).map((r: { sender_id: string }) => r.sender_id),
        ])
      );
      setPartners(ids);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Interaction
        </h1>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("groups")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              tab === "groups"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("dms")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              tab === "dms"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Direct Messages
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        ) : tab === "groups" ? (
          groups.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No groups.</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/groups/${g.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : partners.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No direct messages.
          </p>
        ) : (
          <ul className="space-y-2">
            {partners.map((id) => (
              <li key={id}>
                <Link
                  href={`/messages/${id}`}
                  className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  Chat with {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}