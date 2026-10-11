import { deleteDesk, listDesks, saveDesk } from "./desks.server";
import type { DeskRecord } from "./store";
import type { Section, Snapshot } from "./types";

/** Load cloud desks for the signed-in user. Returns null if unauthorized or offline. */
export async function pullDesks(): Promise<DeskRecord[] | null> {
  try {
    const rows = await listDesks();
    return rows.map((row) => ({
      id: row.id,
      snapshot: row.snapshot,
      step: row.step,
      section: row.section,
    }));
  } catch {
    return null;
  }
}

/** Upsert one desk for the signed-in user. No-ops on auth failure. */
export async function pushDesk(record: DeskRecord): Promise<boolean> {
  try {
    await saveDesk({
      data: {
        id: record.id,
        name: record.snapshot.business?.name ?? "Untitled",
        snapshot: record.snapshot,
        step: record.step,
        section: record.section,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/** Delete a cloud desk. No-ops on auth failure. */
export async function removeDesk(id: string): Promise<boolean> {
  try {
    await deleteDesk({ data: id });
    return true;
  } catch {
    return false;
  }
}

export type { Snapshot, Section };
