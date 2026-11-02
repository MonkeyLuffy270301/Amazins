"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setPinned(JSON.parse(localStorage.getItem(PIN_KEY) || "[]"));
    } catch {
      setPinned([]);
    }
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
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      const { data: received } = await supabase
        .from("direct_messages")
        .select("sender_id, content, created_at")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      const partnerMap = new Map<string, { content: string; created_at: string }>();
      for (const row of sent ?? []) {
        if (!partnerMap.has(row.receiver_id)) {
          partnerMap.set(row.receiver_id, { content: row.content, created_at: row.created_at });
        }
      }
      for (const row of received ?? []) {
        if (!partnerMap.has(row.sender_id)) {
          partnerMap.set(row.sender_id, { content: row.content, created_at: row.created_at });
        }
      }
      for (const [pid, info] of partnerMap.entries()) {
        combined.push({
          key: `dm:${pid}`,
          kind: "dm",
          id: pid,
          title: `Chat ${pid.slice(0, 6)}`,
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

  const togglePin = (key: string) => {
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
    localStorage.setItem(PIN_KEY, JSON.stringify(next));
  };

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
}