import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EngineResponse, Section, Settings, Snapshot } from "./types";
import { loadEngine } from "./wasm";

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
  launch: (brief: string) => Promise<boolean>;
  send: (message: string) => Promise<void>;
  decide: (approve: boolean, approvalId?: string) => Promise<void>;
  setRunStatus: (status: "pause" | "resume") => Promise<void>;
  hire: (team: string) => Promise<void>;
  fire: (employeeId: string) => Promise<void>;
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

function apply(res: EngineResponse, set: (partial: Partial<OpenCtoState>) => void) {
  if (!res.ok || !res.snapshot) {
    set({ busy: false, error: res.error ?? "The engine refused that." });
    return;
  }
  const next: Partial<OpenCtoState> = {
    snapshot: res.snapshot,
    busy: false,
    error: null,
  };
  if (res.play_from >= 0) {
    next.step = res.play_from;
    next.playing = res.play_from < res.snapshot.log.length;
  }
  set(next);
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
          set({
            snapshot: res.snapshot,
            step: 0,
            playing: true,
            section: "lead",
            busy: false,
            error: null,
            draft: "",
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
          apply(engine.run({ op: "chat", message: text, state: get().snapshot }), set);
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Message failed." });
        }
      },
      async decide(approve, approvalId = "") {
        const snap = get().snapshot;
        if (!snap) return;
        set({ busy: true, error: null });
        try {
          const engine = await loadEngine();
          apply(
            engine.run({
              op: approve ? "approve" : "reject",
              approval_id: approvalId,
              state: get().snapshot,
            }),
            set,
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
          set({
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
          apply(engine.run({ op: "hire", team, state: get().snapshot }), set);
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
          apply(engine.run({ op: "fire", employee_id: employeeId, state: get().snapshot }), set);
        } catch (error) {
          set({ busy: false, error: error instanceof Error ? error.message : "Could not update the team." });
        }
      },
      advance() {
        const len = get().snapshot?.log.length ?? 0;
        const next = get().step + 1;
        if (next >= len) set({ step: len, playing: false });
        else set({ step: next });
      },
      finishPlayback() {
        const len = get().snapshot?.log.length ?? 0;
        set({ step: len, playing: false });
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
        set({ snapshot: { ...snap, settings: { ...snap.settings, ...patch } } });
      },
      toggleMcp(id) {
        const snap = get().snapshot;
        if (!snap) return;
        set({
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
        set({ snapshot: null, step: 0, playing: false, section: "lead", error: null });
      },
    }),
    {
      name: "opencto.v1",
      skipHydration: true,
      partialize: (state) => ({
        snapshot: state.snapshot,
        step: state.step,
        section: state.section,
        draft: state.draft,
        model: state.model,
        team: state.team,
      }),
    },
  ),
);
