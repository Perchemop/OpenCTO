import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
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

export function SettingsView({ snapshot }: { snapshot: Snapshot }) {
  const patchSettings = useOpenCto((s) => s.patchSettings);
  const toggleMcp = useOpenCto((s) => s.toggleMcp);
  const reset = useOpenCto((s) => s.reset);
  const settings = snapshot.settings;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <h2 className="font-serif text-3xl">Settings</h2>
      <p className="rounded-lg border border-line bg-surface px-3 py-3 text-sm leading-relaxed text-muted">
        Local only. Labels below are notes for this desk — they are not connected to a remote service from this
        browser.
      </p>
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
        OpenCTO is local-first: no account and no API keys. Secrets are not collected here. When you self-host the
        CLI, put credentials in that machine's environment — not in this browser desk.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Businesses on this device are stored in browser storage. Clear this desk removes only the active business;
        clearing site data for this origin removes all of them.
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
