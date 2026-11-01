"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Row = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
};

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    title: headers.indexOf("title"),
    date: headers.indexOf("date"),
    start_time: headers.indexOf("start_time"),
    end_time: headers.indexOf("end_time"),
    location: headers.indexOf("location"),
  };

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseLine(lines[i]);
    const title = idx.title >= 0 ? cols[idx.title] ?? "" : "";
    if (!title) continue;
    rows.push({
      title,
      date: idx.date >= 0 ? (cols[idx.date] ?? "") : "",
      start_time: idx.start_time >= 0 ? (cols[idx.start_time] ?? "") : "",
      end_time: idx.end_time >= 0 ? (cols[idx.end_time] ?? "") : "",
      location: idx.location >= 0 ? (cols[idx.location] ?? "") : "",
    });
  }
  return rows;
}

export default function ImportTasks() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError("No valid rows found in CSV.");
      }
      setRows(parsed);
    } catch {
      setError("Failed to parse CSV.");
    }
  };

  const handleImport = async () => {
    setError(null);
    setSuccess(null);
    if (rows.length === 0) return;
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

    const payload = rows.map((r) => ({
      user_id: user.id,
      title: r.title,
      date: r.date || null,
      start_time: r.start_time || null,
      end_time: r.end_time || null,
      location: r.location || null,
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("tasks").insert(payload);

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(`Successfully imported ${rows.length} tasks.`);
    setRows([]);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Upload CSV
        </h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Expected columns: title, date, start_time, end_time, location
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/40 dark:text-green-400">
          {success}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Start
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    End
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">
                      {r.title}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {r.date}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {r.start_time}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {r.end_time}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {r.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Importing..." : "Confirm Import"}
          </button>
        </>
      )}
    </div>
  );
}