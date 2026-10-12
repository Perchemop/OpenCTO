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
          OpenCTO is an independent, MIT-licensed reimplementation of the public cto.new workflow: a lead, a hired
          team, tasks, a plan, a preview, and an approval before anything is called published. It is not affiliated
          with cto.new or Engine Labs.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted">
          The desk runs a Rust engine as WebAssembly in this browser. By default there is no account and no model API
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
          In Headquarters → Settings you can connect GitHub with Device Flow. You only need a public OAuth App Client
          ID (enable Device Flow on the app). No client secret and no personal access token paste.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>GitHub → Settings → Developer settings → OAuth Apps → New. Enable Device Flow.</li>
          <li>Paste the Client ID into OpenCTO Settings and tap Connect GitHub.</li>
          <li>Enter the one-time code on github.com/login/device.</li>
          <li>Push desks / Pull desks to sync a private gist named opencto-desks.json.</li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The token stays in this browser with the gist scope only. The planner still never needs model API keys.
        </p>

        <h2 className="mt-10 font-serif text-3xl">Several businesses</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Starting another brief keeps the previous desk. Switch from the menu under the name, or from the search
          button in the header. Tap the name to rename. Clearing a desk in settings removes only that one.
        </p>

        <h2 className="mt-10 font-serif text-3xl">What a run does</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Reads the brief and picks a kind of work: site, product change, bugfix, marketing, or research.</li>
          <li>Staffs a fixed desk. Names do not change between runs.</li>
          <li>Writes a plan, tasks, and files, then plays the work log so you can watch the kanban move.</li>
          <li>Stops at an approval. Agreeing marks the draft published on this machine. Nothing is pushed to git by the planner.</li>
        </ol>

        <h2 className="mt-10 font-serif text-3xl">Model profiles</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Local, alloy, Qwen, Devstral, DeepSeek, and Kimi are planning styles inside the crate. They do not call those
          labs. Alloy means two passes in one thread. When you self-host the CLI, you can point those profiles at open
          weights yourself.
        </p>

        <h2 className="mt-10 font-serif text-3xl">The CLI</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          From a checkout of this project, the engine lives in <code className="text-fg">engine/</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg">{`cargo run --manifest-path engine/Cargo.toml -- catalog
cargo run --manifest-path engine/Cargo.toml -- run <<'JSON'
{"op":"launch","brief":"A booking site for a Lisbon ceramic studio called Barro","team":"website","model":"alloy"}
JSON`}</pre>

        <h2 className="mt-10 font-serif text-3xl">What this is not</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          It will not open pull requests, send email, browse the web, or spend a model budget. Those are the hosted
          product’s job. OpenCTO is the desk, the gates, a local planner, and an optional private gist backup.
        </p>
      </article>
    </div>
  );
}
