"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
};

type Destination = {
  key: string;
  kind: "group" | "dm";
  id: string;
  title: string;
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

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const loadDestinations = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dests: Destination[] = [];

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id);

      for (const m of memberships ?? []) {
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        if (!g) continue;
        dests.push({ key: `group:${g.id}`, kind: "group", id: g.id, title: g.name });
      }

      const { data: sent } = await supabase
        .from("direct_messages")
        .select("receiver_id")
        .eq("sender_id", user.id);
      const { data: received } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("receiver_id", user.id);

      const partnerIds = Array.from(
        new Set([
          ...(sent ?? []).map((r: { receiver_id: string }) => r.receiver_id),
          ...(received ?? []).map((r: { sender_id: string }) => r.sender_id),
        ])
      );
      for (const pid of partnerIds) {
        dests.push({
          key: `dm:${pid}`,
          kind: "dm",
          id: pid,
          title: `Chat ${pid.slice(0, 6)}`,
        });
      }

      setDestinations(dests);
    };
    loadDestinations();
  }, [open]);

  if (!open) return null;

  const toggleDest = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selected.length === 0) {
      setError("Select at least one destination.");
      return;
    }
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

    try {
      let imageUrls: string | null = null;
      const uploadedUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage
            .from("task-images")
            .upload(path, file);
          if (error) throw new Error(error.message);
          const { data } = supabase.storage
            .from("task-images")
            .getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const pastedUrls = imageUrl
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      const allUrls = [...pastedUrls, ...uploadedUrls];
      if (allUrls.length) imageUrls = allUrls.join(", ");

      const errors: string[] = [];
      for (const key of selected) {
        const dest = destinations.find((d) => d.key === key);
        if (!dest) continue;
        const groupId = dest.kind === "group" ? dest.id : null;
        const fullPayload = {
          task_id: task.id,
          group_id: groupId,
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
          const { error: basicError } = await supabase
            .from("coverage_requests")
            .insert({
              task_id: task.id,
              group_id: groupId,
              requested_by: user.id,
              status: "OPEN",
              requester_phone: phoneRequester || null,
              owner_phone: phoneOwner || null,
              links: links || null,
              image_urls: imageUrls,
            });
          if (basicError) errors.push(basicError.message);
        }
      }

      setLoading(false);
      if (errors.length) {
        setError(errors.join("; "));
        return;
      }
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setImageFiles(e.target.files)}
            />
          </div>

          <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Send to
            </p>
            <div className="max-h-40 space-y-1 overflow-auto">
              {destinations.map((d) => (
                <label
                  key={d.key}
                  className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(d.key)}
                    onChange={() => toggleDest(d.key)}
                  />
                  {d.title}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({d.kind})
                  </span>
                </label>
              ))}
              {destinations.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No destinations.
                </p>
              )}
            </div>
          </div>
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