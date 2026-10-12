import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EngineResponse, Section, Settings, Snapshot } from "./types";
import { loadEngine } from "./wasm";

export type DeskRecord = {
  id: string;
  snapshot: Snapshot;
  step: number;
  section: Section;
};

type OpenCtoState = {
  snapshot: Snapshot | null;
  step: number;
  playing: boolean;
  section: Section;
  draft: string;
  model: string;
  team: string;
  busy: boolean;
  error: string | null;
  desks: DeskRecord[];
  activeId: string | null;
  launch: (brief: string) => Promise<boolean>;
  send: (message: string) => Promise<void>;
  decide: (approve: boolean, approvalId?: string, reason?: string) => Promise<void>;
  setRunStatus: (status: "pause" | "resume") => Promise<void>;
  hire: (team: string) => Promise<void>;
  hireCustom: (name: string, role: string, focus: string) => Promise<void>;
  fire: (employeeId: string) => Promise<void>;
  switchDesk: (id: string) => void;
  renameDesk: (id: string, name: string) => void;
  /** Replace local desks with a cloud backup (merge by id, remote wins). */
  importDesks: (incoming: DeskRecord[], preferredActiveId?: string | null) => void;
  advance: () => void;
  finishPlayback: () => void;
  setPlaying: (playing: boolean) => void;
  setSection: (section: Section) => void;
  setDraft: (draft: string) => void;
  setModel: (model: string) => void;
  setTeam: (team: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  toggleMcp: (id: string) => void;
  reset: () => void;
};

type StoreGet = () => OpenCtoState;
type StoreSet = (partial: Partial<OpenCtoState>) => void;

function deskId() {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function upsert(desks: DeskRecord[], record: DeskRecord) {
  const index = desks.findIndex((desk) => desk.id === record.id);
  if (index < 0) return [...desks, record];
  return desks.map((desk) => (desk.id === record.id ? record : desk));
}

function commit(set: StoreSet, get: StoreGet, patch: Partial<OpenCtoState>) {
  const current = get();
  const snapshot = patch.snapshot === undefined ? current.snapshot : patch.snapshot;
  const step = patch.step === undefined ? current.step : patch.step;
  const section = patch.section === undefined ? current.section : patch.section;
  let activeId = patch.activeId === undefined ? current.activeId : patch.activeId;
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
      playing: patch.playing ?? false,
    });
    return;
  }

  if (snapshot) {
    if (!activeId) activeId = deskId();
    desks = upsert(desks, { id: activeId, snapshot, step, section });
  }
  set({ ...patch, snapshot: snapshot ?? null, step, section, activeId, desks });
}

function apply(res: EngineResponse, set: StoreSet, get: StoreGet) {
  if (!res.ok || !res.snapshot) {
    set({ busy: false, error: res.error ?? "The engine refused that." });
    return;
  }
  const patch: Partial<OpenCtoState> = {
    snapshot: res.snapshot,
    busy: false,
    error: null,
  };
  if (res.play_from >= 0) {
    patch.step = res.play_from;
    patch.playing = res.play_from < res.snapshot.log.length;
  }
  commit(set, get, patch);
}

