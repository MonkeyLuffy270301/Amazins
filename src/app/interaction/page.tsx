"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function InteractionPage() {
  const [tab, setTab] = useState<"groups" | "dms">("groups");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", user.id);

    const gs = (memberships ?? [])
      .map((m: { groups: { id: string; name: string }[] | null }) =>
        Array.isArray(m.groups) ? m.groups[0] : m.groups
      )
      .filter(Boolean) as { id: string; name: string }[];
    setGroups(gs);

    const { data: sent } = await supabase
      .from("direct_messages")
      .select("receiver_id")
      .eq("sender_id", user.id);
    const { data: received } = await supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("receiver_id", user.id);

    const ids = Array.from(
      new Set([
        ...(sent ?? []).map((r: { receiver_id: string }) => r.receiver_id),
        ...(received ?? []).map((r: { sender_id: string }) => r.sender_id),
      ])
    );
    setPartners(ids);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCreateError("You must be logged in.");
      setCreateLoading(false);
      return;
    }
    const code = makeCode();
    const groupId = crypto.randomUUID();
    const { error: groupError } = await supabase.from("groups").insert({
      id: groupId,
      name: groupName,
      invite_code: code,
      created_by: user.id,
    });
    if (groupError) {
      setCreateError(groupError.message ?? "Failed to create group.");
      setCreateLoading(false);
      return;
    }
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "OWNER",
    });
    setGroupName("");
    setCreateLoading(false);
    await load();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    setJoinLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setJoinError("You must be logged in.");
      setJoinLoading(false);
      return;
    }
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();
    if (groupError || !group) {
      setJoinError("No group found with that invite code.");
      setJoinLoading(false);
      return;
    }
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "MEMBER",
    });
    setJoinSuccess(`Joined "${group.name}" successfully.`);
    setInviteCode("");
    setJoinLoading(false);
    await load();
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Interaction
        </h1>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("groups")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              tab === "groups"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("dms")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              tab === "dms"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Direct Messages
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        ) : tab === "groups" ? (
          <div className="space-y-4">
            <form
              onSubmit={handleCreate}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Create Group
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  required
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {createLoading ? "Creating..." : "+ Create Group"}
                </button>
              </div>
              {createError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {createError}
                </p>
              )}
            </form>

            <form
              onSubmit={handleJoin}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Join Group
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code"
                  required
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {joinLoading ? "Joining..." : "Join"}
                </button>
              </div>
              {joinError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {joinError}
                </p>
              )}
              {joinSuccess && (
                <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  {joinSuccess}
                </p>
              )}
            </form>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Your Groups
              </h2>
              {groups.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No groups.</p>
              ) : (
                <ul className="space-y-2">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/groups/${g.id}`}
                        className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        {g.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : partners.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No direct messages.
          </p>
        ) : (
          <ul className="space-y-2">
            {partners.map((id) => (
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