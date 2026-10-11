import { Download } from "lucide-react";
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
    return <p className="px-4 py-6 text-sm text-muted">Files show up as someone writes them.</p>;
  }

  return (
    <div className="px-3 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Files</h2>
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
        <ul className="rounded-lg border border-line">
          {visible.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                onClick={() => setSelected(file.path)}
                className={`flex min-h-11 w-full items-center px-3 text-left text-sm ${current?.path === file.path ? "bg-accent text-ink" : "text-fg"}`}
              >
                {file.path}
              </button>
            </li>
          ))}
        </ul>
        {current ? (
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{current.path}</p>
              <button
                type="button"
                onClick={() => downloadText(current.content, current.path.split("/").pop() || "file.txt")}
                className="text-sm text-muted hover:text-fg"
              >
                Save file
              </button>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-fg">
              {current.content}
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
    return <p className="px-4 py-6 text-sm text-muted">Inbox is empty for this step.</p>;
  }
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <section>
        <h2 className="font-serif text-2xl">Approvals</h2>
        <ul className="mt-3 space-y-2">
          {approvals.length === 0 ? <li className="text-sm text-muted">None yet.</li> : null}
          {approvals.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-surface p-4">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
              <p className="mt-2 text-xs tracking-wide text-accent uppercase">
                {item.status} · {item.risk}
              </p>
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
              <p className="text-sm font-medium">{note.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
