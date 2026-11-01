"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function GroupsActions() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

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

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: groupName,
        invite_code: code,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError || !group) {
      setCreateError(groupError?.message ?? "Failed to create group.");
      setCreateLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "OWNER",
    });

    setCreateLoading(false);
    if (memberError) {
      setCreateError(memberError.message);
      return;
    }

    setGroupName("");
    router.refresh();
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

    const { error: joinErr } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "MEMBER",
    });

    setJoinLoading(false);
    if (joinErr) {
      setJoinError(joinErr.message);
      return;
    }

    setJoinSuccess(`Joined "${group.name}" successfully.`);
    setInviteCode("");
    router.refresh();
  };

  return (
    <div className="mb-6 space-y-4">
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
            {createLoading ? "Creating..." : "Create Group"}
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
          Join Group by Code
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite code (e.g. A1B2C3)"
            required
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={joinLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {joinLoading ? "Joining..." : "Join Group"}
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
    </div>
  );
}