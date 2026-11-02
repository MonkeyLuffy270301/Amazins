"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string | null;
};

type View = "month" | "week";

export default function CalendarView() {
  const [view, setView] = useState<View>("month");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tasks")
        .select("id, title, date, start_time, end_time, location, status")
        .eq("user_id", user.id);
      setTasks((data ?? []) as Task[]);
    };
    load();
  }, []);

  const tasksForDate = (dateStr: string) =>
    tasks.filter((t) => t.date === dateStr);

  const weekDays = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const monthDays = () => {
    const days: (Date | null)[] = [];
    const first = new Date(currentYear, currentMonth, 1);
    const last = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = first.getDay();
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  };

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const displayTasks = selectedDate ? tasksForDate(selectedDate) : [];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setView("month")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            view === "month"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Month View
        </button>
        <button
          onClick={() => setView("week")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            view === "week"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Week View
        </button>
      </div>

      {view === "month" ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              }}
              className="rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400"
            >
              Prev
            </button>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {new Date(currentYear, currentMonth).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((y) => y + 1);
                } else {
                  setCurrentMonth((m) => m + 1);
                }
              }}
              className="rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400"
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays().map((d, i) => {
              if (!d) return <div key={i} />;
              const ds = toStr(d);
              const count = tasksForDate(ds).length;
              const selected = selectedDate === ds;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className={`flex h-12 flex-col items-center justify-center rounded-md border text-sm ${
                    selected
                      ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span className="text-zinc-900 dark:text-zinc-50">{d.getDate()}</span>
                  {count > 0 && (
                    <span className="mt-1 rounded-full bg-zinc-900 px-1.5 text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {weekDays().map((d) => {
            const ds = toStr(d);
            const count = tasksForDate(ds).length;
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`flex h-16 flex-col items-center justify-center rounded-md border text-sm ${
                  selectedDate === ds
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="text-zinc-900 dark:text-zinc-50">{d.getDate()}</span>
                {count > 0 && (
                  <span className="mt-1 rounded-full bg-zinc-900 px-1.5 text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedDate && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Tasks on {selectedDate}
          </h3>
          {displayTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks.</p>
          ) : (
            <ul className="space-y-2">
              {displayTasks.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
                >
                  <div className="text-sm text-zinc-900 dark:text-zinc-50">{t.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.start_time ?? ""}
                    {t.location ? ` · ${t.location}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}