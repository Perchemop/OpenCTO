import { useState } from "react";
import { columnAt, ownerName, type Snapshot } from "@/lib/opencto/types";

export function Site({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const ready = Boolean(snapshot.site_html) && (snapshot.log.length === 0 || step >= Math.max(1, snapshot.log.length - 1));
  const [narrow, setNarrow] = useState(false);

  function openTab() {
    if (!snapshot.site_html) return;
    const blob = new Blob([snapshot.site_html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="flex h-full min-h-96 flex-col px-3 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Preview</h2>
          <p className="text-xs text-muted">HTML draft written on this device — not a live deploy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tracking-wide text-muted uppercase">
            {snapshot.published ? "Published locally" : "Draft"}
          </span>
          <button
            type="button"
            onClick={() => setNarrow((v) => !v)}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm"
          >
            {narrow ? "Full width" : "Phone width"}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={openTab}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm disabled:opacity-40"
          >
            Open in tab
          </button>
        </div>
      </div>
      {ready ? (
        <div className={`mx-auto w-full flex-1 ${narrow ? "max-w-sm" : ""}`}>
          <iframe
            title="Draft preview"
            sandbox=""
            srcDoc={snapshot.site_html}
            className="min-h-96 w-full flex-1 rounded-lg border border-line bg-surface"
          />
        </div>
      ) : (
        <div className="grid min-h-96 flex-1 place-items-center rounded-lg border border-dashed border-line px-6 text-center text-sm text-muted">
          <div>
            <p className="font-medium text-fg">Preview not ready yet</p>
            <p className="mt-1">Play the work log or wait until the team writes the draft HTML.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Plan({ snapshot }: { snapshot: Snapshot }) {
  if (snapshot.plan.length === 0) {
    return (
      <div className="mx-auto grid min-h-64 max-w-3xl place-items-center px-4 py-10 text-center">
        <div>
          <h2 className="font-serif text-3xl">Plan is still forming</h2>
          <p className="mt-2 text-sm text-muted">As the team works, sections appear here: goal, offer, stack, and risks.</p>
        </div>
      </div>
    );
  }
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <p className="text-xs tracking-widest text-accent uppercase">Plan</p>
      <h2 className="mt-2 font-serif text-4xl font-medium">{snapshot.business.name}</h2>
      <p className="mt-2 text-sm text-muted">
        {snapshot.business.tagline || snapshot.business.brief} · {snapshot.business.status}
      </p>
      <ol className="mt-6 space-y-6">
        {snapshot.plan.map((section) => (
          <li key={section.heading} className="rounded-lg border border-line bg-surface p-4">
            <h3 className="font-serif text-2xl">{section.heading}</h3>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">{section.body}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

const COLUMNS = [
  ["backlog", "Backlog"],
  ["doing", "Doing"],
  ["review", "Review"],
  ["done", "Done"],
] as const;

export function Tasks({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = snapshot.tasks.find((task) => task.id === selectedId) ?? null;
  const total = snapshot.tasks.length;

  if (total === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-4 py-10 text-center">
        <div>
          <h2 className="font-serif text-3xl">No tasks yet</h2>
          <p className="mt-2 text-sm text-muted">When the lead breaks the work down, cards will move across this board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-3 py-4 lg:flex-row">
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto">
        {COLUMNS.map(([id, label]) => {
          const tasks = snapshot.tasks.filter((task) => columnAt(task, step) === id);
          return (
            <section key={id} className="w-72 shrink-0">
              <h2 className="mb-2 text-xs tracking-widest text-muted uppercase">
                {label} · {tasks.length}
              </h2>
              <ul className="space-y-2">
                {tasks.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                    Empty
                  </li>
                ) : null}
                {tasks.map((task) => {
                  const active = selectedId === task.id;
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(task.id)}
                        className={`w-full rounded-lg border p-3 text-left ${active ? "border-accent bg-surface" : "border-line bg-surface"}`}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{task.detail}</p>
                        <p className="mt-2 text-xs text-accent">{ownerName(snapshot, task.owner)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <aside className="w-full shrink-0 rounded-lg border border-line bg-surface p-4 lg:w-80">
        {selected ? (
          <>
            <p className="text-xs tracking-widest text-accent uppercase">Task</p>
            <h3 className="mt-2 font-serif text-2xl">{selected.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{selected.detail}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Owner</dt>
                <dd>{ownerName(snapshot, selected.owner)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Column</dt>
                <dd className="capitalize">{columnAt(selected, step)}</dd>
              </div>
              {selected.artifact ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Artifact</dt>
                  <dd className="truncate text-right">{selected.artifact}</dd>
                </div>
              ) : null}
            </dl>
            {selected.moves.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs tracking-wide text-muted uppercase">History</p>
                <ol className="mt-2 space-y-1 text-xs text-muted">
                  {selected.moves
                    .filter((move) => move.step <= step)
                    .map((move) => (
                      <li key={`${move.step}-${move.column}`}>
                        Step {move.step} → <span className="capitalize text-fg">{move.column}</span>
                      </li>
                    ))}
                </ol>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-4 text-sm text-muted hover:text-fg"
            >
              Close detail
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Select a card to see owner, history, and linked artifact.</p>
        )}
      </aside>
    </div>
  );
}
