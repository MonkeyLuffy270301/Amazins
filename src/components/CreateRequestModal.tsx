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
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Task | null>({
    id: "",
    title: "New Request",
    date: null,
    location: null,
  });

  const handleClick = () => {
    setTask({ id: "", title: "New Request", date: null, location: null });
    setOpen(true);
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
        className="cursor-pointer text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Create request"
      >
        +
      </button>
      {task && (
        <RequestCoverageModal
          task={task}
          open={open}
          onClose={handleClose}
          createTask
        />
      )}
    </>
  );
}