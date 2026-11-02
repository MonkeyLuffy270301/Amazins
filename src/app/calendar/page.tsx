import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import CalendarView from "@/components/CalendarView";

export const instant = false;

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

  return (
    <main className="min-h-screen bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Calendar
        </h1>
        <CalendarView />
      </div>
    </main>
  );
}