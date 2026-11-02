"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Bot, Search, User } from "lucide-react";

const LEFT_LINKS = [
  ["Dashboard", "/dashboard"],
  ["Calendar", "/calendar"],
  ["Groups", "/groups"],
  ["Import", "/import"],
  ["Messages", "/messages"],
  ["AI Assistant", "/ai"],
  ["History", "/history"],
];

const PROFILE_LINKS = [["Settings", "/settings"]];

type TaskResult = {
  id: string;
  title: string;
  date: string | null;
};

export default function TopNav() {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<TaskResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      const { data } = await supabase
        .from("tasks")
        .select("id, title, date")
        .ilike("title", `%${search.trim()}%`)
        .limit(8);
      setResults((data ?? []) as TaskResult[]);
      setSearchOpen(true);
    };
    const t = setTimeout(fetchResults, 250);
    return () => clearTimeout(t);
  }, [search, supabase]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setProfileEmail(user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .single();
      setJoinedDate(profile?.created_at ?? null);
    };
    loadProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white px-4 py-3 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="flex items-center gap-4">
          {LEFT_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              {label}
            </Link>
          ))}
        </div>

        <div ref={searchRef} className="relative ml-auto flex-1 max-w-md">
          <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800">
            <Search size={16} className="text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search && setSearchOpen(true)}
              placeholder="Search tasks, groups, people..."
              className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50"
            />
          </div>
          {searchOpen && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <ul>
                {results.map((r) => (
                  <li key={r.id}>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearch("");
                      }}
                    >
                      {r.title}
                      {r.date ? (
                        <span className="ml-2 text-xs text-zinc-500">{r.date}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
            aria-label="Profile"
          >
            <User size={18} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {profileEmail ?? "Unknown"}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Joined:{" "}
                  {joinedDate
                    ? new Date(joinedDate).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <ul className="py-1">
                {PROFILE_LINKS.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}