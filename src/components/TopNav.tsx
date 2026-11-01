"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  content?: string | null;
  message?: string | null;
  link?: string | null;
  is_read: boolean | null;
  created_at: string;
};

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function TopNav() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const [{ data: recent }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

    setNotifications((recent ?? []) as Notification[]);
    setUnreadCount(count ?? 0);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
    await fetchNotifications();
    setLoading(false);
  };

  const handleNotificationClick = async (n: Notification) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    setOpen(false);
    await fetchNotifications();
    router.push(n.link || "/dashboard");
  };

  return (
    <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Dashboard
        </Link>
        <Link
          href="/calendar"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Calendar
        </Link>
        <Link
          href="/groups"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Groups
        </Link>
        <Link
          href="/messages"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Messages
        </Link>
        <Link
          href="/import"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Import Tasks
        </Link>
        <Link
          href="/ai"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          AI Assistant
        </Link>

        <div ref={containerRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative rounded-md p-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Notifications
                </span>
              </div>

              {notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No notifications.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className="w-full rounded-lg border border-zinc-100 px-3 py-2 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <div className="text-sm text-zinc-900 dark:text-zinc-50">
                          {n.content || n.message || "Notification"}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {timeAgo(n.created_at)}
                          {!n.is_read && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="w-full rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {loading ? "Working..." : "Mark all as read"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}