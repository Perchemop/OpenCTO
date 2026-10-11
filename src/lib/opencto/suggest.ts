import type { Snapshot } from "./types";

export function suggestions(snapshot: Snapshot, step: number): string[] {
  const pending = snapshot.approvals.some((item) => item.status === "pending" && item.reveal_step <= step);
  const extras = new Set(snapshot.seed.extras);
  const ideas: string[] = [];
  if (pending) ideas.push("Approve the draft");
  if (snapshot.seed.kind === "website" && !extras.has("pricing")) ideas.push("Add a pricing section");
  if ((snapshot.seed.kind === "website" || snapshot.seed.kind === "marketing") && !extras.has("faq")) {
    ideas.push("Add a FAQ");
  }
  if (snapshot.seed.kind === "bugfix") ideas.push("Add a note about what the timeout used to do");
  if (snapshot.seed.kind === "marketing") ideas.push("Make the Friday caption shorter");
  if (snapshot.seed.kind === "research" || snapshot.seed.kind === "product") {
    ideas.push("Name one thing this draft will not do");
  }
  if (!snapshot.team.some((person) => person.role === "Writer" || person.role === "Editor")) {
    ideas.push("Hire a writer");
  }
  if (snapshot.business.status === "paused") ideas.push("Resume");
  else ideas.push("Pause the team");
  return ideas.slice(0, 4);
}
