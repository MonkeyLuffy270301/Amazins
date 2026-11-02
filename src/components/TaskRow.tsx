"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import RequestCoverageModal from "@/components/RequestCoverageModal";
import CustomTimeInput from "@/components/CustomTimeInput";

type Task = {
  id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  phone?: string | null;
  links?: string | null;
  image_urls?: string | null;
};

export default function TaskRow({ task }: { task: Task }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(task.date ?? "");
  const [startTime, setStartTime] = useState(task.start_time ?? "");
  const [location, setLocation] = useState(task.location ?? "");
  const [phone, setPhone] = useState(task.phone ?? "");
  const [links, setLinks] = useState(task.links ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", task.id);
    setDeleting(false);
    setMenuOpen(false);
    router.refresh();
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      let imageUrlsToSave: string | null = task.image_urls ?? null;
      const uploadedUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const path = `${userId}/${Date.now()}-${file.name}`;
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
      if (allUrls.length) imageUrlsToSave = allUrls.join(", ");
      await supabase
        .from("tasks")
        .update({
          title,
          date: date || null,
          start_time: startTime || null,
          location: location || null,
          phone: phone || null,
          links: links || null,
          image_urls: imageUrlsToSave,
        })
        .eq("id", task.id);
      setSaving(false);
      setEditOpen(false);
      setMenuOpen(false);
      setImageFiles(null);
      router.refresh();
    } catch (err) {
      setSaving(false);
      alert(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const handleRequestCoverage = async () => {
    setMenuOpen(false);
    // prompt flow similar to RequestCoverageButton
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in.");

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
      return;
    }

    const list = groups.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
    const choice = window.prompt(`Select a group:\n${list}\n\nEnter number:`);
    const index = Number(choice) - 1;
    if (!choice || Number.isNaN(index) || index < 0 || index >= groups.length) return;

    const requesterPhone = window.prompt("Requester Phone:") ?? "";
    const ownerPhone = window.prompt("Owner Phone:") ?? "";
    const linksInput = window.prompt("Links (comma separated):") ?? "";
    const imageUrlsInput = window.prompt("Image URLs (comma separated):") ?? "";

    const { error } = await supabase.from("coverage_requests").insert({
      task_id: task.id,
      group_id: groups[index].id,
      requester_id: user.id,
      status: "OPEN",
      phone_requester: requesterPhone || null,
      phone_owner: ownerPhone || null,
      links: linksInput || null,
      image_urls: imageUrlsInput || null,
    });

    if (error) alert(error.message);
    else router.refresh();
  };

  return (
    <>
      <li className="flex items-center justify-between rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">
          {task.title}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
              >
                Edit
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMenuOpen(false);
                  setRequestOpen(true);
                }}
              >
                Request Coverage
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={async () => {
                  setMenuOpen(false);
                  const supabase = createClient();
                  await supabase
                    .from("tasks")
                    .update({ status: "COMPLETED" })
                    .eq("id", task.id);
                  router.refresh();
                }}
              >
                Mark as Completed
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </li>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleEditSave}
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h3 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Edit Task
            </h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <CustomTimeInput value={startTime} onChange={setStartTime}
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <input
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="Links (comma separated)"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
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
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
      <RequestCoverageModal
        task={task}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </>
  );
}