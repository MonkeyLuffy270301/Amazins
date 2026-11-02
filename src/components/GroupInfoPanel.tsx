"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Member = {
  user_id: string;
  role: string | null;
  name: string | null;
};

export default function GroupInfoPanel({
  groupId,
  groupName,
  currentUserId,
  currentUserRole,
  members,
}: {
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserRole: string | null;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLeave = async () => {
    const supabase = createClient();
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", currentUserId);
    router.push("/groups");
  };

  const handleDeleteGroup = async () => {
    const supabase = createClient();
    await supabase.from("groups").delete().eq("id", groupId);
    setConfirmDelete(false);
    setOpen(false);
    router.push("/groups");
  };

  const canDelete = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-2xl font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
      >
        {groupName}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Group Info
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-sm">
                Close
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Members: {members.length}
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
              {members.map((m) => (
                <li key={m.user_id} className="text-sm text-zinc-900 dark:text-zinc-50">
                  {m.name || m.user_id} {m.role ? `(${m.role})` : ""}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleLeave}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Leave Group
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              Are you sure you want to delete this group?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}