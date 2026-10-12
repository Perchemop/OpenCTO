import { createFileRoute, Link } from "@tanstack/react-router";
import { Mark } from "@/components/opencto/mark";

export const Route = createFileRoute("/guide")({ component: Guide });

function Guide() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Mark className="size-6 text-accent" />
          <span className="font-serif text-xl">OpenCTO</span>
        </Link>
        <Link to="/hq" className="text-sm text-muted">
          Headquarters
        </Link>
      </header>
      <article className="mx-auto w-full max-w-3xl px-4 pb-16">
        <p className="text-xs tracking-widest text-accent uppercase">Guide</p>
        <h1 className="mt-3 font-serif text-5xl font-medium tracking-tight">Open and use</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          OpenCTO is an independent, MIT-licensed reimplementation of the public cto.new workflow: a lead,
          a hired team, tasks, a plan, a preview, and an approval before anything is called published. It is
          not affiliated with cto.new or Engine Labs.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted">
          The desk runs a Rust engine as WebAssembly in this browser. By default there is no account and no API
          key — businesses live in local storage. Optionally connect GitHub to back up desks to a private gist.
        </p>

        <h2 className="mt-10 font-serif text-3xl">How to start</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Open the home page and type what you want built — or tap Surprise me.</li>
          <li>Pick a desk type and a planning profile (styles only; the planner does not call model vendors).</li>
          <li>Start the team. Watch the plan, tasks, and site preview fill in.</li>
          <li>Chat with the lead, hire or fire, approve or reject when the gate appears.</li>
          <li>Download the workspace zip from Headquarters if you want the files offline.</li>
        </ol>

        <h2 className="mt-10 font-serif text-3xl">On your phone</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Open{" "}
          <a
            className="text-fg underline decoration-line underline-offset-2"
            href="https://perchemop.github.io/OpenCTO/"
          >
            perchemop.github.io/OpenCTO
          </a>{" "}
          in Safari or Chrome. Use <strong className="font-medium text-fg">Add to Home Screen</strong> so the desk
          opens full-screen like an app.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
          <li>iPhone / iPad: Share → Add to Home Screen</li>
          <li>Android Chrome: Menu → Install app or Add to Home screen</li>
        </ul>

        <h2 className="mt-10 font-serif text-3xl">GitHub sync (optional)</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          In Headquarters → Settings you can connect GitHub with{