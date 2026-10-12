import type { Snapshot } from "./types";

export function suggestions(snapshot: Snapshot, step: number): string[] {
  const pending = snapshot.approvals.filter((item) => item.status === "pending" && item.reveal_step <= step);
  const extras = new Set(snapshot.seed.extras);
  const kind = snapshot.seed.kind;
  const ideas: string[] = [];

  if (pending.length > 0) {
    ideas.push("Approve the draft");
    ideas.push("Reject — the headline is too generic");
  }

  if (kind === "website" || kind === "marketing") {
    if (!extras.has("pricing")) ideas.push("Add a pricing section");
    if (!extras.has("faq")) ideas.push("Add a FAQ");
    if (!extras.has("menu") && kind === "website") ideas.push("Add a simple menu section");
    ideas.push("Switch to the chalk palette");
    ideas.push(`Rename the business to ${snapshot.seed.name} Studio`);
  }

  if (kind === "bugfix") {
    ideas.push("Add a note about what the timeout used to do");
    ideas.push("Ask QA to restate the reproduction steps");
  }

  if (kind === "marketing") {
    ideas.push("Make the Friday caption shorter");
    ideas.push("Drop one channel from the calendar");
  }

  if (kind === "research" || kind === "product" || kind === "engineering") {
    ideas.push("Name one thing this draft will not do");
    ideas.push("Tighten the success criteria");
  }

  if (!snapshot.team.some((person) => /writer|editor/i.test(person.role))) {
    ideas.push("Hire a writer");
  }
  if (!snapshot.team.some((person) => /qa|quality/i.test(person.role)) && kind !== "marketing") {
    ideas.push("Hire a QA person");
  }

  if (snapshot.business.status === "paused") ideas.push("Resume");
  else ideas.push("Pause the team");

  // Prefer unique, context-first chips
  const seen = new Set<string>();
  const out: string[] = [];
  for (const idea of ideas) {
    if (seen.has(idea)) continue;
    seen.add(idea);
    out.push(idea);
    if (out.length >= 5) break;
  }
  return out;
}
