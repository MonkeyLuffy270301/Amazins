"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AcceptCoverageButton({
  requestId,
  disabled = false,
}: {
  requestId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_coverage", {
      request_id: requestId,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}      className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {loading ? "..." : "Accept"}
    </button>
  );
}