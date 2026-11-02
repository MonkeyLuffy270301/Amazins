import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import DirectChatTabs from "@/components/DirectChatTabs";

export const instant = false;

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
};

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await connection();
  const { userId: otherUserId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  if (otherUserId === user.id) {
    redirect("/messages");
  }

  // Allow chat if users share a group.
  const { data: myGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const myGroupIds = (myGroups ?? []).map((g: { group_id: string }) => g.group_id);

  let allowed = false;
  if (myGroupIds.length > 0) {
    const { data: shared } = await supabase
      .from("group_members")
      .select("id")
      .eq("user_id", otherUserId)
      .in("group_id", myGroupIds)
      .limit(1);
    if (shared && shared.length > 0) allowed = true;
  }

  // Or if there is already a conversation between them.
  if (!allowed) {
    const { data: existing } = await supabase
      .from("direct_messages")
      .select("id")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .limit(1);
    if (existing && existing.length > 0) allowed = true;
  }

  if (!allowed) {
    redirect("/messages");
  }

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <a
            href="/messages"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Back to Messages
          </a>
        </div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Private Chat
        </h1>
        <DirectChatTabs
          otherUserId={otherUserId}
          initialMessages={(messages ?? []) as Message[]}
          currentUserId={user.id}
          currentUserEmail={user.email ?? null}
        />
      </div>
    </main>
  );
}