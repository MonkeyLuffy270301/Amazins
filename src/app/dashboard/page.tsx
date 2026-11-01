import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const instant = false;

export default async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email ||
    "there";

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back, {displayName}
        </h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Today&apos;s Tasks
            </h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Review quarterly report</li>
              <li>• Sync with design team</li>
              <li>• Update project board</li>
            </ul>
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