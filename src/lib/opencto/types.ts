export type Section =
  | "lead"
  | "team"
  | "site"
  | "plan"
  | "tasks"
  | "files"
  | "inbox"
  | "runway"
  | "settings";

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
  specialty: string;
  lead: boolean;
};

export type TaskMove = { step: number; column: string };

export type Task = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  moves: TaskMove[];
  path: string;
};

export type FileEntry = {
  path: string;
  content: string;
  reveal_step: number;
};

export type Approval = {
  id: string;
  title: string;
  detail: string;
  status: string;
  reveal_step: number;
};

export type LogEvent = {
  step: number;
  actor: string;
  kind: string;
  text: string;
};

export type Message = {
  id: string;
  author: string;
  role: string;
  body: string;
  at_step: number;
};

export type PlanSection = {
  heading: string;
  body: string;
};

export type McpFlag = {
  id: string;
  label: string;
  detail: string;
  enabled: boolean;
};

export type Settings = {
  repo: string;
  webhook: string;
  schedule: string;
  mcp: McpFlag[];
};

export type Business = {
  name: string;
  tagline: string;
  model: string;
  kind: string;
  brief: string;
  status: string;
};

export type Snapshot = {
  business: Business;
  seed: Seed;
  team: Employee[];
  tasks: Task[];
  files: FileEntry[];
  approvals: Approval[];
  log: LogEvent[];
  messages: Message[];
  plan: PlanSection[];
  site_html: string;
  settings: Settings;
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
    detail: "Positioning, a two-week calendar, and captions you can post.",
    roles: "3 people",
  },
  {
    id: "research",
    name: "Research bench",
    detail: "Lead and writer. A decision memo, not a fake launch.",
    roles: "2 people",
  },
] as const;

export const MODELS = [
  { id: "local", name: "Local", detail: "Deterministic WASM planner in this browser." },
  { id: "alloy", name: "Alloy", detail: "Structured + expressive pass, still local." },
  { id: "kimi", name: "Kimi profile", detail: "Research-heavy framing for fuzzy briefs." },
  { id: "qwen", name: "Qwen profile", detail: "Shorter sentences, fewer flourishes." },
  { id: "deepseek", name: "DeepSeek profile", detail: "Diagnosis-first tone." },
  { id: "devstral", name: "Devstral profile", detail: "Engineering bias for bugfix desks." },
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
