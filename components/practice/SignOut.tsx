"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="pr-out" type="button" disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/practice/logout", { method: "POST" });
        router.replace("/practice/sign-in");
        router.refresh();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
