"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function CreateRequestModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
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
      alert("No groups.");
      setLoading(false);
      return;
    }
    const list = groups.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
    const gChoice = window.prompt(`Select a group:\n${list}\n\nEnter number:`);
    const gIndex = Number(gChoice) - 1;
    if (!gChoice || Number.isNaN(gIndex) || gIndex < 0 || gIndex >= groups.length) {
      setLoading(false);
      return;
    }

    const title = window.prompt("Task title:")?.trim();
    if (!title) {
      setLoading(false);
      return;
    }
    const date = window.prompt("Date (YYYY-MM-DD):")?.trim() ?? "";
    const startTime = window.prompt("Start time (HH:MM):")?.trim() ?? "";
    const requesterPhone = window.prompt("Requester phone:") ?? "";
    const ownerPhone = window.prompt("Owner phone:") ?? "";
    const links = window.prompt("Links (comma separated):") ?? "";
    const imageUrls = window.prompt("Image URLs (comma separated):") ?? "";

    const taskId = crypto.randomUUID();
    await supabase.from("tasks").insert({
      id: taskId,
      user_id: user.id,
      title,
      date: date || null,
      start_time: startTime || null,
      status: "pending",
    });

    const { error } = await supabase.from("coverage_requests").insert({
      task_id: taskId,
      group_id: groups[gIndex].id,
      requested_by: user.id,
      status: "OPEN",
      requester_phone: requesterPhone || null,
      owner_phone: ownerPhone || null,
      links: links || null,
      image_urls: imageUrls || null,
    });

    setLoading(false);
    if (error) alert(error.message);
    else router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={loading}
      className="cursor-pointer text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      aria-label="Create request"
    >
      {loading ? "..." : "+"}
    </button>
  );
}