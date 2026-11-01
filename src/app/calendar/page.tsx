import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const instant = false;

type Task = {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string | null;
};

export default async function CalendarPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("start_time", { ascending: true });

  const todayTasks = (tasks ?? []) as Task[];

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Calendar
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Today&apos;s timeline — {today}
        </p>

        {todayTasks.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No tasks scheduled for today.
          </p>
        ) : (
          <ul className="space-y-3">
            {todayTasks.map((task) => (
              <li
                key={task.id}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-[110px] text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <div>{task.start_time ?? "—"}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    to {task.end_time ?? "—"}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">
                    {task.title}
                  </div>
                  {task.location ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Location: {task.location}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}