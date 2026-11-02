"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: string;
  title: string;
  date: string | null;
  status: string | null;
};

type Coverage = {
  id: string;
  status: string | null;
  requested_by: string;
  accepted_by: string | null;
  created_at: string;
  tasks: { title: string | null }[] | null;
};

function getWeekRange(offset: number) {
  const now = new Date();
  const day = now.getDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset - offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function fmt(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryClient() {
  const [tab, setTab] = useState<"tasks" | "coverage">("tasks");
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(false);

  const { start, end } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (tab === "tasks") {
        const { data } = await supabase
          .from("tasks")
          .select("id, title, date, status")
          .eq("user_id", user.id)
          .gte("date", startStr)
          .lte("date", endStr)
          .order("date", { ascending: true });
        setTasks((data ?? []) as Task[]);
      } else {
        let query = supabase
          .from("coverage_requests")
          .select("id, status, requested_by, accepted_by, created_at, tasks(title)")
          .or(`requested_by.eq.${user.id},accepted_by.eq.${user.id}`)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        const { data } = await query;
        setCoverage((data ?? []) as unknown as Coverage[]);
      }
      setLoading(false);
    };
    load();
  }, [tab, startStr, endStr, start, end]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-md border border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setTab("tasks")}
            className={`px-3 py-1 text-sm font-medium ${
              tab === "tasks"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Tasks History
          </button>
          <button
            onClick={() => setTab("coverage")}
            className={`px-3 py-1 text-sm font-medium ${
              tab === "coverage"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Coverage History
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => Math.min(o + 1, 5))}
            disabled={weekOffset >= 5}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            ← Prev
          </button>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {fmt(start)} - {fmt(end)}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.max(o - 1, 0))}
            disabled={weekOffset <= 0}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      ) : tab === "tasks" ? (
        tasks.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks this week.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t.title}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {t.status ?? "PENDING"}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.date ?? ""}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : coverage.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No coverage requests this week.
        </p>
      ) : (
        <ul className="space-y-2">
          {coverage.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {c.tasks?.[0]?.title ?? "Unknown task"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Requested by: {c.requested_by === c.requested_by ? c.requested_by : c.requested_by}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Accepted by: {c.accepted_by ?? "—"}
              </div>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Status: {c.status ?? "OPEN"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}