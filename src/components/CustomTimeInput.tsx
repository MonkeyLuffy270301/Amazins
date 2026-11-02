"use client";

import { useEffect, useState } from "react";

function to24(hour12: string, minute: string, ampm: string) {
  let h = Number(hour12);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
}

export default function CustomTimeInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  useEffect(() => {
    if (!value) return;
    const [hh = "0", mm = "0"] = value.split(":");
    let h = Number(hh);
    const ap = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    setHour(String(h).padStart(2, "0"));
    setMinute(mm.padStart(2, "0"));
    setAmpm(ap);
  }, [value]);

  const update = (h: string, m: string, a: string) => {
    setHour(h);
    setMinute(m);
    setAmpm(a);
    if (h && m) {
      onChange(to24(h, m, a));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        maxLength={2}
        value={hour}
        onChange={(e) => update(e.target.value, minute, ampm)}
        className="w-10 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <span>:</span>
      <input
        type="text"
        maxLength={2}
        value={minute}
        onChange={(e) => update(hour, e.target.value, ampm)}
        className="w-10 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <select
        value={ampm}
        onChange={(e) => update(hour, minute, e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}