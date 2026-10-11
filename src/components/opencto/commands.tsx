import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => input.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  function go(command: Command | undefined) {
    if (!command) return;
    onClose();
    command.run();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-start bg-bg/80 px-3 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commands"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <label className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-muted" aria-hidden />
          <span className="sr-only">Find a command</span>
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "Enter") {
                event.preventDefault();
                go(shown[0]);
              }
            }}
            placeholder="Jump, approve, download…"
            className="min-h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </label>
        <ul className="max-h-80 overflow-y-auto py-1">
          {shown.length === 0 ? <li className="px-3 py-3 text-sm text-muted">No matching command.</li> : null}
          {shown.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                onClick={() => go(command)}
                className="flex min-h-11 w-full items-baseline justify-between gap-3 px-3 text-left text-sm hover:bg-bg"
              >
                <span>{command.label}</span>
                {command.hint ? <span className="text-xs text-muted">{command.hint}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
