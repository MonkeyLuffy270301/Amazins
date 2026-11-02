"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AddTaskForm from "@/components/AddTaskForm";

export default function AddTaskModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Add task"
      >
        +
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Add Task
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ×
              </button>
            </div>
            <AddTaskForm />
          </div>
        </div>
      )}
    </>
  );
}