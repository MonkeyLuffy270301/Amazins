import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import GroupChat from "@/components/GroupChat";
import GroupChatTabs from "@/components/GroupChatTabs";

type Member = {
  user_id: string;
};

export const instant = false;

type Group = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!group) {
    redirect("/groups");
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/groups");
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: true });

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id);

  const members = (memberRows ?? []) as Member[];

  const { data: groupRequests } = await supabase
    .from("coverage_requests")
    .select("id, status, requested_by, requester_phone, owner_phone, links, image_urls, tasks(title, date, start_time)")
    .eq("group_id", id)
    .eq("status", "OPEN");

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/groups"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Back to Groups
          </Link>
        </div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {(group as Group).name}
        </h1>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <aside className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Members
            </h2>
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {m.user_id === user.id ? "You" : m.user_id}
                  </span>
                  {m.user_id !== user.id && (
                    <Link
                      href={`/messages/${m.user_id}`}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Message
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          <div className="md:col-span-3">
            <GroupChatTabs
              groupId={id}
              initialMessages={(messages ?? []) as Message[]}
              currentUserId={user.id}
              currentUserEmail={user.email ?? null}
              requests={(groupRequests ?? []) as any}
            />
          </div>
        </div>
      </div>
    </main>
  );
}