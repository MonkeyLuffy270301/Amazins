"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
};

export default function RequestCoverageModal({
  task,
  open,
  onClose,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(task.date ?? "");
  const [place, setPlace] = useState(task.location ?? "");
  const [pickupTime, setPickupTime] = useState("");
  const [phoneOwner, setPhoneOwner] = useState("");
  const [phoneRequester, setPhoneRequester] = useState("");
  const [links, setLinks] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
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
      setError("You are not a member of any groups.");
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

    try {
      let imageUrls: string | null = null;
      const uploadedUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("task-images").upload(path, file);
          if (error) throw new Error(error.message);
          const { data } = supabase.storage.from("task-images").getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const pastedUrls = imageUrl
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      const allUrls = [...pastedUrls, ...uploadedUrls];
      if (allUrls.length) imageUrls = allUrls.join(", ");

      const fullPayload = {
        task_id: task.id,
        group_id: groups[index].id,
        requested_by: user.id,
        status: "OPEN",
        pickup_place: place || null,
        pickup_time: pickupTime || null,
        requester_phone: phoneRequester || null,
        owner_phone: phoneOwner || null,
        links: links || null,
        image_urls: imageUrls,
      };

      const { error: fullError } = await supabase
        .from("coverage_requests")
        .insert(fullPayload);

      if (fullError) {
        const { error: basicError } = await supabase.from("coverage_requests").insert({
          task_id: task.id,
          group_id: groups[index].id,
          requested_by: user.id,
          status: "OPEN",
          requester_phone: phoneRequester || null,
          owner_phone: phoneOwner || null,
          links: links || null,
          image_urls: imageUrls,
        });
        if (basicError) throw new Error(basicError.message);
      }

      setLoading(false);
      onClose();
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to send request.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSend}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h3 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Request Coverage
        </h3>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Place (Pickup)"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            placeholder="Time (Pickup)"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            value={phoneOwner}
            onChange={(e) => setPhoneOwner(e.target.value)}
            placeholder="Phone (Owner)"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            value={phoneRequester}
            onChange={(e) => setPhoneRequester(e.target.value)}
            placeholder="Phone (Requester)"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="Links (comma separated)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(e.target.files)}
            className="w-full text-sm text-zinc-600 dark:text-zinc-400"
          />
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>
      </form>
    </div>
  );
}