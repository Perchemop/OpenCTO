import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/types-CN9twMUX.js
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
function deskId() {
	return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
function upsert(desks, record) {
	if (desks.findIndex((desk) => desk.id === record.id) < 0) return [...desks, record];
	return desks.map((desk) => desk.id === record.id ? record : desk);
}
function commit(set, get, patch) {
	const current = get();
	const snapshot = patch.snapshot === void 0 ? current.snapshot : patch.snapshot;
	const step = patch.step === void 0 ? current.step : patch.step;
	const section = patch.section === void 0 ? current.section : patch.section;
	let activeId = patch.activeId === void 0 ? current.activeId : patch.activeId;
	let desks = patch.desks ? patch.desks.slice() : current.desks.slice();
	if (patch.snapshot === null) {
		if (current.activeId) desks = desks.filter((desk) => desk.id !== current.activeId);
		const next = desks.at(-1) ?? null;
		set({
			...patch,
			desks,
			activeId: next?.id ?? null,
			snapshot: next?.snapshot ?? null,
			step: next?.step ?? 0,
			section: next?.section ?? "lead",
			playing: patch.playing ?? false
		});
		return;
	}
	if (snapshot) {
		if (!activeId) activeId = deskId();
		desks = upsert(desks, {
			id: activeId,
			snapshot,
			step,
			section
		});
	}
	set({
		...patch,
		snapshot: snapshot ?? null,
		step,
		section,
		activeId,
		desks
	});
}
function apply(res, set, get) {
	if (!res.ok || !res.snapshot) {
		set({
			busy: false,
			error: res.error ?? "The engine refused that."
		});
		return;
	}
	const patch = {
		snapshot: res.snapshot,
		busy: false,
		error: null
	};
	if (res.play_from >= 0) {
		patch.step = res.play_from;
		patch.playing = res.play_from < res.snapshot.log.length;
	}
	commit(set, get, patch);
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
	desks: [],
	activeId: null,
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
			const current = get();
			let desks = current.desks;
			if (current.snapshot && current.activeId) desks = upsert(desks, {
				id: current.activeId,
				snapshot: current.snapshot,
				step: current.step,
				section: current.section
			});
			const id = deskId();
			commit(set, get, {
				snapshot: res.snapshot,
				step: 0,
				playing: true,
				section: "lead",
				busy: false,
				error: null,
				draft: "",
				activeId: id,
				desks: [...desks, {
					id,
					snapshot: res.snapshot,
					step: 0,
					section: "lead"
				}]
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
			}), set, get);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Message failed."
			});
		}
	},
	async decide(approve, approvalId = "", reason = "") {
		if (!get().snapshot) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: approve ? "approve" : "reject",
				approval_id: approvalId,
				message: reason,
				state: get().snapshot
			}), set, get);
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
			commit(set, get, {
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
			}), set, get);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not hire."
			});
		}
	},
	async hireCustom(name, role, focus) {
		if (!get().snapshot || !name.trim()) return;
		set({
			busy: true,
			error: null
		});
		try {
			apply((await loadEngine()).run({
				op: "hire",
				name: name.trim(),
				role: role.trim(),
				message: focus.trim(),
				model: get().model,
				state: get().snapshot
			}), set, get);
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
			}), set, get);
		} catch (error) {
			set({
				busy: false,
				error: error instanceof Error ? error.message : "Could not update the team."
			});
		}
	},
	switchDesk(id) {
		const current = get();
		const target = current.desks.find((desk) => desk.id === id);
		if (!target || target.id === current.activeId) return;
		let desks = current.desks;
		if (current.snapshot && current.activeId) desks = upsert(desks, {
			id: current.activeId,
			snapshot: current.snapshot,
			step: current.step,
			section: current.section
		});
		const fresh = desks.find((desk) => desk.id === id) ?? target;
		commit(set, get, {
			desks,
			activeId: fresh.id,
			snapshot: fresh.snapshot,
			step: fresh.step,
			section: fresh.section,
			playing: false,
			error: null
		});
	},
	advance() {
		const len = get().snapshot?.log.length ?? 0;
		const next = get().step + 1;
		if (next >= len) commit(set, get, {
			step: len,
			playing: false
		});
		else commit(set, get, { step: next });
	},
	finishPlayback() {
		commit(set, get, {
			step: get().snapshot?.log.length ?? 0,
			playing: false
		});
	},
	setPlaying(playing) {
		set({ playing });
	},
	setSection(section) {
		commit(set, get, { section });
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
		commit(set, get, { snapshot: {
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
		commit(set, get, { snapshot: {
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
		commit(set, get, {
			snapshot: null,
			step: 0,
			playing: false,
			section: "lead",
			error: null
		});
	}
}), {
	name: "opencto.v1",
	version: 2,
	skipHydration: true,
	partialize: (state) => ({
		snapshot: state.snapshot,
		step: state.step,
		section: state.section,
		draft: state.draft,
		model: state.model,
		team: state.team,
		desks: state.desks,
		activeId: state.activeId
	}),
	migrate: (persisted, version) => {
		const state = persisted;
		if (!state) return persisted;
		if (version < 2 && state.snapshot && (!state.desks || state.desks.length === 0)) {
			const id = "desk-1";
			return {
				...state,
				activeId: id,
				desks: [{
					id,
					snapshot: state.snapshot,
					step: state.step ?? 0,
					section: state.section ?? "lead"
				}]
			};
		}
		return state;
	}
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
