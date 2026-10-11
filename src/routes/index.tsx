import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUp, Shuffle } from "lucide-react";
import { Mark } from "@/components/opencto/mark";
import { MODELS, PROMPTS, TEAMS } from "@/lib/opencto/types";
import { useOpenCto } from "@/lib/opencto/store";

export const Route = createFileRoute("/")({ component: Home });

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

  useEffect(() => {
    void useOpenCto.persist.rehydrate();
    setReady(true);
  }, []);

  async function start(brief: string) {
    const ok = await launch(brief);
    if (ok) void navigate({ to: "/hq" });
  }

  function surprise() {
    const pick = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
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
        <p className="text-xs tracking-widest text-accent uppercase">Free · local · Rust</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-none font-medium tracking-tight sm:text-7xl">
          Staff a team. Keep the source.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          An open-source headquarters for the way a hosted coding CTO works: a lead, a small team, a plan,
          a kanban, and a preview you approve. The orchestrator is a Rust crate running in this browser.
          No account. No API key. A second brief keeps the first business.
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
            placeholder="A booking site for a Lisbon ceramic studio called Barro"
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
                onChange={(event) => setTeam(event.target.value)}
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
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={surprise}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg"
              >
                <Shuffle className="size-4" aria-hidden />
                Surprise me
              </button>
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50"
              >
                <ArrowUp className="size-4" aria-hidden />
                {busy ? "Starting" : "Start the team"}
              </button>
            </div>
          </div>
          {error ? <p className="px-2 pt-3 text-sm text-accent">{error}</p> : null}
        </form>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-medium">Hire a desk</h2>
            <p className="hidden text-sm text-muted sm:block">Same people, every run. No marketplace fee.</p>
          </div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {TEAMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setTeam(item.id)}
                  className={`flex w-full flex-col gap-1 px-1 py-4 text-left sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${team === item.id ? "text-fg" : "text-muted"}`}
                >
                  <span className="font-serif text-2xl text-fg">{item.name}</span>
                  <span className="max-w-xl text-sm leading-relaxed">{item.detail}</span>
                  <span className="text-xs tracking-wide text-accent uppercase">{item.roles}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 grid gap-8 sm:grid-cols-3">
          <article>
            <h2 className="font-serif text-2xl">On this machine</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The planner compiles to WebAssembly. A run writes files, a plan, and a preview without calling a model vendor.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl">A gate, not a deploy</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The team stops before publish or merge. Approving marks the draft done here. Nothing is pushed.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl">Yours to host</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              MIT licensed. The same engine is a CLI. Profiles are named for open models you can attach when you self-host.
            </p>
          </article>
        </section>

        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium">What it keeps from the hosted product</h2>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {[
              ["Lead chat", "The person you talk to. They hire, file work, and hold the gate."],
              ["Employees", "Named roles with a model profile and a focus. Fire anyone but the lead."],
              ["Tasks", "A kanban that moves while the run plays out."],
              ["Site preview", "A real HTML draft, not a screenshot."],
              ["Plan", "What was heard, the offer, the stack, the risks."],
              ["Approvals", "Publish and merge wait until you say so."],
            ].map(([term, detail]) => (
              <div key={term} className="bg-bg p-4">
                <dt className="font-medium text-fg">{term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">
            OpenCTO is an independent reimplementation of that public workflow. It is not affiliated with cto.new or Engine Labs.
          </p>
        </section>
      </main>
    </div>
  );
}
