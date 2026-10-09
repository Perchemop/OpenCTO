import { i as __toESM } from "../_runtime.mjs";
import { J as require_jsx_runtime, q as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Mark } from "./mark-Bt-R4fDU.mjs";
import { a as ownerName, i as columnAt, o as useOpenCto, r as TEAMS } from "./types-BumhLaSY.mjs";
import { _ as Activity, a as Settings, c as Pause, d as FolderOpen, f as FastForward, g as AppWindow, h as ArrowUp, l as MessageSquare, m as Check, n as Users, o as ScrollText, p as Columns3, s as Play, t as X, u as Inbox } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hq-D4wkROgV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		id: "lead",
		label: "Lead",
		icon: MessageSquare
	},
	{
		id: "team",
		label: "Team",
		icon: Users
	},
	{
		id: "site",
		label: "Site",
		icon: AppWindow
	},
	{
		id: "plan",
		label: "Plan",
		icon: ScrollText
	},
	{
		id: "tasks",
		label: "Tasks",
		icon: Columns3
	},
	{
		id: "files",
		label: "Files",
		icon: FolderOpen
	},
	{
		id: "inbox",
		label: "Inbox",
		icon: Inbox
	},
	{
		id: "runway",
		label: "Runway",
		icon: Activity
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings
	}
];
function Headquarters() {
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const snapshot = useOpenCto((s) => s.snapshot);
	usePlayback();
	(0, import_react.useEffect)(() => {
		useOpenCto.persist.rehydrate();
		setHydrated(true);
	}, []);
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Opening the desk…" })
	});
	if (!snapshot) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 bg-bg px-6 text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-8 text-accent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl font-medium",
				children: "No business on the desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "Start a team from the front door. The run stays in this browser."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "inline-flex min-h-11 w-fit items-center rounded-full bg-accent px-4 text-sm font-medium text-ink",
				children: "Start a team"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { snapshot });
}
function usePlayback() {
	const playing = useOpenCto((s) => s.playing);
	const step = useOpenCto((s) => s.step);
	const len = useOpenCto((s) => s.snapshot?.log.length ?? 0);
	const advance = useOpenCto((s) => s.advance);
	const finishPlayback = useOpenCto((s) => s.finishPlayback);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || step >= len) {
			finishPlayback();
			return;
		}
		const timer = window.setTimeout(advance, 680);
		return () => window.clearTimeout(timer);
	}, [
		playing,
		step,
		len,
		advance,
		finishPlayback
	]);
}
function Desk({ snapshot }) {
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
	const paused = snapshot.business.status === "paused";
	const pending = snapshot.approvals.filter((item) => item.status === "pending" && item.reveal_step <= step);
	const progress = snapshot.log.length === 0 ? 100 : Math.round(step / snapshot.log.length * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-3 py-3 sm:px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "text-accent",
							"aria-label": "OpenCTO home",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-serif text-xl leading-none",
								children: snapshot.business.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs text-muted",
								children: snapshot.business.tagline
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden rounded-full border border-line px-3 py-1 text-xs text-muted sm:inline",
							children: snapshot.business.model
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy,
							onClick: () => void setRunStatus(paused ? "resume" : "pause"),
							className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm",
							children: [paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": true
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								className: "size-4",
								"aria-hidden": true
							}), paused ? "Resume" : "Pause"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 bg-line",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-accent transition-all",
						style: { width: `${progress}%` }
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex gap-2 overflow-x-auto border-b border-line px-3 py-2",
				"aria-label": "Headquarters",
				children: NAV.map((item) => {
					const Icon = item.icon;
					const active = section === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSection(item.id),
						className: `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm ${active ? "bg-accent text-ink" : "text-muted"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-4",
							"aria-hidden": true
						}), item.label]
					}, item.id);
				})
			}),
			pending.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 border-b border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: pending[0].title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: pending[0].detail
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void decide(false, pending[0].id),
						className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "size-4",
							"aria-hidden": true
						}), "Reject"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void decide(true, pending[0].id),
						className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-3 text-sm font-medium text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "size-4",
							"aria-hidden": true
						}), "Approve"]
					})]
				})]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "border-b border-line px-4 py-2 text-sm text-accent",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: [
					section === "lead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lead, {
						snapshot,
						step
					}) : null,
					section === "team" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Team, {
						snapshot,
						step
					}) : null,
					section === "site" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Site, {
						snapshot,
						step
					}) : null,
					section === "plan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plan, { snapshot }) : null,
					section === "tasks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tasks, {
						snapshot,
						step
					}) : null,
					section === "files" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, {
						snapshot,
						step
					}) : null,
					section === "inbox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxView, {
						snapshot,
						step
					}) : null,
					section === "runway" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Runway, {
						snapshot,
						step
					}) : null,
					section === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, { snapshot }) : null
				]
			}),
			step < snapshot.log.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 border-t border-line px-3 py-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate text-muted",
					children: [
						playing ? "The team is working" : "Playback is paused",
						" · ",
						step,
						"/",
						snapshot.log.length
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setPlaying(!playing),
						className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3",
						children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
							className: "size-4",
							"aria-hidden": true
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							className: "size-4",
							"aria-hidden": true
						}), playing ? "Hold" : "Play"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: finishPlayback,
						className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FastForward, {
							className: "size-4",
							"aria-hidden": true
						}), "Skip"]
					})]
				})]
			}) : null
		]
	});
}
function Lead({ snapshot, step }) {
	const send = useOpenCto((s) => s.send);
	const busy = useOpenCto((s) => s.busy);
	const [text, setText] = (0, import_react.useState)("");
	const messages = snapshot.messages.filter((message) => message.at_step <= step);
	const events = snapshot.log.filter((event) => event.step <= step);
	const latest = events[events.length - 1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid w-full max-w-5xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex min-w-0 flex-col gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-3",
				children: messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: `max-w-prose rounded-lg px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-accent text-ink" : "mr-auto border border-line bg-surface text-fg"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1 text-xs tracking-wide uppercase opacity-70",
						children: message.from
					}), message.body]
				}, message.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "sticky bottom-0 flex items-end gap-2 rounded-lg border border-line bg-surface p-2",
				onSubmit: (event) => {
					event.preventDefault();
					const next = text;
					setText("");
					send(next);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "lead-message",
						className: "sr-only",
						children: "Message the lead"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "lead-message",
						rows: 2,
						value: text,
						onChange: (event) => setText(event.target.value),
						placeholder: "Add a pricing section, hire a writer, or pause.",
						className: "min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-muted"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: busy || text.trim().length === 0,
						className: "inline-flex size-11 items-center justify-center rounded-full bg-accent text-ink disabled:opacity-40",
						"aria-label": "Send",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
							className: "size-4",
							"aria-hidden": true
						})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "min-w-0 rounded-lg border border-line bg-surface p-4",
			"aria-live": "polite",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-accent uppercase",
					children: "Floor"
				}),
				latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-medium",
						children: latest.actor
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted uppercase",
						children: latest.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed",
						children: latest.text
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Waiting for the first note."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 max-h-80 space-y-2 overflow-y-auto text-xs text-muted",
					children: events.slice(-8).map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: event.actor
						}),
						" · ",
						event.text
					] }, event.step))
				})
			]
		})]
	});
}
function Team({ snapshot, step }) {
	const hire = useOpenCto((s) => s.hire);
	const fire = useOpenCto((s) => s.fire);
	const busy = useOpenCto((s) => s.busy);
	const working = new Set(snapshot.tasks.filter((task) => columnAt(task, step) === "doing").map((task) => task.owner));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-5xl px-3 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3 sm:grid-cols-2",
				children: snapshot.team.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-serif text-2xl",
								children: person.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [person.role, person.lead ? " · lead" : ""]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-line px-2 py-1 text-xs text-muted",
								children: working.has(person.id) ? "Working" : "Idle"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed",
							children: person.focus
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs tracking-wide text-accent uppercase",
							children: person.model
						}),
						person.lead ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy,
							onClick: () => void fire(person.id),
							className: "mt-4 min-h-11 text-sm text-muted underline-offset-2 hover:underline",
							children: "Remove from team"
						})
					]
				}, person.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-serif text-2xl",
				children: "Hire another desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line border-y border-line",
				children: TEAMS.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: team.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: team.detail
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						onClick: () => void hire(team.id),
						className: "inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm",
						children: "Hire"
					})]
				}, team.id))
			})
		]
	});
}
function Site({ snapshot, step }) {
	const ready = snapshot.log.length === 0 || step >= Math.max(1, snapshot.log.length - 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-96 flex-col px-3 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl",
				children: "Preview"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs tracking-wide text-muted uppercase",
				children: snapshot.published ? "Published locally" : "Draft"
			})]
		}), ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "Draft preview",
			sandbox: "",
			srcDoc: snapshot.site_html,
			className: "min-h-96 w-full flex-1 rounded-lg border border-line bg-fg"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid min-h-96 flex-1 place-items-center rounded-lg border border-dashed border-line text-sm text-muted",
			children: "The preview lands when the draft is written."
		})]
	});
}
function Plan({ snapshot }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto w-full max-w-3xl px-4 py-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-4xl font-medium",
			children: snapshot.business.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-6 space-y-6",
			children: snapshot.plan.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-serif text-2xl",
				children: section.heading
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted",
				children: section.body
			})] }, section.heading))
		})]
	});
}
var COLUMNS = [
	["backlog", "Backlog"],
	["doing", "Doing"],
	["review", "Review"],
	["done", "Done"]
];
function Tasks({ snapshot, step }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex gap-3 overflow-x-auto px-3 py-4",
		children: COLUMNS.map(([id, label]) => {
			const tasks = snapshot.tasks.filter((task) => columnAt(task, step) === id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "w-72 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mb-2 text-xs tracking-widest text-muted uppercase",
					children: [
						label,
						" · ",
						tasks.length
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-line bg-surface p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: task.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-relaxed text-muted",
								children: task.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-accent",
								children: ownerName(snapshot, task.owner)
							})
						]
					}, task.id))
				})]
			}, id);
		})
	});
}
function Files({ snapshot, step }) {
	const visible = snapshot.files.filter((file) => file.reveal_step <= step);
	const [selected, setSelected] = (0, import_react.useState)(visible[0]?.path ?? "");
	const current = visible.find((file) => file.path === selected) ?? visible[0];
	const options = (0, import_react.useMemo)(() => visible.map((file) => file.path).join("|"), [visible]);
	(0, import_react.useEffect)(() => {
		if (!visible.some((file) => file.path === selected) && visible[0]) setSelected(visible[0].path);
	}, [
		options,
		selected,
		visible
	]);
	if (visible.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-6 text-sm text-muted",
		children: "Files show up as someone writes them."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-96 gap-3 px-3 py-4 lg:grid-cols-[16rem_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "rounded-lg border border-line",
			children: visible.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSelected(file.path),
				className: `flex min-h-11 w-full items-center px-3 text-left text-sm ${current?.path === file.path ? "bg-accent text-ink" : "text-fg"}`,
				children: file.path
			}) }, file.path))
		}), current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "max-h-dvh overflow-auto rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed text-fg",
			children: current.content || "Still writing this file."
		}) : null]
	});
}
function InboxView({ snapshot, step }) {
	const notes = snapshot.inbox.filter((note) => note.reveal_step <= step);
	const decide = useOpenCto((s) => s.decide);
	const busy = useOpenCto((s) => s.busy);
	if (notes.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-6 text-sm text-muted",
		children: "The inbox is quiet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mx-auto w-full max-w-3xl divide-y divide-line px-3",
		children: notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-widest text-accent uppercase",
					children: note.kind
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-medium",
					children: note.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-relaxed text-muted",
					children: note.body
				}),
				note.kind === "approval" && snapshot.approvals.some((item) => item.status === "pending") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy,
					onClick: () => void decide(true),
					className: "mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-3 text-sm font-medium text-ink",
					children: "Approve"
				}) : null
			]
		}, note.id))
	});
}
function Runway({ snapshot, step }) {
	const done = snapshot.tasks.filter((task) => columnAt(task, step) === "done").length;
	const files = snapshot.files.filter((file) => file.reveal_step <= step).length;
	const stats = [
		["Runs", String(snapshot.runs)],
		["Tasks done", String(done)],
		["Files", String(files)],
		["Events played", `${step}/${snapshot.log.length}`]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-3xl px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-4xl font-medium",
				children: "No token meter"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
				children: "The local planner does not call a paid model. These numbers are work on this machine, not a bill."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "mt-6 grid grid-cols-2 gap-3",
				children: stats.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-2 font-serif text-3xl tabular-nums",
						children: value
					})]
				}, label))
			})
		]
	});
}
function SettingsView({ snapshot }) {
	const patchSettings = useOpenCto((s) => s.patchSettings);
	const toggleMcp = useOpenCto((s) => s.toggleMcp);
	const reset = useOpenCto((s) => s.reset);
	const settings = snapshot.settings;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "This business"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					snapshot.business.name,
					" · ",
					snapshot.seed.kind,
					" · profile ",
					snapshot.business.model,
					". Settings stay in this browser."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Linked repository", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: settings.repo,
					onChange: (event) => patchSettings({ repo: event.target.value }),
					placeholder: "you/repo — a note, not a login",
					className: "mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Webhook", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: settings.webhook,
					onChange: (event) => patchSettings({ webhook: event.target.value }),
					placeholder: "https://example.com/hooks/opencto",
					className: "mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Schedule", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: settings.schedule,
					onChange: (event) => patchSettings({ schedule: event.target.value }),
					className: "mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "off",
							children: "Off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "daily",
							children: "Daily note"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "weekdays",
							children: "Weekday note"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-medium",
				children: "Tools the team may use"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 divide-y divide-line border-y border-line",
				children: settings.mcp.map((flag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm",
						children: flag.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted",
						children: flag.detail
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": flag.enabled,
						onClick: () => toggleMcp(flag.id),
						className: `inline-flex min-h-11 items-center rounded-full px-3 text-sm ${flag.enabled ? "bg-accent text-ink" : "border border-line text-muted"}`,
						children: flag.enabled ? "On" : "Off"
					})]
				}, flag.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Secrets are not collected here on purpose. When you self-host, put them in the environment of the machine that runs the CLI, not in a shared desk."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/guide",
					className: "inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm",
					children: "Self-host guide"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: reset,
					className: "inline-flex min-h-11 items-center text-sm text-muted",
					children: "Clear this desk"
				})]
			})
		]
	});
}
var SplitComponent = Headquarters;
//#endregion
export { SplitComponent as component };
