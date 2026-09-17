"use client";

import { useState } from "react";

export default function SignOut() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="pr-out" type="button" disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/practice/logout", { method: "POST" });
        // Full reload for the same reason as signing in: the router cache still
        // holds the signed-in pages, and they must be fetched again without the
        // cookie rather than served from memory.
        window.location.replace("/practice/sign-in");
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
