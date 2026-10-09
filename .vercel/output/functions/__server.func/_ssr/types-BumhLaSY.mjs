import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/types-BumhLaSY.js
var pending = null;
function loadEngine() {
	if (!pending) pending = init();
	return pending;
}
async function init() {
	const response = await fetch("/engine/opencto.wasm");
	if (!response.ok) {
		pending = null;
		throw new Error("The Rust engine did not load.");
	}
	const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
	const exp = instance.exports;
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	return { run(request) {
		const input = encoder.encode(JSON.stringify(request));
		const ptr = exp.alloc(input.length);
		new Uint8Array(exp.memory.buffer).set(input, ptr);
		const out = exp.opencto_run(ptr, input.length);
		exp.dealloc(ptr, input.length);
		const len = new DataView(exp.memory.buffer).getUint32(out, true);
		const json = decoder.decode(new Uint8Array(exp.memory.buffer).subarray(out + 4, out + 4 + len));
		exp.dealloc(out, 4 + len);
		return JSON.parse(json);
	} };
}
function apply(res, set) {
	if (!res.ok || !res.snapshot) {
		set({
			busy: false,
			error: res.error ?? "The engine refused that."
		});
		return;
	}
	const next = {
		snapshot: res.snapshot,
		busy: false,
		error: null
	};
	if (res.play_from >= 0) {
		next.step = res.play_from;
		next.playing = res.play_from < res.snapshot.log.length;
	}
	set(next);
}
var useOpenCto = create()(persist((set, get) => ({
	snapshot: null,
	step: 0,
	playing: false,
	section: "lead",
	draft: "",
	model: "alloy",
	team: "website",
	busy: false,
	error: null,
	async launch(brief) {
		const text = brief.trim();
		if (!text) {
			set({ error: "Tell the team what to build." });
			return false;
		}
		set({
			busy: true,
			error: null
		});
		try {
			const res = (await loadEngine()).run({
				op: "launch",
				brief: text,
				team: get().team,
				model: get().model
			});
			if (!res.ok || !res.snapshot) {
				set({
					busy: false,
					error: res.error ?? "Launch failed."
				});
				return false;
			}
			set({
				snapshot: res.snapshot,
				step: 0,
				playing: true,
				section: "lead",
				busy: false,
				error: null,
				draft: ""
			});
			return true;
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Launch failed."
			});
			return false;
		}
	},
	async send(message) {
		const snap = get().snapshot;
		const text = message.trim();
		if (!snap || !text) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: "chat",
				message: text,
				state: get().snapshot
			}), set);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Message failed."
			});
		}
	},
	async decide(approve, approvalId = "") {
		if (!get().snapshot) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: approve ? "approve" : "reject",
				approval_id: approvalId,
				state: get().snapshot
			}), set);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not record that."
			});
		}
	},
	async setRunStatus(status) {
		if (!get().snapshot) return;
		if (status === "pause") set({ playing: false });
		set({
			busy: true,
			error: null
		});
		try {
			const res = (await loadEngine()).run({
				op: status,
				state: get().snapshot
			});
			if (!res.ok || !res.snapshot) {
				set({
					busy: false,
					error: res.error ?? "Could not update status."
				});
				return;
			}
			const step = get().step;
			set({
				snapshot: res.snapshot,
				busy: false,
				playing: status === "resume" && step < res.snapshot.log.length
			});
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not update status."
			});
		}
	},
	async hire(team) {
		if (!get().snapshot) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: "hire",
				team,
				state: get().snapshot
			}), set);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not hire."
			});
		}
	},
	async fire(employeeId) {
		if (!get().snapshot) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: "fire",
				employee_id: employeeId,
				state: get().snapshot
			}), set);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not update the team."
			});
		}
	},
	advance() {
		const len = get().snapshot?.log.length ?? 0;
		const next = get().step + 1;
		if (next >= len) set({
			step: len,
			playing: false
		});
		else set({ step: next });
	},
	finishPlayback() {
		set({
			step: get().snapshot?.log.length ?? 0,
			playing: false
		});
	},
	setPlaying(playing) {
		set({ playing });
	},
	setSection(section) {
		set({ section });
	},
	setDraft(draft) {
		set({ draft });
	},
	setModel(model) {
		set({ model });
	},
	setTeam(team) {
		set({ team });
	},
	patchSettings(patch) {
		const snap = get().snapshot;
		if (!snap) return;
		set({ snapshot: {
			...snap,
			settings: {
				...snap.settings,
				...patch
			}
		} });
	},
	toggleMcp(id) {
		const snap = get().snapshot;
		if (!snap) return;
		set({ snapshot: {
			...snap,
			settings: {
				...snap.settings,
				mcp: snap.settings.mcp.map((flag) => flag.id === id ? {
					...flag,
					enabled: !flag.enabled
				} : flag)
			}
		} });
	},
	reset() {
		set({
			snapshot: null,
			step: 0,
			playing: false,
			section: "lead",
			error: null
		});
	}
}), {
	name: "opencto.v1",
	skipHydration: true,
	partialize: (state) => ({
		snapshot: state.snapshot,
		step: state.step,
		section: state.section,
		draft: state.draft,
		model: state.model,
		team: state.team
	})
}));
var TEAMS = [
	{
		id: "website",
		name: "Website desk",
		detail: "Lead, researcher, and web engineer. One page, then a publish gate.",
		roles: "3 people"
	},
	{
		id: "engineering",
		name: "Engineering squad",
		detail: "Lead, backend, frontend, and QA. A module and a review, not a platform.",
		roles: "4 people"
	},
	{
		id: "bugfix",
		name: "Bugfix strike",
		detail: "Reproduce, patch, and stop before the word merge.",
		roles: "3 people"
	},
	{
		id: "marketing",
		name: "Marketing atelier",
		detail: "Positioning, a two-week calendar, and captions you could post.",
		roles: "3 people"
	},
	{
		id: "research",
		name: "Research bench",
		detail: "A decision memo when the brief is still a question.",
		roles: "2 people"
	}
];
var MODELS = [
	{
		id: "local",
		name: "Local planner",
		detail: "Deterministic. No network."
	},
	{
		id: "alloy",
		name: "Local alloy",
		detail: "Structured pass, then expressive, merged."
	},
	{
		id: "qwen",
		name: "Qwen profile",
		detail: "Tighter copy. Pair with Ollama later."
	},
	{
		id: "devstral",
		name: "Devstral profile",
		detail: "Code-first, with an extra check."
	},
	{
		id: "deepseek",
		name: "DeepSeek profile",
		detail: "Longer diagnosis before edits."
	},
	{
		id: "kimi",
		name: "Kimi profile",
		detail: "Research-heavy when the brief is fuzzy."
	}
];
var PROMPTS = [
	{
		team: "website",
		model: "alloy",
		brief: "A booking site for a Lisbon ceramic studio called Barro"
	},
	{
		team: "bugfix",
		model: "devstral",
		brief: "Find and fix the flaky checkout timeout in our Rust API"
	},
	{
		team: "marketing",
		model: "kimi",
		brief: "Plan a two-week content calendar for a neighborhood bakery called Hearth"
	},
	{
		team: "engineering",
		model: "local",
		brief: "Add a CSV export to the billing page of a Rust ledger app called Tally"
	}
];
function columnAt(task, step) {
	let column = "backlog";
	for (const move of task.moves) if (move.step <= step) column = move.column;
	return column;
}
function ownerName(snapshot, id) {
	return snapshot.team.find((person) => person.id === id)?.name ?? "Unassigned";
}
//#endregion
export { ownerName as a, columnAt as i, PROMPTS as n, useOpenCto as o, TEAMS as r, MODELS as t };
