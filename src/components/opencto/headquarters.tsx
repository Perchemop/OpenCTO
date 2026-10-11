import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AppWindow,
  ArrowUp,
  Check,
  Columns3,
  Download,
  FastForward,
  FolderOpen,
  Inbox,
  MessageSquare,
  Pause,
  Play,
  ScrollText,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CommandPalette, type Command } from "@/components/opencto/commands";
import { Mark } from "@/components/opencto/mark";
import { suggestions } from "@/lib/opencto/suggest";
import { useOpenCto } from "@/lib/opencto/store";
import { columnAt, ownerName, TEAMS, type Employee, type Section, type Snapshot } from "@/lib/opencto/types";
import { downloadBytes, downloadText, zipStore } from "@/lib/opencto/zip";

const NAV: { id: Section; label: string; icon: typeof MessageSquare }[] = [
  { id: "lead", label: "Lead", icon: MessageSquare },
  { id: "team", label: "Team", icon: Users },
  { id: "site", label: "Site", icon: AppWindow },
  { id: "plan", label: "Plan", icon: ScrollText },
  { id: "tasks", label: "Tasks", icon: Columns3 },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "runway", label: "Runway", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Headquarters() {
  const [hydrated, setHydrated] = useState(false);
  const snapshot = useOpenCto((s) => s.snapshot);
  usePlayback();

  useEffect(() => {
    void useOpenCto.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p>Opening the desk…</p>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 bg-bg px-6 text-fg">
        <Mark className="size-8 text-accent" />
        <h1 className="font-serif text-4xl font-medium">No business on the desk</h1>
        <p className="text-muted">Start a team from the front door. The run stays in this browser.</p>
        <Link to="/" className="inline-flex min-h-11 w-fit items-center rounded-full bg-accent px-4 text-sm font-medium text-ink">
          Start a team
        </Link>
      </main>
    );
  }

  return <Desk snapshot={snapshot} />;
}

function usePlayback() {
  const playing = useOpenCto((s) => s.playing);
  const step = useOpenCto((s) => s.step);
  const len = useOpenCto((s) => s.snapshot?.log.length ?? 0);
  const advance = useOpenCto((s) => s.advance);
  const finishPlayback = useOpenCto((s) => s.finishPlayback);

  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || step >= len) {
      finishPlayback();
      return;
    }
    const timer = window.setTimeout(advance, 680);
    return () => window.clearTimeout(timer);
  }, [playing, step, len, advance, finishPlayback]);
}

