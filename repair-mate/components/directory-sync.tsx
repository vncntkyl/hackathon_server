"use client";

import { useEffect } from "react";
import { syncDirectory } from "@/lib/sync-directory";

export function DirectorySync() {
  useEffect(() => {
    let syncing = false;

    const sync = async () => {
      if (syncing || !navigator.onLine) return;

      syncing = true;
      try {
        await syncDirectory();
      } finally {
        syncing = false;
      }
    };

    void sync();

    window.addEventListener("online", sync);

    return () => {
      window.removeEventListener("online", sync);
    };
  }, []);

  return null;
}
