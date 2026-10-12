import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUp, Shuffle } from "lucide-react";
import { InstallPrompt } from "@/components/opencto/install-prompt";
import { Mark } from "@/components/opencto/mark";
import { MODELS, PROMPTS, TEAMS } from "@/lib/opencto/types";
import { useOpenCto } from "@/lib/opencto/store";

export const Route = createFileRoute("/")({ component: Home });

/** Pick a desk type from the brief so sticky Marketing does not swallow a website ask. */
function suggestTeam(brief: string): string {
  const b = brief.toLowerCase();
  if (/\b(bug|fix|flaky|timeout|regression|broken)\b/.test(b)) return "bugfix";
  if (/\b(content calendar|campaign|caption|instagram|tiktok)\b/.test(b)) return "marketing";
  if (/\b(should we|research memo|decision memo)\b/.test(b)) return "research";
  if (/\b(site|website|landing|homepage|dashboard|tracker|tracking|weather|app)\b/.test(b)) return "website";
  if (/\b(api|rust|module|export|billing|ledger)\b/.test(b)) return "engineering";
  return "website";
}

function Home() {
  const navigate = useNavigate();
  const draft = useOpenCto((s) => s.draft);
  const setDraft = useOpenCto((s) => s.setDraft);
  const model = useOpenCto((s) => s.model);
  const setModel = useOpenCto((s) => s.setModel);
  const team = useOpenCto((s) => s.team);
  const setTeam = useOpenCto((s) => s.setTeam);
  const launch = useOpenCto((s) => s.launch);
  const busy = useOpenCto((s) => s.busy);
  const error = useOpenCto((s) => s.error);
  const hasDesk = useOpenCto((s) => Boolean(s.snapshot));
  const [ready, setReady] = useState(false);
  const [teamLocked, setTeamLocked] = useState(false);

  useEffect(() => {
    void useOpenCto.persist.rehydrate();
    setReady(true);
  }, []);

  // When the brief clearly names a kind of work, switch the desk unless the user picked one.
  useEffect(() => {
    if (teamLocked) return;
    const next = suggestTeam(draft);
    if (next !== team) setTeam(next);
  }, [draft, team, teamLocked, setTeam]);

  async function start(brief: string) {
    const ok = await launch(brief);
    if (ok) void navigate({ to: "/hq" });
  }

  function surprise() {
    const pick = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setTeamLocked(true);
    setTeam(pick.team);
    setModel(pick.model);
    setDraft(pick.brief);
  }

  function usePrompt(pick: (typeof PROMPTS)[number]) {
    setTeamLocked(true);
    setTeam(pick.team);
    setModel(pick.model);
    setDraft(pick.brief);
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-fg">
          <Mark className="size-6 text-accent" />
          <span className="font-serif text-xl tracking-tight">OpenCTO</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/guide" className="rounded-full px-3 py-2 text-muted hover:text-fg">
            Guide
          </Link>
          {ready && hasDesk ? (
            <Link to="/hq" className="rounded-full bg-accent px-3 py-2 font-medium text-ink">
              Headquarters
            </Link>
          ) : null}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <p className="text-xs tracking-widest text-accent uppercase">Free · local · no account</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-none font-medium tracking-tight sm:text-7xl">
          Staff a team. Keep the source.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Open a desk in this browser. A Rust planner runs as WebAssembly — lead, team, plan, tasks, and a
          preview you approve. Write what you want; the desk type follows the brief (you can still override it).
          No signup. No API key. Work stays on this device until you download a zip or sync a private gist.
        </p>

        <form
          className="mt-8 rounded-lg border border-line bg-surface p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void start(draft);
          }}
        >
          <label htmlFor="brief" className="sr-only">
            What should the team do?
          </label>
          <textarea
            id="brief"
            rows={4}
            value={draft}
            suppressHydrationWarning
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void start(draft);
              }
            }}
            placeholder="A weather tracking website called Clear Horizon"
            className="w-full resize-none bg-transparent px-2 py-2 text-base text-fg outline-none placeholder:text-muted"
          />
          <div className="mt-2 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="team">
                Team
              </label>
              <select
                id="team"
                value={team}
                onChange={(event) => {
                  setTeamLocked(true);
                  setTeam(event.target.value);
                }}
                className="min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg"
              >
                {TEAMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="model">
                Model profile
              </label>
              <select
                id="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg"
              >
                {MODELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={surprise}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm text-muted"
              >
                <Shuffle className="size-4" aria-hidden />
                Surprise
              </button>
            </div>
            <button
              type="submit"
              disabled={busy || draft.trim().length < 3}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50"
            >
              Start the team
              <ArrowUp className="size-4" aria-hidden />
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
        </form>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">Try a brief</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {PROMPTS.map((pick) => (
              <li key={pick.brief}>
                <button
                  type="button"
                  onClick={() => usePrompt(pick)}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm leading-relaxed hover:border-accent"
                >
                  <span className="block text-xs tracking-wide text-muted uppercase">{pick.team} · {pick.model}</span>
                  <span className="mt-1 block text-fg">{pick.brief}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <InstallPrompt />
      </main>
    </div>
  );
}
