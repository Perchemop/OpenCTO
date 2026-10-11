import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Section, Snapshot } from "./types";

export type DeskRow = {
  id: string;
  name: string;
  snapshot: Snapshot;
  step: number;
  section: Section;
  updatedAt: string;
};

export const listDesks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      snapshot: Snapshot;
      step: number;
      section: string;
      updated_at: string;
    }>`
      select id, name, snapshot, step, section, updated_at
      from desks
      where user_id = ${context.userId}
      order by updated_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      snapshot: row.snapshot,
      step: row.step,
      section: (row.section || "lead") as Section,
      updatedAt: row.updated_at,
    })) satisfies DeskRow[];
  });

export const saveDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; name: string; snapshot: Snapshot; step: number; section: Section }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const name = data.name.trim() || data.snapshot.business?.name || "Untitled";
    await sql`
      insert into desks (id, user_id, name, snapshot, step, section, updated_at)
      values (
        ${data.id},
        ${context.userId},
        ${name},
        ${JSON.stringify(data.snapshot)}::jsonb,
        ${data.step},
        ${data.section},
        CURRENT_TIMESTAMP
      )
      on conflict (id) do update set
        name = excluded.name,
        snapshot = excluded.snapshot,
        step = excluded.step,
        section = excluded.section,
        updated_at = CURRENT_TIMESTAMP
      where desks.user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from desks where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });
