import { Download, FileCode2, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type Snapshot } from "@/lib/opencto/types";
import { downloadBytes, downloadText, zipStore } from "@/lib/opencto/zip";

export function Files({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const visible = snapshot.files.filter((file) => file.reveal_step <= step);
  const [selected, setSelected] = useState(visible[0]?.path ?? "");
  const current = visible.find((file) => file.path === selected) ?? visible[0];
  const options = useMemo(() => visible.map((file) => file.path).join("|"), [visible]);
  useEffect(() => {
    if (!visible.some((file) => file.path === selected) && visible[0]) setSelected(visible[0].path);
  }, [options, selected, visible]);

  if (visible.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-4 py-10 text-center">
        <div>
          <FileCode2 className="mx-auto size-8 text-muted" aria-hidden />
          <h2 className="mt-3 font-serif text-3xl">No files yet</h2>
          <p className="mt-2 text-sm text-muted">
            As the team writes, drafts appear here. You can download a full workspace zip when ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Files</h2>
          <p className="text-xs text-muted">{visible.length} visible at this step</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const packed = zipStore(visible.map((file) => ({ path: file.path, content: file.content })));
            const slug =
              snapshot.business.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "opencto";
            downloadBytes(packed, `${slug}-workspace.zip`, "application/zip");
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm"
        >
          <Download className="size-4" aria-hidden />
          Download all
        </button>
      </div>
      <div className="grid min-h-96 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ul className="max-h-[28rem] overflow-y-auto rounded-lg border border-line">
          {visible.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                onClick={() => setSelected(file.path)}
                className={`flex min-h-11 w-full flex-col items-start justify-center gap-0.5 px-3 py-2 text-left text-sm ${current?.path === file.path ? "bg-accent text-ink" : "text-fg"}`}
              >
                <span className="w-full truncate">{file.path}</span>
                <span className={`text-xs ${current?.path === file.path ? "text-ink/70" : "text-muted"}`}>
                  {file.language || "text"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {current ? (
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{current.path}</p>
                <p className="text-xs text-muted">{current.language || "text"}</p>
              </div>
              <button
                type="button"
                onClick={() => downloadText(current.content, current.path.split("/").pop() || "file.txt")}
                className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-sm"
              >
                Save file
              </button>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-fg">
              {current.content || "(empty file)"}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InboxView({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const notes = snapshot.inbox.filter((note) => note.reveal_step <= step);
  const approvals = snapshot.approvals.filter((item) => item.reveal_step <= step);
  if (notes.length === 0 && approvals.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-4 py-10 text-center">
        <div>
          <Inbox className="mx-auto size-8 text-muted" aria-hidden />
          <h2 className="mt-3 font-serif text-3xl">Inbox is quiet</h2>
          <p className="mt-2 text-sm text-muted">Approvals and notes land here as the run moves forward.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <section>
        <h2 className="font-serif text-2xl">Approvals</h2>
        <ul className="mt-3 space-y-2">
          {approvals.length === 0 ? <li className="text-sm text-muted">None yet.</li> : null}
          {approvals.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs tracking-wide text-accent uppercase">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
              <p className="mt-2 text-xs text-muted">Risk: {item.risk}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Notes</h2>
        <ul className="mt-3 space-y-2">
          {notes.length === 0 ? <li className="text-sm text-muted">No notes yet.</li> : null}
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium">{note.title}</p>
                {note.kind ? (
                  <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{note.kind}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