export const useOpenCto = create<OpenCtoState>()(
  persist(
    (set, get) => ({
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
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          const res = engine.run({
            op: "launch",
            brief: text,
            team: get().team,
            model: get().model,
          });
          if (!res.ok || !res.snapshot) {
            set({ busy: false, error: res.error ?? "Launch failed." });
            return false;
          }
          const current = get();
          let desks = current.desks;
          if (current.snapshot && current.activeId) {
            desks = upsert(desks, {
              id: current.activeId,
              snapshot: current.snapshot,
              step: current.step,
              section: current.section,
            });
          }
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
            desks: [...desks, { id, snapshot: res.snapshot, step: 0, section: "lead" }],
          });
          return true;
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Launch failed." });
          return false;
        }
      },
      async send(message) {
        const snap = get().snapshot;
        const text = message.trim();
        if (!snap || !text) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(engine.run({ op: "chat", message: text, state: get().snapshot }), set, get);
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Message failed." });
        }
      },
      async decide(approve, approvalId = "", reason = "") {
        const snap = get().snapshot;
        if (!snap) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(
            engine.run({
              op: approve ? "approve" : "reject",
              approval_id: approvalId,
              message: reason,
              state: get().snapshot,
            }),
            set,
            get,
          );
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not record that." });
        }
      },
      async setRunStatus(status) {
        const snap = get().snapshot;
        if (!snap) return;
        if (status === "pause") set({ playing: false });
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          const res = engine.run({ op: status, state: get().snapshot });
          if (!res.ok || !res.snapshot) {
            set({ busy: false, error: res.error ?? "Could not update status." });
            return;
          }
          const step = get().step;
          commit(set, get, {
            snapshot: res.snapshot,
            busy: false,
            playing: status === "resume" && step < res.snapshot.log.length,
          });
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not update status." });
        }
      },
      async hire(team) {
        const snap = get().snapshot;
        if (!snap) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(engine.run({ op: "hire", team, state: get().snapshot }), set, get);
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not hire." });
        }
      },
      async hireCustom(name, role, focus) {
        const snap = get().snapshot;
        if (!snap || !name.trim()) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(
            engine.run({
              op: "hire",
              name: name.trim(),
              role: role.trim(),
              message: focus.trim(),
              model: get().model,
              state: get().snapshot,
            }),
            set,
            get,
          );
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not hire." });
        }
      },
      async fire(employeeId) {
        const snap = get().snapshot;
        if (!snap) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(engine.run({ op: "fire", employee_id: employeeId, state: get().snapshot }), set, get);
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not update the team." });
        }
      },
      switchDesk(id) {
        const current = get();
        const target = current.desks.find((desk) => desk.id === id);
        if (!target || target.id === current.activeId) return;
        let desks = current.desks;
        if (current.snapshot && current.activeId) {
          desks = upsert(desks, {
            id: current.activeId,
            snapshot: current.snapshot,
            step: current.step,
            section: current.section,
          });
        }
        const fresh = desks.find((desk) => desk.id === id) ?? target;
        commit(set, get, {
          desks,
          activeId: fresh.id,
          snapshot: fresh.snapshot,
          step: fresh.step,
          section: fresh.section,
          playing: false,
          error: null,
        });
      },
      renameDesk(id, name) {
        const nextName = name.trim().slice(0, 64);
        if (!nextName) return;
        const current = get();
        const desks = current.desks.map((desk) => {
          if (desk.id !== id) return desk;
          return {
            ...desk,
            snapshot: {
              ...desk.snapshot,
              business: { ...desk.snapshot.business, name: nextName },
              seed: { ...desk.snapshot.seed, name: nextName },
            },
          };
        });
        const active = desks.find((desk) => desk.id === current.activeId);
        if (current.activeId === id && current.snapshot) {
          commit(set, get, {
            desks,
            snapshot: {
              ...current.snapshot,
              business: { ...current.snapshot.business, name: nextName },
              seed: { ...current.snapshot.seed, name: nextName },
            },
          });
          return;
        }
        set({ desks, snapshot: active?.snapshot ?? current.snapshot });
      },
      importDesks(incoming, preferredActiveId) {
        if (!incoming.length) return;
        const current = get();
        // Flush active desk into the list first
        let desks = current.desks;
        if (current.snapshot && current.activeId) {
          desks = upsert(desks, {
            id: current.activeId,
            snapshot: current.snapshot,
            step: current.step,
            section: current.section,
          });
        }
        for (const record of incoming) {
          if (!record?.id || !record.snapshot) continue;
          desks = upsert(desks, {
            id: record.id,
            snapshot: record.snapshot,
            step: record.step ?? 0,
            section: record.section ?? "lead",
          });
        }
        const activeId =
          (preferredActiveId && desks.some((d) => d.id === preferredActiveId) && preferredActiveId) ||
          current.activeId ||
          desks[0]?.id ||
          null;
        const active = desks.find((d) => d.id === activeId) ?? desks[0];
        if (!active) return;
        set({
          desks,
          activeId: active.id,
          snapshot: active.snapshot,
          step: active.step,
          section: active.section,
          playing: false,
          error: null,
        });
      },
      advance() {
        const len = get().snapshot?.log.length ?? 0;
        const next = get().step + 1;
        if (next >= len) commit(set, get, { step: len, playing: false });
        else commit(set, get, { step: next });
      },
      finishPlayback() {
        const len = get().snapshot?.log.length ?? 0;
        commit(set, get, { step: len, playing: false });
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
        commit(set, get, { snapshot: { ...snap, settings: { ...snap.settings, ...patch } } });
      },
      toggleMcp(id) {
        const snap = get().snapshot;
        if (!snap) return;
        commit(set, get, {
          snapshot: {
            ...snap,
            settings: {
              ...snap.settings,
              mcp: snap.settings.mcp.map((flag) => (flag.id === id ? { ...flag, enabled: !flag.enabled } : flag)),
            },
          },
        });
      },
      reset() {
        commit(set, get, { snapshot: null, step: 0, playing: false, section: "lead", error: null });
      },
    }),
    {
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
        activeId: state.activeId,
      }),
      migrate: (persisted, version) => {
        const state = persisted as Partial<OpenCtoState> | undefined;
        if (!state) return persisted as OpenCtoState;
        if (version < 2 && state.snapshot && (!state.desks || state.desks.length === 0)) {
          const id = "desk-1";
          return {
            ...state,
            activeId: id,
            desks: [
              {
                id,
                snapshot: state.snapshot,
                step: state.step ?? 0,
                section: state.section ?? "lead",
              },
            ],
          } as OpenCtoState;
        }
        return state as OpenCtoState;
      },
    },
  ),
);
