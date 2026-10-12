export type Section =
  | "lead"
  | "team"
  | "site"
  | "plan"
  | "tasks"
  | "files"
  | "inbox"
  | "settings"
  | "runway";

export type Business = {
  name: string;
  tagline: string;
  status: string;
  model: string;
  kind: string;
  brief: string;
};

export type Service = { title: string; body: string };

export type Seed = {
  name: string;
  city: string;
  niche: string;
  niche_label: string;
  kind: string;
  headline: string;
  subhead: string;
  services: Service[];
  proof: string;
  palette: string;
  extras: string[];
  stack: string;
  module: string;
  alloy: boolean;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  model: string;
  focus: string;
  lead: boolean;
};

export type Move = { step: number; column: string };

export type Task = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  column: string;
  moves: Move[];
  artifact: string;
};

export type Message = {
  id: string;
  from: string;
  role: string;
  body: string;
  at_step: number;
};

export type LogEvent = {
  step: number;
  actor: string;
  kind: string;
  text: string;
  task_id: string;
};

export type FileNode = {
  path: string;
  language: string;
  content: string;
  reveal_step: number;
};

export type Approval = {
  id: string;
  title: string;
  detail: string;
  risk: string;
  reveal_step: number;
  status: string;
};

export type PlanSection = { heading: string; body: string };

export type Note = {
  id: string;
  title: string;
  body: string;
  kind: string;
  reveal_step: number;
};

export type McpFlag = { id: string; label: string; detail: string; enabled: boolean };
export type Secret = { key: string; value: string };

export type Settings = {
  repo: string;
  webhook: string;
  schedule: string;
  require_approval: boolean;
  mcp: McpFlag[];
  secrets: Secret[];
};

export type Snapshot = {
  version: number;
  runs: number;
  business: Business;
  seed: Seed;
  team: Employee[];
  tasks: Task[];
  messages: Message[];
  log: LogEvent[];
  files: FileNode[];
  approvals: Approval[];
  plan: PlanSection[];
  inbox: Note[];
  site_html: string;
  published: boolean;
  settings: Settings;
};

export type EngineResponse = {
  ok: boolean;
  error?: string;
  snapshot?: Snapshot;
  play_from: number;
  catalog?: {
    version: string;
    models: { id: string; name: string; detail: string }[];
    teams: { id: string; name: string; detail: string; roles: string[] }[];
    prompts: { team: string; model: string; brief: string }[];
  };
};

export const TEAMS = [
  {
    id: "website",
    name: "Website desk",
    detail: "Lead, researcher, and web engineer. One page, then a publish gate.",
    roles: "3 people",
  },
  {
    id: "engineering",
    name: "Engineering squad",
    detail: "Lead, backend, frontend, and QA. A module and a review, not a platform.",
    roles: "4 people",
  },
  {
    id: "bugfix",
    name: "Bugfix strike",
    detail: "Reproduce, patch, and stop before the word merge.",
    roles: "3 people",
  },
  {
    id: "marketing",
    name: "Marketing atelier",
    detail: "Positioning, a two-week calendar, and captions you could post.",
    roles: "3 people",
  },
  {
    id: "research",
    name: "Research bench",
    detail: "A decision memo when the brief is still a question.",
    roles: "2 people",
  },
] as const;

export const MODELS = [
  { id: "local", name: "Local planner", detail: "Deterministic. No network." },
  { id: "alloy", name: "Local alloy", detail: "Structured pass, then expressive, merged." },
  { id: "qwen", name: "Qwen profile", detail: "Tighter copy. Pair with Ollama later." },
  { id: "devstral", name: "Devstral profile", detail: "Code-first, with an extra check." },
  { id: "deepseek", name: "DeepSeek profile", detail: "Longer diagnosis before edits." },
  { id: "kimi", name: "Kimi profile", detail: "Research-heavy when the brief is fuzzy." },
] as const;

export const PROMPTS = [
  { team: "website", model: "alloy", brief: "A weather tracking website called Clear Horizon" },
  { team: "website", model: "local", brief: "A booking site for a Lisbon ceramic studio called Barro" },
  { team: "bugfix", model: "devstral", brief: "Find and fix the flaky checkout timeout in our Rust API" },
  { team: "marketing", model: "kimi", brief: "Plan a two-week content calendar for a neighborhood bakery called Hearth" },
  { team: "engineering", model: "local", brief: "Add a CSV export to the billing page of a Rust ledger app called Tally" },
  { team: "website", model: "alloy", brief: "A habit tracker dashboard for daily water intake" },
] as const;

export function columnAt(task: Task, step: number): string {
  let column = "backlog";
  for (const move of task.moves) {
    if (move.step <= step) column = move.column;
  }
  return column;
}

export function ownerName(snapshot: Snapshot, id: string): string {
  return snapshot.team.find((person) => person.id === id)?.name ?? "Unassigned";
}
