"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type ChatItem = {
  key: string;
  kind: "group" | "dm";
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  href: string;
};

const PIN_KEY = "amazins_pinned_chats";

export default function InteractionPanel() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadPinned = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("pinned_chats")
        .eq("id", user.id)
        .single();
      setPinned((data?.pinned_chats as string[]) ?? []);
    };
    loadPinned();
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const combined: ChatItem[] = [];

      // Groups
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name, created_at)")
        .eq("user_id", user.id);

      for (const m of memberships ?? []) {
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        if (!g) continue;
        const { data: latestMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("group_id", g.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const lm = latestMsg?.[0];
        combined.push({
          key: `group:${g.id}`,
          kind: "group",
          id: g.id,
          title: g.name,
          subtitle: lm?.content ?? "No messages yet",
          timestamp: lm?.created_at ?? g.created_at ?? new Date().toISOString(),
          href: `/groups/${g.id}`,
        });
      }

      // DMs
      const { data: sent } = await supabase
        .from("direct_messages")
        .select("receiver_id, content, created_at")
        .eq("sender_id", user.id);

      const { data: received } = await supabase
        .from("direct_messages")
        .select("sender_id, content, created_at")
        .eq("receiver_id", user.id);

      type DmRow = {
        partner: string;
        content: string;
        created_at: string;
      };

      const dmRows: DmRow[] = [];
      for (const row of sent ?? []) {
        dmRows.push({
          partner: row.receiver_id,
          content: row.content,
          created_at: row.created_at,
        });
      }
      for (const row of received ?? []) {
        dmRows.push({
          partner: row.sender_id,
          content: row.content,
          created_at: row.created_at,
        });
      }

      dmRows.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const partnerMap = new Map<string, { content: string; created_at: string }>();
      for (const row of dmRows) {
        if (!partnerMap.has(row.partner)) {
          partnerMap.set(row.partner, {
            content: row.content,
            created_at: row.created_at,
          });
        }
      }

      const partnerIds = Array.from(partnerMap.keys());

      // Fetch partner profiles (email if available, fall back to name/id).
      let profileMap = new Map<string, { email?: string | null; full_name?: string | null }>();
      if (partnerIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", partnerIds);

        if (profErr) {
          const { data: profs2 } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", partnerIds);
          for (const p of profs2 ?? []) {
            profileMap.set(p.id, { full_name: p.full_name });
          }
        } else {
          for (const p of profs ?? []) {
            profileMap.set(p.id, { email: p.email, full_name: p.full_name });
          }
        }
      }

      for (const [pid, info] of partnerMap.entries()) {
        const profile = profileMap.get(pid);
        const title =
          profile?.email ||
          profile?.full_name ||
          `User ${pid.slice(0, 6)}`;
        combined.push({
          key: `dm:${pid}`,
          kind: "dm",
          id: pid,
          title,
          subtitle: info.content,
          timestamp: info.created_at,
          href: `/messages/${pid}`,
        });
      }

      combined.sort((a, b) => {
        const aPinned = pinned.includes(a.key);
        const bPinned = pinned.includes(b.key);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setItems(combined);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  const togglePin = async (key: string) => {
    let next = [...pinned];
    if (next.includes(key)) {
      next = next.filter((k) => k !== key);
    } else {
      if (next.length >= 5) {
        alert("You can only pin up to 5 chats.");
        return;
      }
      next.push(key);
    }
    setPinned(next);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ pinned_chats: next })
        .eq("id", user.id);
    }
  };

  const renderList = () => {
    if (loading) {
      return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
    }

    if (items.length === 0) {
      return <p className="text-sm text-zinc-500 dark:text-zinc-400">No chats yet.</p>;
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {item.title.charAt(0).toUpperCase()}
            </div>
            <Link href={item.href} className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {item.subtitle}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => togglePin(item.key)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              title="Pin"
            >
              {pinned.includes(item.key) ? "★" : "☆"}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Expand
        </button>
      </div>
      {renderList()}

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                All chats
              </h2>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
            {renderList()}
          </div>
        </div>
      )}
    </div>
  );
}