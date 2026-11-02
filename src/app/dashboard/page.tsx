import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import AddTaskModal from "@/components/AddTaskModal";
import CreateRequestModal from "@/components/CreateRequestModal";
import RequestCoverageButton from "@/components/RequestCoverageButton";
import AcceptCoverageButton from "@/components/AcceptCoverageButton";
import TaskRow from "@/components/TaskRow";
import InteractionPanel from "@/components/InteractionPanel";

export const instant = false;

type Task = {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string | null;
  phone?: string | null;
  links?: string | null;
  image_urls?: string | null;
};

type CoverageRequest = {
  id: string;
  task_id: string;
  group_id: string;
  requested_by: string;
  status: string | null;
  tasks: { title: string | null; date: string | null } | null;
};

function isExpired(task: Task) {
  if (!task.date) return false;
  const start = task.start_time || "00:00";
  const parsed = new Date(`${task.date}T${start.length === 5 ? start + ":00" : start}`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now() - 10 * 60 * 1000;
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name?.trim() || user.email || "there";

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .neq("status", "COMPLETED")
    .order("date", { ascending: true });

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m: { group_id: string }) => m.group_id);

  let coverageRequests: CoverageRequest[] = [];
  if (groupIds.length > 0) {
    const { data: reqs } = await supabase
      .from("coverage_requests")
      .select("id, task_id, group_id, requested_by, status, tasks(title, date)")
      .in("group_id", groupIds)
      .eq("status", "OPEN");
    coverageRequests = (reqs ?? []) as unknown as CoverageRequest[];
  }

  const allTasks = (tasks ?? []) as Task[];
  const visibleTasks = allTasks.filter((t) => !isExpired(t));
  const immediateTasks = visibleTasks.slice(0, 2);

  return (
    <main className="min-h-screen bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back, {displayName}
        </h1>

        {/* Top section: Weekly calendar placeholder + 2 immediate items */}
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Weekly Calendar
          </h2>
          <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Weekly calendar placeholder
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Immediate Tasks
              </h2>
              <AddTaskModal />
            </div>
            {immediateTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No tasks scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {immediateTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
                  >
                    <span className="text-sm text-zinc-900 dark:text-zinc-50">
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Immediate Requests
              </h2>
              <CreateRequestModal />
            </div>
            {coverageRequests.slice(0, 2).length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No requests.
              </p>
            ) : (
              <ul className="space-y-2">
                {coverageRequests.slice(0, 2).map((req) => (
                  <li
                    key={req.id}
                    className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
                  >
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {req.tasks?.title ?? "Unknown task"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Left column 40% */}
          <div className="space-y-4 md:col-span-2">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Task List
                </h2>
                <AddTaskModal />
              </div>
              {visibleTasks.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No tasks.
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleTasks.slice(0, 5).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Request Box
                </h2>
                <CreateRequestModal />
              </div>
              {coverageRequests.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No open requests.
                </p>
              ) : (
                <ul className="space-y-2">
                  {coverageRequests.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-center justify-between rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
                    >
                      <div className="text-sm text-zinc-900 dark:text-zinc-50">
                        {req.tasks?.title ?? "Unknown task"}
                      </div>
                      <AcceptCoverageButton requestId={req.id} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column 60% */}
          <div className="md:col-span-3">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Interaction Panel
              </h2>
              <InteractionPanel />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}