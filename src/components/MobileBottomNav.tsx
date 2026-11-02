"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Calendar, MessageSquare, Upload, User } from "lucide-react";

export default function MobileBottomNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/dashboard" className="flex flex-col items-center text-xs text-zinc-600 dark:text-zinc-400">
          <Home size={20} />
          Dashboard
        </Link>
        <Link href="/calendar" className="flex flex-col items-center text-xs text-zinc-600 dark:text-zinc-400">
          <Calendar size={20} />
          Calendar
        </Link>
        <Link href="/interaction" className="flex flex-col items-center text-xs text-zinc-600 dark:text-zinc-400">
          <MessageSquare size={20} />
          Interaction
        </Link>
        <Link href="/import" className="flex flex-col items-center text-xs text-zinc-600 dark:text-zinc-400">
          <Upload size={20} />
          Import
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center text-xs text-zinc-600 dark:text-zinc-400"
        >
          <User size={20} />
          Profile
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-white p-6 dark:bg-zinc-950">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            >
              Close
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            <li>
              <Link href="/ai" onClick={() => setOpen(false)} className="block text-lg text-zinc-900 dark:text-zinc-50">
                AI Assistant
              </Link>
            </li>
            <li>
              <Link href="/groups" onClick={() => setOpen(false)} className="block text-lg text-zinc-900 dark:text-zinc-50">
                Groups
              </Link>
            </li>
            <li>
              <Link href="/messages" onClick={() => setOpen(false)} className="block text-lg text-zinc-900 dark:text-zinc-50">
                Direct Messages
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={() => setOpen(false)} className="block text-lg text-zinc-900 dark:text-zinc-50">
                Settings
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}