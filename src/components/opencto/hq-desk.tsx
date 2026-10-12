import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AppWindow,
  Check,
  Columns3,
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
import { useEffect, useState } from "react";
import { CommandPalette, type Command } from "@/components/opencto/commands";
import { Lead, Team, LocalTip } from "@/components/opencto/hq-lead-team";
import { Site, Plan, Tasks } from "@/components/opencto/hq-site-tasks";
import { Files, InboxView } from "@/components/opencto/hq-files-inbox";
import { Runway, SettingsView } from "@/components/opencto/hq-runway-settings";
import {
  getPullOnOpen,
  loadSession,
  maybeAutoPush,
  pullDesksFromGist,
  pushDesksToGist,
  type GitHubSession,
} from "@/lib/opencto/github";
import { useOpenCto, type DeskRecord } from "@/lib/opencto/store";
import { columnAt, type Section, type Snapshot } from "@/lib/opencto/types";
import { downloadBytes, zipStore } from "@/lib/opencto/zip";

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

function flushDesks(
  desks: DeskRecord[],
  activeId: string | null,
  snapshot: Snapshot,
  step: number,
  section: Section,
): DeskRecord[] {
  let list = desks.slice();
  if (snapshot && activeId) {
    const record = { id: activeId, snapshot, step, section };
    const idx = list.findIndex((d) => d.id === activeId);
    if (idx < 0) list = [...list, record];
    else list = list.map((d, i) => (i === idx ? record : d));
  }
  return list;
}

