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
        <h1 className="mt-3 font-serif text-5xl font-medium tracking-tight">Run it yourself</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          OpenCTO is an independent, MIT-licensed reimplementation of the public cto.new workflow: a lead,
          a hired team, tasks, a plan, a preview, and an approval before anything is called published. It is
          not affiliated with cto.new or Engine Labs. The desk you are using runs the Rust engine as
          WebAssembly. The same crate is a command-line tool with no account and no network.
        </p>

        <h2 className="mt-10 font-serif text-3xl">What a run does</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Reads the brief and picks a kind of work: site, product change, bugfix, marketing, or research.</li>
          <li>Staffs a fixed desk. Names do not change between runs.</li>
          <li>Writes a plan, tasks, and files, then plays the work log so you can watch the kanban move.</li>
          <li>Stops at an approval. Agreeing marks the draft published on this machine. Nothing is pushed.</li>
        </ol>

        <h2 className="mt-10 font-serif text-3xl">Model profiles</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Local, alloy, Qwen, Devstral, DeepSeek, and Kimi are planning styles inside the crate. They do not
          call those labs. Alloy means two passes in one thread: a structured draft, then a looser rewrite,
          merged. When you self-host, point those profiles at open weights yourself — Ollama, llama.cpp, or
          any server that speaks an OpenAI-compatible API. The browser build never needs a key.
        </p>

        <h2 className="mt-10 font-serif text-3xl">The CLI</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          From a checkout of this project, the engine lives in <code className="text-fg">engine/</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg">{`cargo run --manifest-path engine/Cargo.toml -- catalog
cargo run --manifest-path engine/Cargo.toml -- run <<'JSON'
{"op":"launch","brief":"A booking site for a Lisbon ceramic studio called Barro","team":"website","model":"alloy"}
JSON`}</pre>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Operations: catalog, launch, chat, approve, reject, pause, resume, hire, fire. Chat, approve, and
          the rest take the previous snapshot back as <code className="text-fg">state</code>.
        </p>

        <h2 className="mt-10 font-serif text-3xl">Rebuild the browser engine</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg">{`rustup target add wasm32-unknown-unknown
cargo build --manifest-path engine/Cargo.toml --target wasm32-unknown-unknown --release --lib
cp engine/target/wasm32-unknown-unknown/release/opencto.wasm public/engine/opencto.wasm`}</pre>

        <h2 className="mt-10 font-serif text-3xl">What this is not</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          It will not open pull requests, send email, browse the web, or spend a model budget. Those are the
          hosted product’s job. OpenCTO is the part you can read, fork, and run for nothing: the desk, the
          gates, and a planner honest about being local.
        </p>
      </article>
    </div>
  );
}
