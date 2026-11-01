import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import GroupsActions from "@/components/GroupsActions";

export const instant = false;

type Membership = {
  group_id: string;
  role: string | null;
  groups: { id: string; name: string; invite_code: string | null } | null;
};

export default async function GroupsPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role, groups(id, name, invite_code)")
    .eq("user_id", user.id);

  const groups = ((memberships ?? []) as unknown as Membership[]).filter(
    (m) => m.groups
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Groups
        </h1>

        <GroupsActions />

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Your Groups
          </h2>
          {groups.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You are not a member of any groups yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((m) => (
                <li key={m.group_id}>
                  <Link
                    href={`/groups/${m.group_id}`}
                    className="block rounded-lg border border-zinc-100 px-3 py-2 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {m.groups?.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Role: {m.role ?? "MEMBER"}
                      {m.groups?.invite_code
                        ? ` · Invite code: ${m.groups.invite_code}`
                        : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}