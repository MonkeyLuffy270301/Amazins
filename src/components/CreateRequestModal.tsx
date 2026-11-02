"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import RequestCoverageModal from "@/components/RequestCoverageModal";

type Task = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
};

export default function CreateRequestModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

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

    const taskId = crypto.randomUUID();
    await supabase.from("tasks").insert({
      id: taskId,
      user_id: user.id,
      title: "New Request",
      date: null,
      status: "pending",
    });

    setTask({ id: taskId, title: "New Request", date: null, location: null });
    setOpen(true);
    setLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTask(null);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="cursor-pointer text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Create request"
      >
        {loading ? "..." : "+"}
      </button>
      {task && (
        <RequestCoverageModal task={task} open={open} onClose={handleClose} />
      )}
    </>
  );
}