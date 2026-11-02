"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RequestCoverageButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", user.id);

    const groups = (memberships ?? [])
      .map((m: { group_id: string; groups: { id: string; name: string }[] | null }) =>
        Array.isArray(m.groups) ? m.groups[0] : m.groups
      )
      .filter(Boolean) as { id: string; name: string }[];

    if (groups.length === 0) {
      alert("You are not a member of any groups.");
      setLoading(false);
      return;
    }

    const list = groups.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
    const choice = window.prompt(`Select a group:\n${list}\n\nEnter number:`);
    const index = Number(choice) - 1;

    if (!choice || Number.isNaN(index) || index < 0 || index >= groups.length) {
      setLoading(false);
      return;
    }

    const requesterPhone = window.prompt("Requester Phone:") ?? "";
    const ownerPhone = window.prompt("Owner Phone:") ?? "";
    const links = window.prompt("Links (comma separated):") ?? "";
    const imageUrls = window.prompt("Image URLs (comma separated):") ?? "";

    const { error } = await supabase.from("coverage_requests").insert({
      task_id: taskId,
      group_id: groups[index].id,
      requester_id: user.id,
      status: "OPEN",
      phone_requester: requesterPhone || null,
      phone_owner: ownerPhone || null,
      links: links || null,
      image_urls: imageUrls || null,
    });

    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {loading ? "..." : "Request Coverage"}
    </button>
  );
}