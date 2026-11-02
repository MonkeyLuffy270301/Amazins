"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  region: string | null;
  address: string | null;
  avatar_url: string | null;
};

export default function SettingsForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"account" | "preferences" | "themes">("account");

  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      setOriginalEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, region, address, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setRegion(p.region ?? "");
        setAddress(p.address ?? "");
        setAvatarUrl(p.avatar_url ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!fullName.trim() || !region.trim() || !address.trim()) {
      setError("Full Name, Region, and Address are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setSaving(true);

    const supabase = createClient();
    if (email.trim() && email.trim() !== originalEmail) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (emailError) {
        setSaving(false);
        setError(emailError.message);
        return;
      }
      alert("A confirmation link has been sent to your new email.");
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        region,
        address,
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess("Changes saved successfully.");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      setDeleting(false);
      setError(error.message);
      setDeleteOpen(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            tab === "account"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setTab("preferences")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            tab === "preferences"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Preferences
        </button>
        <button
          type="button"
          onClick={() => setTab("themes")}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            tab === "themes"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Themes
        </button>
      </div>

      {tab === "account" && (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Region
            </label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Avatar URL
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
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
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Log Out
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
            >
              Delete Account
            </button>
          </div>
        </form>
      )}

      {tab === "preferences" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          UI Preferences coming soon
        </p>
      )}

      {tab === "themes" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Themes coming soon
        </p>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              Are you sure? This will permanently delete all your data.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
              >
                {deleting ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}