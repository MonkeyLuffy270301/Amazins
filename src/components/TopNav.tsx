import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Dashboard
        </Link>
        <Link
          href="/calendar"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Calendar
        </Link>
        <Link
          href="/groups"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Groups
        </Link>
      </div>
    </nav>
  );
}