import { i as __toESM } from "../_runtime.mjs";
import { J as require_jsx_runtime, b as useNavigate, q as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Mark } from "./mark-Bt-R4fDU.mjs";
import { n as PROMPTS, o as useOpenCto, r as TEAMS, t as MODELS } from "./types-BumhLaSY.mjs";
import { h as ArrowUp, i as Shuffle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bd13217I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		useOpenCto.persist.rehydrate();
		setReady(true);
	}, []);
	async function start(brief) {
		if (await launch(brief)) navigate({ to: "/hq" });
	}
	function surprise() {
		const pick = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
		setTeam(pick.team);
		setModel(pick.model);
		setDraft(pick.brief);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex items-center gap-2 text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-6 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-serif text-xl tracking-tight",
					children: "OpenCTO"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/guide",
					className: "rounded-full px-3 py-2 text-muted hover:text-fg",
					children: "Guide"
				}), ready && hasDesk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/hq",
					className: "rounded-full bg-accent px-3 py-2 font-medium text-ink",
					children: "Headquarters"
				}) : null]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-accent uppercase",
					children: "Free · local · Rust"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 max-w-3xl font-serif text-5xl leading-none font-medium tracking-tight sm:text-7xl",
					children: "Staff a team. Keep the source."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg",
					children: "An open-source headquarters for the way a hosted coding CTO works: a lead, a small team, a plan, a kanban, and a preview you approve. The orchestrator is a Rust crate running in this browser. No account. No API key."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-8 rounded-lg border border-line bg-surface p-3 sm:p-4",
					onSubmit: (event) => {
						event.preventDefault();
						start(draft);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "brief",
							className: "sr-only",
							children: "What should the team do?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							id: "brief",
							rows: 4,
							value: draft,
							onChange: (event) => setDraft(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
									event.preventDefault();
									start(draft);
								}
							},
							placeholder: "A booking site for a Lisbon ceramic studio called Barro",
							className: "w-full resize-none bg-transparent px-2 py-2 text-base text-fg outline-none placeholder:text-muted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "team",
										children: "Team"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "team",
										value: team,
										onChange: (event) => setTeam(event.target.value),
										className: "min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg",
										children: TEAMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: item.id,
											children: item.name
										}, item.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "sr-only",
										htmlFor: "model",
										children: "Model profile"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "model",
										value: model,
										onChange: (event) => setModel(event.target.value),
										className: "min-h-11 rounded-full border border-line bg-bg px-3 text-sm text-fg",
										children: MODELS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: item.id,
											children: item.name
										}, item.id))
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: surprise,
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, {
										className: "size-4",
										"aria-hidden": true
									}), "Surprise me"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: busy || draft.trim().length === 0,
									className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
										className: "size-4",
										"aria-hidden": true
									}), busy ? "Starting" : "Start the team"]
								})]
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2 pt-3 text-sm text-accent",
							children: error
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-14",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-3xl font-medium",
							children: "Hire a desk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden text-sm text-muted sm:block",
							children: "Same people, every run. No marketplace fee."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-line border-y border-line",
						children: TEAMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTeam(item.id),
							className: `flex w-full flex-col gap-1 px-1 py-4 text-left sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${team === item.id ? "text-fg" : "text-muted"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-serif text-2xl text-fg",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "max-w-xl text-sm leading-relaxed",
									children: item.detail
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs tracking-wide text-accent uppercase",
									children: item.roles
								})
							]
						}) }, item.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-14 grid gap-8 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-2xl",
							children: "On this machine"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "The planner compiles to WebAssembly. A run writes files, a plan, and a preview without calling a model vendor."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-2xl",
							children: "A gate, not a deploy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "The team stops before publish or merge. Approving marks the draft done here. Nothing is pushed."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-2xl",
							children: "Yours to host"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "MIT licensed. The same engine is a CLI. Profiles are named for open models you can attach when you self-host."
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-14",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-3xl font-medium",
							children: "What it keeps from the hosted product"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2",
							children: [
								["Lead chat", "The person you talk to. They hire, file work, and hold the gate."],
								["Employees", "Named roles with a model profile and a focus. Fire anyone but the lead."],
								["Tasks", "A kanban that moves while the run plays out."],
								["Site preview", "A real HTML draft, not a screenshot."],
								["Plan", "What was heard, the offer, the stack, the risks."],
								["Approvals", "Publish and merge wait until you say so."]
							].map(([term, detail]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-bg p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "font-medium text-fg",
									children: term
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "mt-1 text-sm leading-relaxed text-muted",
									children: detail
								})]
							}, term))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-muted",
							children: "OpenCTO is an independent reimplementation of that public workflow. It is not affiliated with cto.new or Engine Labs."
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { Home as component };
