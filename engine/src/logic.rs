use crate::types::*;

pub const VERSION: &str = "0.2.1";

pub fn handle(req: Request) -> Response {
    let op = req.op.trim().to_ascii_lowercase();
    match op.as_str() {
        "" | "catalog" => ok_catalog(),
        "launch" => launch(&req),
        "chat" => chat(&req),
        "approve" => settle(&req, true),
        "reject" => settle(&req, false),
        "pause" => set_status(&req, "paused"),
        "resume" => set_status(&req, "running"),
        "hire" => hire(&req),
        "fire" => fire(&req),
        other => fail(format!("unknown op '{other}'")),
    }
}

fn ok_catalog() -> Response {
    Response {
        ok: true,
        error: None,
        snapshot: None,
        play_from: -1,
        catalog: Some(catalog()),
    }
}

fn fail(error: String) -> Response {
    Response {
        ok: false,
        error: Some(error),
        snapshot: None,
        play_from: -1,
        catalog: None,
    }
}

fn ready(snapshot: Snapshot, play_from: i32) -> Response {
    Response {
        ok: true,
        error: None,
        snapshot: Some(snapshot),
        play_from,
        catalog: None,
    }
}

pub fn catalog() -> Catalog {
    Catalog {
        version: VERSION.into(),
        models: vec![
            model("local", "Local planner", "Deterministic Rust planner. Default. No network."),
            model("alloy", "Local alloy", "Two passes — structured, then expressive — merged in one thread."),
            model("qwen", "Qwen profile", "Shorter tasks and tighter copy. Pair with Ollama's Qwen when you self-host."),
            model("devstral", "Devstral profile", "Code-first notes and an extra test step."),
            model("deepseek", "DeepSeek profile", "Longer diagnosis before anyone edits a file."),
            model("kimi", "Kimi profile", "Research-heavy plan. Useful for briefs that are still fuzzy."),
        ],
        teams: vec![
            team("website", "Website desk", "Lead, researcher, and web engineer. Ships a one-page preview.", &["Lead", "Researcher", "Web"]),
            team("engineering", "Engineering squad", "Lead, backend, frontend, and QA. Scaffolds a small module and a review.", &["Lead", "Backend", "Frontend", "QA"]),
            team("bugfix", "Bugfix strike", "Lead, backend, and QA. Reproduces, patches, and asks before you merge.", &["Lead", "Backend", "QA"]),
            team("marketing", "Marketing atelier", "Strategist, writer, and analyst. Positioning, a calendar, and captions.", &["Strategist", "Writer", "Analyst"]),
            team("research", "Research bench", "Lead and writer. Turns a fuzzy brief into a decision memo.", &["Lead", "Writer"]),
        ],
        prompts: vec![
            prompt("website", "alloy", "A booking site for a Lisbon ceramic studio called Barro"),
            prompt("bugfix", "devstral", "Find and fix the flaky checkout timeout in our Rust API"),
            prompt("marketing", "kimi", "Plan a two-week content calendar for a neighborhood bakery called Hearth"),
            prompt("engineering", "local", "Add a CSV export to the billing page of a Rust ledger app called Tally"),
        ],
    }
}

fn model(id: &str, name: &str, detail: &str) -> ModelInfo {
    ModelInfo { id: id.into(), name: name.into(), detail: detail.into() }
}
fn team(id: &str, name: &str, detail: &str, roles: &[&str]) -> TeamInfo {
    TeamInfo {
        id: id.into(),
        name: name.into(),
        detail: detail.into(),
        roles: roles.iter().map(|r| (*r).to_string()).collect(),
    }
}
fn prompt(team: &str, model: &str, brief: &str) -> PromptInfo {
    PromptInfo { team: team.into(), model: model.into(), brief: brief.into() }
}
