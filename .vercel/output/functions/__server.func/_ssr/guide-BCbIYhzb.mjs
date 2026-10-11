import { J as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Mark } from "./mark-Bt-R4fDU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guide-BCbIYhzb.js
var import_jsx_runtime = require_jsx_runtime();
function Guide() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-6 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-serif text-xl",
					children: "OpenCTO"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hq",
				className: "text-sm text-muted",
				children: "Headquarters"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "mx-auto w-full max-w-3xl px-4 pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-accent uppercase",
					children: "Guide"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-serif text-5xl font-medium tracking-tight",
					children: "Run it yourself"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-base leading-relaxed text-muted",
					children: "OpenCTO is an independent, MIT-licensed reimplementation of the public cto.new workflow: a lead, a hired team, tasks, a plan, a preview, and an approval before anything is called published. It is not affiliated with cto.new or Engine Labs. The desk you are using runs the Rust engine as WebAssembly. The same crate is a command-line tool with no account and no network."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "Several businesses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: "Starting another brief keeps the previous desk. Switch from the menu under the name, or from the search button in the header. Clearing a desk in settings removes only that one. Downloads are a zip of the files written so far — still on your machine, still not a pull request."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "What a run does"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Reads the brief and picks a kind of work: site, product change, bugfix, marketing, or research." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Staffs a fixed desk. Names do not change between runs." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Writes a plan, tasks, and files, then plays the work log so you can watch the kanban move." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Stops at an approval. Agreeing marks the draft published on this machine. Nothing is pushed." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "Model profiles"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: "Local, alloy, Qwen, Devstral, DeepSeek, and Kimi are planning styles inside the crate. They do not call those labs. Alloy means two passes in one thread: a structured draft, then a looser rewrite, merged. When you self-host, point those profiles at open weights yourself — Ollama, llama.cpp, or any server that speaks an OpenAI-compatible API. The browser build never needs a key."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "The CLI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: [
						"From a checkout of this project, the engine lives in ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-fg",
							children: "engine/"
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg",
					children: `cargo run --manifest-path engine/Cargo.toml -- catalog
cargo run --manifest-path engine/Cargo.toml -- run <<'JSON'
{"op":"launch","brief":"A booking site for a Lisbon ceramic studio called Barro","team":"website","model":"alloy"}
JSON`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: [
						"Operations: catalog, launch, chat, approve, reject, pause, resume, hire, fire. Chat, approve, and the rest take the previous snapshot back as ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-fg",
							children: "state"
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "Rebuild the browser engine"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg",
					children: `rustup target add wasm32-unknown-unknown
cargo build --manifest-path engine/Cargo.toml --target wasm32-unknown-unknown --release --lib
cp engine/target/wasm32-unknown-unknown/release/opencto.wasm public/engine/opencto.wasm`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-serif text-3xl",
					children: "What this is not"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: "It will not open pull requests, send email, browse the web, or spend a model budget. Those are the hosted product’s job. OpenCTO is the part you can read, fork, and run for nothing: the desk, the gates, and a planner honest about being local."
				})
			]
		})]
	});
}
//#endregion
export { Guide as component };
