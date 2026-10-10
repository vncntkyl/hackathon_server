
import { db, type LocalPro } from "@/lib/offline-db";

interface DirectoryResponse {
  schemaVersion: number;
  syncedAt: string;
  workers: LocalPro[];
}

export async function syncDirectory(): Promise<boolean> {
  try {
    const response = await fetch("/api/sync/directory", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const payload =
      (await response.json()) as DirectoryResponse;

    if (
      payload.schemaVersion !== 1 ||
      !Array.isArray(payload.workers) ||
      typeof payload.syncedAt !== "string" ||
      !payload.workers.every(
        (worker) =>
          typeof worker.id === "string" &&
          typeof worker.trade === "string" &&
          typeof worker.area === "string",
      )
    ) {
      throw new Error("Invalid directory payload");
    }

    await db.transaction(
      "rw",
      db.workers,
      db.meta,
      async () => {
        // Atomic replacement: failed transactions roll back.
        await db.workers.clear();
        await db.workers.bulkPut(payload.workers);

        await db.meta.put({
          key: "directoryLastSyncedAt",
          value: payload.syncedAt,
        });
      },
    );

    return true;
  } catch (error) {
    console.error("Directory sync failed", error);
    return false;
  }
}