function Desk({ snapshot }: { snapshot: Snapshot }) {
  const navigate = useNavigate();
  const section = useOpenCto((s) => s.section);
  const setSection = useOpenCto((s) => s.setSection);
  const step = useOpenCto((s) => s.step);
  const playing = useOpenCto((s) => s.playing);
  const setPlaying = useOpenCto((s) => s.setPlaying);
  const finishPlayback = useOpenCto((s) => s.finishPlayback);
  const setRunStatus = useOpenCto((s) => s.setRunStatus);
  const busy = useOpenCto((s) => s.busy);
  const error = useOpenCto((s) => s.error);
  const decide = useOpenCto((s) => s.decide);
  const desks = useOpenCto((s) => s.desks);
  const activeId = useOpenCto((s) => s.activeId);
  const switchDesk = useOpenCto((s) => s.switchDesk);
  const paused = snapshot.business.status === "paused";
  const pending = snapshot.approvals.filter((item) => item.status === "pending" && item.reveal_step <= step);
  const progress = snapshot.log.length === 0 ? 100 : Math.round((step / snapshot.log.length) * 100);
  const doing = snapshot.tasks.filter((task) => columnAt(task, step) === "doing").length;
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandsOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function downloadWorkspace() {
    const files = snapshot.files.filter((file) => file.reveal_step <= step && file.content);
    if (files.length === 0) return;
    const slug = snapshot.business.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "opencto";
    downloadBytes(
      zipStore(files.map((file) => ({ path: file.path, content: file.content }))),
      `${slug}-workspace.zip`,
      "application/zip",
    );
  }

  const commands: Command[] = [
    ...NAV.map((item) => ({
      id: `go-${item.id}`,
      label: `Open ${item.label.toLowerCase()}`,
      hint: "View",
      run: () => setSection(item.id),
    })),
    {
      id: "status",
      label: paused ? "Resume the business" : "Pause the business",
      run: () => void setRunStatus(paused ? "resume" : "pause"),
    },
    {
      id: "play",
      label: playing ? "Hold playback" : "Play the work log",
      run: () => setPlaying(!playing),
    },
    { id: "skip", label: "Skip playback", run: finishPlayback },
    ...(pending[0]
      ? [
          {
            id: "approve",
            label: "Approve the pending gate",
            run: () => void decide(true, pending[0].id),
          },
        ]
      : []),
    { id: "zip", label: "Download the workspace", hint: "ZIP", run: downloadWorkspace },
    {
      id: "new",
      label: "Start another business",
      hint: "Keeps this one",
      run: () => void navigate({ to: "/" }),
    },
    ...desks
      .filter((desk) => desk.id !== activeId)
      .map((desk) => ({
        id: `desk-${desk.id}`,
        label: `Switch to ${desk.snapshot.business.name}`,
        hint: "Business",
        run: () => switchDesk(desk.id),
      })),
  ];

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="border-b border-line">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <Link to="/" className="text-accent" aria-label="OpenCTO home">
            <Mark className="size-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-xl leading-none">{snapshot.business.name}</p>
            <p className="truncate text-xs text-muted">{snapshot.business.tagline}</p>
          </div>
          <span className="hidden rounded-full border border-line px-3 py-1 text-xs text-muted sm:inline">
            {snapshot.business.model}
          </span>
          <button
            type="button"
            onClick={() => setCommandsOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-line"
            aria-label="Commands"
          >
            <Search className="size-4" aria-hidden />
          </button>
          <Link to="/" className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm">
            New
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setRunStatus(paused ? "resume" : "pause")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm"
          >
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
        {desks.length > 1 ? (
          <div className="px-3 pb-3 sm:px-4">
            <label className="sr-only" htmlFor="business-switch">
              Business
            </label>
            <select
              id="business-switch"
              value={activeId ?? ""}
              onChange={(event) => switchDesk(event.target.value)}
              className="min-h-11 max-w-full rounded-full border border-line bg-bg px-3 text-sm text-fg"
            >
              {desks.map((desk) => (
                <option key={desk.id} value={desk.id}>
                  {desk.snapshot.business.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="h-1 bg-line" aria-hidden>
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-line px-3 py-2" aria-label="Headquarters">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm ${active ? "bg-accent text-ink" : "text-muted"}`}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              {item.id === "tasks" && doing > 0 ? <span className="tabular-nums">{doing}</span> : null}
              {item.id === "inbox" && pending.length > 0 ? <span className="tabular-nums">{pending.length}</span> : null}
            </button>
          );
        })}
      </nav>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-2 border-b border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <p className="text-sm font-medium">{pending[0].title}</p>
            <p className="text-sm text-muted">{pending[0].detail}</p>
          </div>
          <div className="flex gap-2">
            {rejectFor === pending[0].id ? (
              <form
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void decide(false, pending[0].id, reason);
                  setRejectFor(null);
                  setReason("");
                }}
              >
                <label className="sr-only" htmlFor="reject-reason">
                  Why hold this draft
                </label>
                <input
                  id="reject-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why hold it? Optional."
                  className="min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg outline-none sm:w-64"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-3 text-sm"
                >
                  Hold the draft
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejectFor(pending[0].id)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm"
              >
                <X className="size-4" aria-hidden />
                Reject
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide(true, pending[0].id)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-3 text-sm font-medium text-ink"
            >
              <Check className="size-4" aria-hidden />
              Approve
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="border-b border-line px-4 py-2 text-sm text-accent">{error}</p> : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {section === "lead" ? <Lead snapshot={snapshot} step={step} /> : null}
        {section === "team" ? <Team snapshot={snapshot} step={step} /> : null}
        {section === "site" ? <Site snapshot={snapshot} step={step} /> : null}
        {section === "plan" ? <Plan snapshot={snapshot} /> : null}
        {section === "tasks" ? <Tasks snapshot={snapshot} step={step} /> : null}
        {section === "files" ? <Files snapshot={snapshot} step={step} /> : null}
        {section === "inbox" ? <InboxView snapshot={snapshot} step={step} /> : null}
        {section === "runway" ? <Runway snapshot={snapshot} step={step} /> : null}
        {section === "settings" ? <SettingsView snapshot={snapshot} /> : null}
      </div>

      {step < snapshot.log.length ? (
        <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2 text-sm">
          <p className="truncate text-muted">
            {playing ? "The team is working" : "Playback is paused"} · {step}/{snapshot.log.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3"
            >
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {playing ? "Hold" : "Play"}
            </button>
            <button
              type="button"
              onClick={finishPlayback}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3"
            >
              <FastForward className="size-4" aria-hidden />
              Skip
            </button>
          </div>
        </div>
      ) : null}
      <CommandPalette open={commandsOpen} onClose={() => setCommandsOpen(false)} commands={commands} />
    </div>
  );
}

function Lead({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const send = useOpenCto((s) => s.send);
  const busy = useOpenCto((s) => s.busy);
  const [text, setText] = useState("");
  const messages = snapshot.messages.filter((message) => message.at_step <= step);
  const events = snapshot.log.filter((event) => event.step <= step);
  const latest = events[events.length - 1];
  const ideas = suggestions(snapshot, step);
  const timeline = [
    ...messages.map((message) => ({
      key: message.id,
      order: message.at_step * 10,
      kind: "message" as const,
      message,
    })),
    ...events.map((event) => ({
      key: `e${event.step}-${event.kind}`,
      order: event.step * 10 + 1,
      kind: "event" as const,
      event,
    })),
  ].sort((a, b) => a.order - b.order);

  function submit(next: string) {
    const value = next.trim();
    if (!value) return;
    setText("");
    void send(value);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-w-0 flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {timeline.map((item) =>
            item.kind === "message" ? (
              <li
                key={item.key}
                className={`max-w-prose rounded-lg px-4 py-3 text-sm leading-relaxed ${item.message.role === "user" ? "ml-auto bg-accent text-ink" : "mr-auto border border-line bg-surface text-fg"}`}
              >
                <p className="mb-1 text-xs tracking-wide uppercase opacity-70">{item.message.from}</p>
                {item.message.body}
              </li>
            ) : (
              <li key={item.key} className="mr-auto max-w-prose rounded-lg border border-line px-3 py-2 text-sm">
                <p className="text-xs tracking-wide text-accent uppercase">
                  {item.event.actor} · {item.event.kind}
                </p>
                <p className="mt-1 leading-relaxed">{item.event.text}</p>
              </li>
            ),
          )}
        </ul>
        <div className="flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={busy}
              onClick={() => submit(idea)}
              className="min-h-11 rounded-full border border-line px-3 text-left text-sm text-muted"
            >
              {idea}
            </button>
          ))}
        </div>
        <form
          className="sticky bottom-0 flex items-end gap-2 rounded-lg border border-line bg-surface p-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <label htmlFor="lead-message" className="sr-only">
            Message the lead
          </label>
          <textarea
            id="lead-message"
            rows={2}
            value={text}
            suppressHydrationWarning
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a pricing section, hire a writer, or pause."
            className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={busy || text.trim().length === 0}
            className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-ink disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      </section>
      <aside className="min-w-0 rounded-lg border border-line bg-surface p-4" aria-live="polite">
        <p className="text-xs tracking-widest text-accent uppercase">Floor</p>
        {latest ? (
          <>
            <p className="mt-2 font-medium">{latest.actor}</p>
            <p className="text-xs text-muted uppercase">{latest.kind}</p>
            <p className="mt-2 text-sm leading-relaxed">{latest.text}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Waiting for the first note.</p>
        )}
        <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto text-xs text-muted">
          {events.slice(-8).map((event) => (
            <li key={event.step}>
              <span className="text-fg">{event.actor}</span> · {event.text}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Team({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const hire = useOpenCto((s) => s.hire);
  const hireCustom = useOpenCto((s) => s.hireCustom);
  const fire = useOpenCto((s) => s.fire);
  const busy = useOpenCto((s) => s.busy);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState("");
  const working = new Set(
    snapshot.tasks.filter((task) => columnAt(task, step) === "doing").map((task) => task.owner),
  );
  const lead = snapshot.team.find((person) => person.lead);
  const reports = snapshot.team.filter((person) => !person.lead);

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4">
      <h2 className="font-serif text-3xl">Org chart</h2>
      <p className="mt-1 text-sm text-muted">The lead delegates. Everyone else reports to them.</p>
      {lead ? (
        <div className="mx-auto mt-4 max-w-md">
          <PersonCard person={lead} working={working.has(lead.id)} busy={busy} />
          {reports.length > 0 ? <div className="mx-auto h-6 w-px bg-line" aria-hidden /> : null}
        </div>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {reports.map((person) => (
          <li key={person.id}>
            <PersonCard
              person={person}
              working={working.has(person.id)}
              busy={busy}
              onFire={() => void fire(person.id)}
            />
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Hire one person</h2>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void hireCustom(name, role, focus);
          setName("");
          setRole("");
          setFocus("");
        }}
      >
        <label className="text-sm">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <label className="text-sm">
          Role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Editor"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Focus
          <input
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Cuts the long sentences"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          Hire
        </button>
      </form>

      <h2 className="mt-8 font-serif text-2xl">Hire another desk</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {TEAMS.map((team) => (
          <li key={team.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{team.name}</p>
              <p className="text-sm text-muted">{team.detail}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void hire(team.id)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm"
            >
              Hire
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PersonCard({
  person,
  working,
  busy,
  onFire,
}: {
  person: Employee;
  working: boolean;
  busy: boolean;
  onFire?: () => void;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl">{person.name}</p>
          <p className="text-sm text-muted">
            {person.role}
            {person.lead ? " · lead" : ""}
          </p>
        </div>
        <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">
          {working ? "Working" : "Idle"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{person.focus}</p>
      <p className="mt-2 text-xs tracking-wide text-accent uppercase">{person.model}</p>
      {onFire ? (
        <button
          type="button"
          disabled={busy}
          onClick={onFire}
          className="mt-4 min-h-11 text-sm text-muted underline-offset-2 hover:underline"
        >
          Remove from team
        </button>
      ) : null}
    </article>
  );
}

function Site({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const ready = snapshot.log.length === 0 || step >= Math.max(1, snapshot.log.length - 1);
  return (
    <div className="flex h-full min-h-96 flex-col px-3 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Preview</h2>
        <span className="text-xs tracking-wide text-muted uppercase">
          {snapshot.published ? "Published locally" : "Draft"}
        </span>
      </div>
      {ready ? (
        <iframe
          title="Draft preview"
          sandbox=""
          srcDoc={snapshot.site_html}
          className="min-h-96 w-full flex-1 rounded-lg border border-line bg-surface"
        />
      ) : (
        <div className="grid min-h-96 flex-1 place-items-center rounded-lg border border-dashed border-line text-sm text-muted">
          The preview lands when the draft is written.
        </div>
      )}
    </div>
  );
}

function Plan({ snapshot }: { snapshot: Snapshot }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <h2 className="font-serif text-4xl font-medium">{snapshot.business.name}</h2>
      <ol className="mt-6 space-y-6">
        {snapshot.plan.map((section) => (
          <li key={section.heading}>
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

function Tasks({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-3 py-4">
      {COLUMNS.map(([id, label]) => {
        const tasks = snapshot.tasks.filter((task) => columnAt(task, step) === id);
        return (
          <section key={id} className="w-72 shrink-0">
            <h2 className="mb-2 text-xs tracking-widest text-muted uppercase">
              {label} · {tasks.length}
            </h2>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-lg border border-line bg-surface p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{task.detail}</p>
                  <p className="mt-2 text-xs text-accent">{ownerName(snapshot, task.owner)}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Files({ snapshot, step }: { snapshot: Snapshot; step: number }) {
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
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => downloadText(current.content, current.path.split("/").pop() ?? "file.txt", "text/plain")}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm"
              >
                <Download className="size-4" aria-hidden />
                Download
              </button>
            </div>
            <pre className="max-h-dvh overflow-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg">
              {current.content || "Still writing this file."}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InboxView({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const notes = snapshot.inbox.filter((note) => note.reveal_step <= step);
  const decide = useOpenCto((s) => s.decide);
  const busy = useOpenCto((s) => s.busy);
  if (notes.length === 0) return <p className="px-4 py-6 text-sm text-muted">The inbox is quiet.</p>;
  return (
    <ul className="mx-auto w-full max-w-3xl divide-y divide-line px-3">
      {notes.map((note) => (
        <li key={note.id} className="py-4">
          <p className="text-xs tracking-widest text-accent uppercase">{note.kind}</p>
          <p className="mt-1 font-medium">{note.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{note.body}</p>
          {note.kind === "approval" && snapshot.approvals.some((item) => item.status === "pending") ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide(true)}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-3 text-sm font-medium text-ink"
            >
              Approve
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Runway({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const done = snapshot.tasks.filter((task) => columnAt(task, step) === "done").length;
  const files = snapshot.files.filter((file) => file.reveal_step <= step).length;
  const stats = [
    ["Runs", String(snapshot.runs)],
    ["Tasks done", String(done)],
    ["Files", String(files)],
    ["Events played", `${step}/${snapshot.log.length}`],
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h2 className="font-serif text-4xl font-medium">No token meter</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        The local planner does not call a paid model. These numbers are work on this machine, not a bill.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-4">
            <dt className="text-xs tracking-widest text-muted uppercase">{label}</dt>
            <dd className="mt-2 font-serif text-3xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SettingsView({ snapshot }: { snapshot: Snapshot }) {
  const patchSettings = useOpenCto((s) => s.patchSettings);
  const toggleMcp = useOpenCto((s) => s.toggleMcp);
  const reset = useOpenCto((s) => s.reset);
  const settings = snapshot.settings;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <section>
        <h2 className="font-serif text-3xl">This business</h2>
        <p className="mt-2 text-sm text-muted">
          {snapshot.business.name} · {snapshot.seed.kind} · profile {snapshot.business.model}. Settings stay in this browser.
        </p>
      </section>
      <label className="block text-sm">
        Linked repository
        <input
          value={settings.repo}
          onChange={(event) => patchSettings({ repo: event.target.value })}
          placeholder="you/repo — a note, not a login"
          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
        />
      </label>
      <label className="block text-sm">
        Webhook
        <input
          value={settings.webhook}
          onChange={(event) => patchSettings({ webhook: event.target.value })}
          placeholder="https://example.com/hooks/opencto"
          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
        />
      </label>
      <label className="block text-sm">
        Schedule
        <select
          value={settings.schedule}
          onChange={(event) => patchSettings({ schedule: event.target.value })}
          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg"
        >
          <option value="off">Off</option>
          <option value="daily">Daily note</option>
          <option value="weekdays">Weekday note</option>
        </select>
      </label>
      <section>
        <h3 className="font-medium">Tools the team may use</h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {settings.mcp.map((flag) => (
            <li key={flag.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block text-sm">{flag.label}</span>
                <span className="block text-xs text-muted">{flag.detail}</span>
              </span>
              <button
                type="button"
                aria-pressed={flag.enabled}
                onClick={() => toggleMcp(flag.id)}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${flag.enabled ? "bg-accent text-ink" : "border border-line text-muted"}`}
              >
                {flag.enabled ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm leading-relaxed text-muted">
        Secrets are not collected here on purpose. When you self-host, put them in the environment of the machine that runs the CLI, not in a shared desk.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/guide" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm">
          Self-host guide
        </Link>
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center text-sm text-muted">
          Clear this desk
        </button>
      </div>
    </div>
  );
}
