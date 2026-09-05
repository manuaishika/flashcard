"use client";

import { useRouter } from "next/navigation";

export function DeleteWordButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        if (!confirm("Delete this word and its review history?")) return;
        const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/app");
          router.refresh();
        }
      }}
      className="text-sm text-ink-faint underline underline-offset-4 hover:text-red-700"
    >
      Delete
    </button>
  );
}