export function Desk({ snapshot }: { snapshot: Snapshot }) {
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
  const renameDesk = useOpenCto((s) => s.renameDesk);
  const importDesks = useOpenCto((s) => s.importDesks);
  const paused = snapshot.business.status === "paused";
  const pending = snapshot.approvals.filter((item) => item.status === "pending" && item.reveal_step <= step);
  const progress = snapshot.log.length === 0 ? 100 : Math.round((step / snapshot.log.length) * 100);
  const doing = snapshot.tasks.filter((task) => columnAt(task, step) === "doing").length;
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(snapshot.business.name);
  const [gh, setGh] = useState<GitHubSession | null>(() => loadSession());
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    setRenameValue(snapshot.business.name);
    setRenaming(false);
  }, [snapshot.business.name, activeId]);

  useEffect(() => {
    setGh(loadSession());
  }, [section]);

  useEffect(() => {
    if (!getPullOnOpen() || !loadSession()) return;
    let cancelled = false;
    void (async () => {
      const res = await pullDesksFromGist();
      if (cancelled || !res.ok) return;
      importDesks(res.payload.desks, res.payload.activeId);
      setSyncNote(`Synced ${res.payload.desks.length} desk(s) from GitHub`);
      setGh(loadSession());
    })();
    return () => {
      cancelled = true;
    };
  }, [importDesks]);

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
    const slug =
      snapshot.business.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "opencto";
    downloadBytes(
      zipStore(files.map((file) => ({ path: file.path, content: file.content }))),
      `${slug}-workspace.zip`,
      "application/zip",
    );
  }

  function commitRename() {
    if (!activeId) return;
    renameDesk(activeId, renameValue);
    setRenaming(false);
  }

  async function approveGate(id: string) {
    await decide(true, id);
    const st = useOpenCto.getState();
    if (!st.snapshot) return;
    maybeAutoPush(flushDesks(st.desks, st.activeId, st.snapshot, st.step, st.section), st.activeId);
  }

  async function pushNow() {
    const res = await pushDesksToGist(flushDesks(desks, activeId, snapshot, step, section), activeId);
    setGh(loadSession());
    setSyncNote(res.ok ? "Pushed desks + site/plan to GitHub" : res.error);
  }

  async function pullNow() {
    const res = await pullDesksFromGist();
    if (!res.ok) {
      setSyncNote(res.error);
      return;
    }
    importDesks(res.payload.desks, res.payload.activeId);
    setSyncNote(`Pulled ${res.payload.desks.length} desk(s)`);
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
      ? [{ id: "approve", label: "Approve the pending gate", run: () => void approveGate(pending[0].id) }]
      : []),
    { id: "zip", label: "Download the workspace", hint: "ZIP", run: downloadWorkspace },
    ...(gh
      ? [
          { id: "gh-push", label: "Push desks to GitHub", hint: "Gist", run: () => void pushNow() },
          { id: "gh-pull", label: "Pull desks from GitHub", hint: "Gist", run: () => void pullNow() },
        ]
      : [{ id: "gh-settings", label: "Connect GitHub sync", hint: "Settings", run: () => setSection("settings") }]),
    {
      id: "rename",
      label: "Rename this business",
      run: () => {
        setRenameValue(snapshot.business.name);
        setRenaming(true);
      },
    },
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
        <div className="flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <Link to="/" className="shrink-0 text-accent" aria-label="OpenCTO home">
            <span className="font-serif text-lg text-accent">OC</span>
          </Link>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <form
                className="flex min-w-0 items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  commitRename();
                }}
              >
                <input
                  id="desk-rename"
                  value={renameValue}
                  autoFocus
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={commitRename}
                  className="min-h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-2 font-serif text-lg text-fg outline-none sm:text-xl"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRenameValue(snapshot.business.name);
                  setRenaming(true);
                }}
                className="block max-w-full truncate text-left font-serif text-lg leading-none sm:text-xl"
                title="Rename"
              >
                {snapshot.business.name}
              </button>
            )}
            <p className="truncate text-xs text-muted">{snapshot.business.tagline}</p>
          </div>
          {gh ? (
            <button type="button" onClick={() => setSection("settings")} className="hidden truncate rounded-full border border-line px-2 py-1 text-xs text-muted sm:inline">
              @{gh.user.login}
            </button>
          ) : null}
          <button type="button" onClick={() => setCommandsOpen(true)} className="inline-flex size-10 items-center justify-center rounded-full border border-line" aria-label="Commands">
            <Search className="size-4" aria-hidden />
          </button>
          <Link to="/" className="inline-flex size-10 items-center justify-center rounded-full border border-line text-sm sm:min-h-11 sm:w-auto sm:px-3" aria-label="Start another business">
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">New</span>
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setRunStatus(paused ? "resume" : "pause")}
            className="inline-flex size-10 items-center justify-center gap-2 rounded-full border border-line text-sm sm:min-h-11 sm:w-auto sm:px-3"
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </button>
        </div>
        {desks.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2 sm:px-4">
            <select
              id="business-switch"
              value={activeId ?? ""}
              onChange={(event) => switchDesk(event.target.value)}
              className="min-h-10 max-w-full flex-1 rounded-full border border-line bg-bg px-3 text-sm text-fg sm:max-w-xs"
            >
              {desks.map((desk) => (
                <option key={desk.id} value={desk.id}>
                  {desk.snapshot.business.name}
                  {desk.id === activeId ? " · current" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">{desks.length} desks</p>
          </div>
        ) : null}
        <div className="h-1 bg-line" aria-hidden>
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-line px-2 py-1.5 sm:px-3" aria-label="Headquarters">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          const badge =
            item.id === "tasks" && doing > 0 ? doing : item.id === "inbox" && pending.length > 0 ? pending.length : null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm sm:min-h-11 sm:px-3 ${active ? "bg-accent text-ink" : "text-muted"}`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
              {badge !== null ? <span className="tabular-nums text-xs">{badge}</span> : null}
            </button>
          );
        })}
      </nav>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-2 border-b border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">{pending[0].title}</p>
            <p className="text-sm text-muted">{pending[0].detail}</p>
          </div>
          <div className="flex gap-2">
            {rejectFor === pending[0].id ? (
              <form
                className="flex w-full flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void decide(false, pending[0].id, reason);
                  setRejectFor(null);
                  setReason("");
                }}
              >
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why hold it? Optional."
                  className="min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg outline-none sm:w-64"
                />
                <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-3 text-sm">
                  Hold the draft
                </button>
              </form>
            ) : (
              <button type="button" disabled={busy} onClick={() => setRejectFor(pending[0].id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line px-3 text-sm sm:flex-none">
                <X className="size-4" aria-hidden />
                Reject
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => void approveGate(pending[0].id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-medium text-ink sm:flex-none">
              <Check className="size-4" aria-hidden />
              Approve
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="border-b border-line px-4 py-2 text-sm text-accent">{error}</p> : null}
      {syncNote ? (
        <p className="border-b border-line px-4 py-2 text-sm text-muted">
          {syncNote}{" "}
          <button type="button" className="text-fg underline" onClick={() => setSyncNote(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      <LocalTip />

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
        <div className="flex items-center justify-between gap-2 border-t border-line px-2 py-2 text-sm sm:px-3">
          <p className="min-w-0 truncate text-muted">
            {playing ? "Working" : "Paused"} · {step}/{snapshot.log.length}
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setPlaying(!playing)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 sm:min-h-11">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              <span className="hidden sm:inline">{playing ? "Hold" : "Play"}</span>
            </button>
            <button type="button" onClick={finishPlayback} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 sm:min-h-11">
              <FastForward className="size-4" aria-hidden />
              <span className="hidden sm:inline">Skip</span>
            </button>
          </div>
        </div>
      ) : null}
      <CommandPalette open={commandsOpen} onClose={() => setCommandsOpen(false)} commands={commands} />
    </div>
  );
}
