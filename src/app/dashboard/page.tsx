import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import AddTaskForm from "@/components/AddTaskForm";

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

export default async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email ||
    "there";

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const todayTasks = (tasks ?? []) as Task[];

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back, {displayName}
        </h1>

        <AddTaskForm />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Today&apos;s Tasks
            </h2>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No tasks scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {todayTasks.map((task) => (
                  <li key={task.id} className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {task.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {task.date ? `Date: ${task.date}` : null}
                      {task.location ? ` · Location: ${task.location}` : null}
                      {task.status ? ` · Status: ${task.status}` : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Coverage Requests
            </h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Alice requested coverage for Mon</li>
              <li>• Bob requested coverage for Tue</li>
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Group Messages
            </h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Design team: New mockups ready</li>
              <li>• Engineering: Deployment scheduled</li>
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              AI Assistant
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ask me anything about your workflow, tasks, or team.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}