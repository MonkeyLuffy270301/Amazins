import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const instant = false;

export default async function MessagesPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: sent } = await supabase
    .from("direct_messages")
    .select("receiver_id")
    .eq("sender_id", user.id);

  const { data: received } = await supabase
    .from("direct_messages")
    .select("sender_id")
    .eq("receiver_id", user.id);

  const partnerIds = Array.from(
    new Set([
      ...(sent ?? []).map((r: { receiver_id: string }) => r.receiver_id),
      ...(received ?? []).map((r: { sender_id: string }) => r.sender_id),
    ])
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Messages
        </h1>

        {partnerIds.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select a user from a group to start a chat.
          </p>
        ) : (
          <ul className="space-y-2">
            {partnerIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/messages/${id}`}
                  className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  Chat with {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}