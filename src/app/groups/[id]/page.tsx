import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import GroupChat from "@/components/GroupChat";

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

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
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

        <GroupChat
          groupId={id}
          initialMessages={(messages ?? []) as Message[]}
          currentUserId={user.id}
          currentUserEmail={user.email ?? null}
        />
      </div>
    </main>
  );
}