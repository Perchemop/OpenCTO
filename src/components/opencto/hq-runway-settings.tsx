import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  clearSession,
  getAutoPush,
  getClientId,
  getPullOnOpen,
  loadSession,
  pollDeviceToken,
  pullDesksFromGist,
  pushDesksToGist,
  setAutoPush,
  setClientId,
  setPullOnOpen,
  startDeviceFlow,
  type GitHubSession,
} from "@/lib/opencto/github";
import { useOpenCto } from "@/lib/opencto/store";
import { type Snapshot } from "@/lib/opencto/types";

export function Runway({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const events = snapshot.log.filter((event) => event.step <= step);
  if (events.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-4 py-10 text-center">
        <div>
          <Activity className="mx-auto size-8 text-muted" aria-hidden />
          <h2 className="mt-3 font-serif text-3xl">Runway is empty</h2>
          <p className="mt-2 text-sm text-muted">
            Play the work log from the footer. Each step appears here as the team moves.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-end justify-between gap-3">
        <h2 className="font-serif text-2xl">Runway</h2>
        <p className="text-xs text-muted">
          {events.length} of {snapshot.log.length} steps
        </p>
      </div>
      <ol className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={`${event.step}-${event.kind}-${event.actor}`} className="border-b border-line pb-3">
            <p className="text-xs tracking-wide text-accent uppercase">
              Step {event.step} · {event.actor} · {event.kind}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{event.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GitHubSync() {
  const desks = useOpenCto((s) => s.desks);
  const activeId = useOpenCto((s) => s.activeId);
  const snapshot = useOpenCto((s) => s.snapshot);
  const step = useOpenCto((s) => s.step);
  const section = useOpenCto((s) => s.section);
  const importDesks = useOpenCto((s) => s.importDesks);
  const [session, setSession] = useState<GitHubSession | null>(() => loadSession());
  const [clientId, setClientIdInput] = useState(() => getClientId());
  const [autoPush, setAutoPushState] = useState(() => getAutoPush());
  const [pullOnOpen, setPullOnOpenState] = useState(() => getPullOnOpen());
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState("https://github.com/login/device");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  function currentDesks() {
    let list = desks.slice();
    if (snapshot && activeId) {
      const idx = list.findIndex((d) => d.id === activeId);
      const record = { id: activeId, snapshot, step, section };
      if (idx < 0) list = [...list, record];
      else list = list.map((d, i) => (i === idx ? record : d));
    }
    return list;
  }

  async function connect() {
    setError(null);
    setStatus(null);
    setClientId(clientId);
    setBusy(true);
    const started = await startDeviceFlow(clientId.trim());
    if (!started.ok) {
      setError(started.error);
      setBusy(false);
      return;
    }
    setUserCode(started.start.user_code);
    setVerifyUrl(started.start.verification_uri || "https://github.com/login/device");
    setStatus("Open GitHub and enter the code…");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const result = await pollDeviceToken(
      started.start.device_code,
      started.start.interval || 5,
      clientId.trim(),
      ac.signal,
    );
    setBusy(false);
    setUserCode(null);
    if (!result.ok) {
      setError(result.error);
      setStatus(null);
      return;
    }
    setSession(result.session);
    setStatus(`Connected as @${result.session.user.login}`);
  }

  function disconnect() {
    abortRef.current?.abort();
    clearSession();
    setSession(null);
    setStatus("Disconnected");
    setError(null);
    setUserCode(null);
  }

  async function push() {
    setBusy(true);
    setError(null);
    const res = await pushDesksToGist(currentDesks(), activeId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSession(loadSession());
    setStatus(
      res.htmlUrl
        ? "Pushed desks + site/plan files to private gist"
        : "Pushed",
    );
  }

  async function pull() {
    setBusy(true);
    setError(null);
    const res = await pullDesksFromGist();
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    importDesks(res.payload.desks, res.payload.activeId);
    setStatus(`Pulled ${res.payload.desks.length} desk(s) from GitHub`);
  }

  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <h3 className="font-medium">GitHub sync</h3>
      <p className="text-sm leading-relaxed text-muted">
        Optional. Connect with GitHub Device Flow (no password pasted here). Desks back up to a{" "}
        <span className="text-fg">private gist</span> on your account (JSON + site HTML + plan markdown for the
        active desk). Local storage still works offline.
      </p>

      {!session ? (
        <>
          <label className="block text-sm">
            OAuth App Client ID
            <input
              value={clientId}
              onChange={(event) => setClientIdInput(event.target.value)}
              placeholder="Ov23… (public Client ID only)"
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          <p className="text-xs leading-relaxed text-muted">
            Create a GitHub OAuth App → enable <span className="text-fg">Device Flow</span> → copy the Client ID.
            Callback URL can be <code className="text-fg">http://localhost</code>. No client secret is used.
          </p>
          <button
            type="button"
            disabled={busy || clientId.trim().length < 8}
            onClick={() => void connect()}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50"
          >
            {busy ? "Waiting for GitHub…" : "Connect GitHub"}
          </button>
          {userCode ? (
            <p className="rounded-lg border border-line bg-bg px-3 py-3 text-sm">
              Enter code{" "}
              <span className="font-mono text-lg tracking-widest text-accent">{userCode}</span> at{" "}
              <a className="text-fg underline" href={verifyUrl} target="_blank" rel="noreferrer">
                {verifyUrl.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm">
            Signed in as{" "}
            <span className="font-medium text-fg">@{session.user.login}</span>
            {session.gistId ? (
              <span className="text-muted"> · gist linked</span>
            ) : (
              <span className="text-muted"> · no gist yet</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void push()}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50"
            >
              Push desks
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void pull()}
              className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm disabled:opacity-50"
            >
              Pull desks
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={disconnect}
              className="inline-flex min-h-11 items-center text-sm text-muted"
            >
              Disconnect
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={autoPush}
              onClick={() => {
                const next = !autoPush;
                setAutoPush(next);
                setAutoPushState(next);
              }}
              className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${autoPush ? "bg-accent text-ink" : "border border-line text-muted"}`}
            >
              Auto-push after approve: {autoPush ? "On" : "Off"}
            </button>
            <button
              type="button"
              aria-pressed={pullOnOpen}
              onClick={() => {
                const next = !pullOnOpen;
                setPullOnOpen(next);
                setPullOnOpenState(next);
              }}
              className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${pullOnOpen ? "bg-accent text-ink" : "border border-line text-muted"}`}
            >
              Pull when opening HQ: {pullOnOpen ? "On" : "Off"}
            </button>
          </div>
        </>
      )}

      {status ? <p className="text-sm text-fg">{status}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </section>
  );
}

export function SettingsView({ snapshot }: { snapshot: Snapshot }) {
  const patchSettings = useOpenCto((s) => s.patchSettings);
  const toggleMcp = useOpenCto((s) => s.toggleMcp);
  const reset = useOpenCto((s) => s.reset);
  const settings = snapshot.settings;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <h2 className="font-serif text-3xl">Settings</h2>
      <p className="rounded-lg border border-line bg-surface px-3 py-3 text-sm leading-relaxed text-muted">
        Local-first by default. GitHub sync is optional and uses a private gist on your account — never required to
        run a desk.
      </p>

      <GitHubSync />

      <label className="block text-sm">
        Repo label
        <input
          value={settings.repo}
          onChange={(event) => patchSettings({ repo: event.target.value })}
          placeholder="optional note"
          className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
        />
      </label>
      <label className="block text-sm">
        Webhook
        <input
          value={settings.webhook}
          onChange={(event) => patchSettings({ webhook: event.target.value })}
          placeholder="not called from this browser"
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
        Secrets are not collected for the planner. The GitHub token from Device Flow stays in this browser only and is
        limited to the <code className="text-fg">gist</code> scope.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/guide" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm">
          Guide
        </Link>
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center text-sm text-muted">
          Clear this desk
        </button>
      </div>
    </div>
  );
}
