use crate::types::*;

pub const VERSION: &str = "0.2.0";

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

fn launch(req: &Request) -> Response {
    let brief = req.brief.trim();
    if brief.is_empty() {
        return fail("Tell the team what to build.".into());
    }
    let model = normalize_model(&req.model);
    let team_id = normalize_team(&req.team, brief);
    let mut seed = parse_brief(brief, &team_id, &model);
    seed.alloy = model == "alloy";
    let mut snap = empty_snapshot(brief, &seed, &model);
    snap.team = staff(&team_id, &model);
    snap.runs = 1;
    compose(&mut snap, true);
    ready(snap, 0)
}

fn chat(req: &Request) -> Response {
    let Some(mut snap) = req.state.clone() else {
        return fail("Start a business before chatting.".into());
    };
    let message = req.message.trim();
    if message.is_empty() {
        return fail("Write a message for the lead.".into());
    }
    if snap.business.status == "paused" && !is_resume(message) {
        return fail("The business is paused. Resume it before the team takes new work.".into());
    }
    let from = snap.log.len() as u32;
    snap.runs += 1;
    snap.messages.push(Message {
        id: format!("m{}", snap.messages.len() + 1),
        from: "You".into(),
        role: "user".into(),
        body: message.into(),
        at_step: from,
    });

    let lower = message.to_ascii_lowercase();
    if is_pause(message) {
        snap.business.status = "paused".into();
        say(&mut snap, 0, "Paused. I will not start new work until you resume.");
        return ready(snap, -1);
    }
    if is_resume(message) {
        snap.business.status = "running".into();
        say(&mut snap, 0, "Resumed. Send the next job when you want it.");
        return ready(snap, -1);
    }
    if lower.contains("approve") || lower == "yes" || lower == "ship it" || lower == "lgtm" {
        return settle_snap(snap, from, true, "", "");
    }
    if lower.contains("reject") || lower == "no" || lower.starts_with("don't publish") {
        return settle_snap(snap, from, false, "", &reason_from(message));
    }
    if let Some(team) = hire_target(&lower) {
        return hire_into(snap, from, team);
    }
    if let Some(who) = fire_target(&lower, &snap) {
        return fire_id(snap, from, &who);
    }

    let palette = palette_from_text(&lower);
    let extra = extra_from_text(&lower);
    let renamed = rename_from(message);
    if palette.is_some() || extra.is_some() || renamed.is_some() {
        if let Some(ref name) = renamed {
            snap.seed.name = name.clone();
        }
        if let Some(palette) = palette {
            snap.seed.palette = palette.into();
        }
        if let Some(extra) = extra {
            if !snap.seed.extras.iter().any(|e| e == extra) {
                snap.seed.extras.push(extra.into());
            }
        }
        rerender(&mut snap);
        let owner = snap
            .team
            .iter()
            .find(|e| !e.lead)
            .map(|e| e.name.clone())
            .unwrap_or_else(|| "Ada Voss".into());
        let mut bits = Vec::new();
        if renamed.is_some() {
            bits.push(format!("renamed the business to {}", snap.seed.name));
        }
        if let Some(palette) = palette {
            bits.push(format!("set the {palette} palette"));
        }
        if let Some(extra) = extra {
            bits.push(format!("added a {extra} section"));
        }
        let summary = bits.join(", ");
        let step = note_event(
            &mut snap,
            &owner,
            "write",
            &format!("Updated the draft: {summary}."),
            "",
        );
        say(
            &mut snap,
            step,
            &format!("Done — {summary}. The preview is a new local draft. Publish still waits on you."),
        );
        snap.published = false;
        reopen_approval(&mut snap, step);
        return ready(snap, from as i32);
    }

    generic_follow_up(&mut snap, from, message);
    ready(snap, from as i32)
}

fn settle(req: &Request, approve: bool) -> Response {
    let Some(snap) = req.state.clone() else {
        return fail("Nothing to review yet.".into());
    };
    let from = snap.log.len() as u32;
    settle_snap(snap, from, approve, &req.approval_id, &req.message)
}

fn settle_snap(mut snap: Snapshot, from: u32, approve: bool, approval_id: &str, reason: &str) -> Response {
    let idx = snap.approvals.iter().position(|a| {
        a.status == "pending" && (approval_id.is_empty() || a.id == approval_id)
    });
    let Some(idx) = idx else {
        say(&mut snap, from, "There is no pending approval. Ask for a change, or start a new task.");
        return ready(snap, from as i32);
    };
    if approve {
        snap.approvals[idx].status = "approved".into();
        snap.published = true;
        let title = snap.approvals[idx].title.clone();
        for task in snap.tasks.iter_mut() {
            if task.column == "review" {
                task.column = "done".into();
                task.moves.push(Move { step: from.max(1), column: "done".into() });
            }
        }
        let step = note_event(&mut snap, "Ada Voss", "review", &format!("You approved “{title}”. I marked the review column done. Nothing left this browser."), "");
        say(&mut snap, step, "Approved and marked published on this machine. There is no remote deploy in the local planner — copy the files, or run the CLI in your own repo.");
        let _ = from;
    } else {
        snap.approvals[idx].status = "rejected".into();
        snap.published = false;
        let why = clip(reason.trim(), 240);
        let noted = if why.is_empty() {
            "You rejected the pending approval. The draft stays unpublished.".to_string()
        } else {
            format!("You rejected the pending approval. Reason: {why}")
        };
        let step = note_event(&mut snap, "Ada Voss", "review", &noted, "");
        if why.is_empty() {
            say(&mut snap, step, "Held. Tell me what to change and I will cut a new draft.");
        } else {
            say(
                &mut snap,
                step,
                &format!("Held. I wrote down: {why} The draft stays unpublished until you ask for another pass."),
            );
        }
    }
    ready(snap, from as i32)
}

fn set_status(req: &Request, status: &str) -> Response {
    let Some(mut snap) = req.state.clone() else {
        return fail("Nothing is running yet.".into());
    };
    snap.business.status = status.into();
    if status == "paused" {
        say(&mut snap, 0, "Paused. This planner was never calling a model vendor — resume when you want the next job.");
    } else {
        say(&mut snap, 0, "Resumed.");
    }
    ready(snap, -1)
}

fn hire(req: &Request) -> Response {
    let Some(snap) = req.state.clone() else {
        return fail("Open a headquarters before hiring.".into());
    };
    let from = snap.log.len() as u32;
    if !req.name.trim().is_empty() {
        return hire_named(snap, from, req);
    }
    let team = normalize_team(&req.team, &snap.business.brief);
    hire_into(snap, from, &team)
}

fn hire_named(mut snap: Snapshot, from: u32, req: &Request) -> Response {
    let name = clip(req.name.trim(), 48);
    if snap.team.iter().any(|person| person.name.eq_ignore_ascii_case(&name)) {
        say(&mut snap, from, &format!("{name} is already on the team."));
        return ready(snap, from as i32);
    }
    let role = {
        let raw = req.role.trim();
        if raw.is_empty() {
            "Specialist".to_string()
        } else {
            clip(raw, 40)
        }
    };
    let focus = {
        let raw = req.message.trim();
        if raw.is_empty() {
            format!("Brought onto {} for the next task.", snap.business.name)
        } else {
            clip(raw, 160)
        }
    };
    let model = if req.model.trim().is_empty() {
        snap.business.model.clone()
    } else {
        normalize_model(&req.model)
    };
    let mut id = slug_id(&name);
    if id == "note" {
        id = format!("hire{}", snap.team.len() + 1);
    }
    let mut unique = id.clone();
    let mut n = 2u32;
    while snap.team.iter().any(|person| person.id == unique) {
        unique = format!("{id}-{n}");
        n += 1;
    }
    snap.team.push(Employee {
        id: unique,
        name: name.clone(),
        role: role.clone(),
        model,
        focus,
        lead: false,
    });
    let step = note_event(
        &mut snap,
        "Ada Voss",
        "handoff",
        &format!("Hired {name} as {role}. They are idle until the next task."),
        "",
    );
    say(
        &mut snap,
        step,
        &format!("{name} joined as {role}. I will hand them work on the next request."),
    );
    ready(snap, from as i32)
}

fn hire_into(mut snap: Snapshot, from: u32, team: &str) -> Response {
    let additions = staff(team, &snap.business.model);
    let mut added = Vec::new();
    for person in additions {
        if snap.team.iter().any(|e| e.id == person.id) {
            continue;
        }
        added.push(person.name.clone());
        snap.team.push(person);
    }
    if added.is_empty() {
        say(&mut snap, from, "That desk is already on the team.");
        return ready(snap, from as i32);
    }
    let names = added.join(", ");
    let step = note_event(&mut snap, "Ada Voss", "handoff", &format!("Hired {names} from the {team} desk."), "");
    say(&mut snap, step, &format!("{names} joined. They will pick up the next task you send."));
    ready(snap, from as i32)
}

fn fire(req: &Request) -> Response {
    let Some(snap) = req.state.clone() else {
        return fail("No team to change.".into());
    };
    let from = snap.log.len() as u32;
    let id = if req.employee_id.trim().is_empty() {
        fire_target(&req.message.to_ascii_lowercase(), &snap).unwrap_or_default()
    } else {
        req.employee_id.clone()
    };
    if id.is_empty() {
        return fail("Name the person to remove.".into());
    }
    fire_id(snap, from, &id)
}

fn fire_id(mut snap: Snapshot, from: u32, id: &str) -> Response {
    let Some(pos) = snap.team.iter().position(|e| e.id == id || e.name.to_ascii_lowercase() == id.to_ascii_lowercase()) else {
        say(&mut snap, from, "I could not find that person on the team.");
        return ready(snap, from as i32);
    };
    if snap.team[pos].lead {
        say(&mut snap, from, "I can reassign the lead, but I will not remove the only person who can approve work. Hire another lead first.");
        return ready(snap, from as i32);
    }
    let name = snap.team[pos].name.clone();
    let eid = snap.team[pos].id.clone();
    snap.team.remove(pos);
    for task in snap.tasks.iter_mut() {
        if task.owner == eid && task.column != "done" {
            task.owner = snap.team.iter().find(|e| e.lead).map(|e| e.id.clone()).unwrap_or_default();
        }
    }
    let step = note_event(&mut snap, "Ada Voss", "handoff", &format!("Removed {name} from the team. Open tasks moved back to the lead."), "");
    say(&mut snap, step, &format!("{name} is off the team."));
    ready(snap, from as i32)
}

fn generic_follow_up(snap: &mut Snapshot, from: u32, message: &str) {
    let slug = slug_id(message);
    let path = format!("notes/{slug}.md");
    let owner = snap.team.iter().find(|e| !e.lead).cloned();
    let owner_name = owner.as_ref().map(|e| e.name.clone()).unwrap_or_else(|| "Ada Voss".into());
    let owner_id = owner.as_ref().map(|e| e.id.clone()).unwrap_or_else(|| snap.team.first().map(|e| e.id.clone()).unwrap_or_default());
    let task_id = format!("t{}", snap.tasks.len() + 1);
    snap.tasks.push(Task {
        id: task_id.clone(),
        title: clip(message, 72),
        detail: "Follow-up from the lead chat. The local planner filed a note and a checklist. It did not call a model.".into(),
        owner: owner_id,
        column: "backlog".into(),
        moves: Vec::new(),
        artifact: path.clone(),
    });
    let step_do = {
        let s = next_step(snap);
        move_task(snap, &task_id, s, "doing");
        snap.log.push(LogEvent {
            step: s,
            actor: owner_name.clone(),
            kind: "think".into(),
            text: format!("Read the new request and filed it against {path}."),
            task_id: task_id.clone(),
        });
        s
    };
    let body = format!(
        "# Follow-up\n\nRequest: {message}\n\n## Checklist\n\n- Restate the change in one sentence.\n- Touch only the files that serve it.\n- Leave publish approval with the human.\n\nLocal planner note: this checklist is templated. Point the CLI at an OpenAI-compatible server you run yourself if you want a model to rewrite it.\n"
    );
    let step_write = next_step(snap);
    snap.files.push(FileNode {
        path: path.clone(),
        language: "markdown".into(),
        content: body,
        reveal_step: step_write,
    });
    snap.log.push(LogEvent {
        step: step_write,
        actor: owner_name,
        kind: "write".into(),
        text: format!("Wrote {path}."),
        task_id: task_id.clone(),
    });
    let step_rev = next_step(snap);
    move_task(snap, &task_id, step_rev, "review");
    snap.log.push(LogEvent {
        step: step_rev,
        actor: "Ada Voss".into(),
        kind: "review".into(),
        text: "Left the follow-up in review. Nothing is published.".into(),
        task_id: task_id,
    });
    reopen_approval(snap, step_rev);
    say(snap, step_rev, &format!("Filed “{}” and put it in review. The local planner does not invent a model’s answer — it records the job, the file, and the gate.", clip(message, 80)));
    let _ = (from, step_do);
}

fn compose(snap: &mut Snapshot, fresh: bool) {
    let _ = fresh;
    let kind = snap.seed.kind.clone();
    let plan = build_plan(snap);
    let files_spec = draft_files(snap);
    let tasks = build_tasks(snap);
    snap.plan = plan;
    snap.tasks = tasks;
    snap.files.clear();
    snap.log.clear();
    snap.messages.retain(|m| m.role == "user");
    snap.approvals.clear();
    snap.inbox.clear();

    // User brief is visible immediately.
    if snap.messages.is_empty() {
        snap.messages.push(Message {
            id: "m1".into(),
            from: "You".into(),
            role: "user".into(),
            body: snap.business.brief.clone(),
            at_step: 0,
        });
    }

    let lead = snap.team.iter().find(|e| e.lead).map(|e| e.name.clone()).unwrap_or_else(|| "Ada Voss".into());
    let open = match kind.as_str() {
        "bugfix" => format!("I read this as a bugfix on {}. We will reproduce it, patch the module, and stop before merge.", snap.seed.module),
        "marketing" => format!("I read this as a marketing job for {}. Positioning first, then a calendar you can actually post.", snap.seed.name),
        "research" => format!("I read this as a research brief. You will get a decision memo, not a fake launch."),
        "product" => format!("I read this as a product change for {}. The squad will scaffold the module and leave a review note.", snap.seed.name),
        _ => format!("I read this as a site for {}{}. First draft stays in this browser until you approve it.", snap.seed.name, city_phrase(&snap.seed.city)),
    };
    let step = note_event(snap, &lead, "think", &open, "");
    say(snap, step, &open);

    for task in snap.tasks.clone() {
        let actor = snap.team.iter().find(|e| e.id == task.owner).map(|e| e.name.clone()).unwrap_or_else(|| lead.clone());
        let s1 = next_step(snap);
        move_task(snap, &task.id, s1, "doing");
        snap.log.push(LogEvent {
            step: s1,
            actor: actor.clone(),
            kind: "read".into(),
            text: format!("Picked up “{}”. {}", task.title, task.detail),
            task_id: task.id.clone(),
        });
        if !task.artifact.is_empty() {
            if let Some(file) = files_spec.iter().find(|f| f.path == task.artifact) {
                let s2 = next_step(snap);
                snap.files.push(FileNode {
                    path: file.path.clone(),
                    language: file.language.clone(),
                    content: file.content.clone(),
                    reveal_step: s2,
                });
                snap.log.push(LogEvent {
                    step: s2,
                    actor: actor.clone(),
                    kind: "write".into(),
                    text: format!("Wrote {}.", file.path),
                    task_id: task.id.clone(),
                });
            }
        }
        let s3 = next_step(snap);
        let dest = if task.id == snap.tasks.last().map(|t| t.id.clone()).unwrap_or_default() {
            "review"
        } else {
            "done"
        };
        move_task(snap, &task.id, s3, dest);
        snap.log.push(LogEvent {
            step: s3,
            actor: actor,
            kind: if dest == "review" { "review".into() } else { "test".into() },
            text: if dest == "review" {
                format!("“{}” is ready for you.", task.title)
            } else {
                format!("Checked “{}” and moved on.", task.title)
            },
            task_id: task.id.clone(),
        });
    }

    // Any spec file not attached to a task still lands with the last write.
    for file in &files_spec {
        if snap.files.iter().any(|f| f.path == file.path) {
            continue;
        }
        let s = next_step(snap);
        snap.files.push(FileNode {
            path: file.path.clone(),
            language: file.language.clone(),
            content: file.content.clone(),
            reveal_step: s,
        });
        snap.log.push(LogEvent {
            step: s,
            actor: lead.clone(),
            kind: "write".into(),
            text: format!("Wrote {}.", file.path),
            task_id: String::new(),
        });
    }

    let reveal = snap.log.len() as u32;
    let (title, detail, risk) = match kind.as_str() {
        "bugfix" | "product" => (
            "Merge the local patch",
            "Approving marks the review done on this machine. OpenCTO does not push to GitHub.",
            "low",
        ),
        "marketing" | "research" => (
            "Accept the draft",
            "Approving freezes this version in your browser. Nothing is emailed or scheduled.",
            "low",
        ),
        _ => (
            "Publish the preview",
            "Approving marks the site published locally. There is no hosting account attached.",
            "medium",
        ),
    };
    snap.approvals.push(Approval {
        id: "gate-1".into(),
        title: title.into(),
        detail: detail.into(),
        risk: risk.into(),
        reveal_step: reveal,
        status: "pending".into(),
    });
    snap.inbox.push(Note {
        id: "in-1".into(),
        title: "Approval waiting".into(),
        body: detail.into(),
        kind: "approval".into(),
        reveal_step: reveal,
    });
    snap.inbox.push(Note {
        id: "in-0".into(),
        title: "Run started".into(),
        body: format!("Model profile {}. Team of {}.", snap.business.model, snap.team.len()),
        kind: "notice".into(),
        reveal_step: 1,
    });
    rerender(snap);
    // Keep file content in sync with the preview for the html file.
    if let Some(html_file) = snap.files.iter_mut().find(|f| f.path.ends_with(".html")) {
        html_file.content = snap.site_html.clone();
    } else if kind == "website" || kind == "marketing" {
        let s = snap.log.last().map(|e| e.step).unwrap_or(1);
        let html = snap.site_html.clone();
        snap.files.push(FileNode {
            path: "site/index.html".into(),
            language: "html".into(),
            content: html,
            reveal_step: s,
        });
    }
}

fn reopen_approval(snap: &mut Snapshot, step: u32) {
    if let Some(a) = snap.approvals.iter_mut().find(|a| a.id == "gate-1") {
        a.status = "pending".into();
        a.reveal_step = step;
        a.detail = "A newer draft replaced the one you may have reviewed.".into();
    }
    snap.published = false;
}

fn build_tasks(snap: &Snapshot) -> Vec<Task> {
    let ids: Vec<(String, bool)> = snap.team.iter().map(|e| (e.id.clone(), e.lead)).collect();
    let lead = ids.iter().find(|(_, l)| *l).map(|(id, _)| id.clone()).unwrap_or_else(|| ids.first().map(|(id, _)| id.clone()).unwrap_or_default());
    let nth = |n: usize| ids.get(n).map(|(id, _)| id.clone()).unwrap_or_else(|| lead.clone());
    let mut tasks = Vec::new();
    let mut push = |title: &str, detail: &str, owner: String, artifact: &str| {
        let id = format!("t{}", tasks.len() + 1);
        tasks.push(Task {
            id,
            title: title.into(),
            detail: detail.into(),
            owner,
            column: "backlog".into(),
            moves: Vec::new(),
            artifact: artifact.into(),
        });
    };
    match snap.seed.kind.as_str() {
        "bugfix" => {
            push("Reproduce the report", "Write down the failing condition before editing.", lead.clone(), "");
            push("Add a regression check", "A small test that fails on the old behavior.", nth(2), &format!("tests/{}.rs", snap.seed.module));
            push("Patch the module", "Bound the failure mode called out in the brief.", nth(1), &format!("src/{}.rs", snap.seed.module));
            push("Leave a merge gate", "Stop for a human before anything is called merged.", lead.clone(), "PLAN.md");
        }
        "marketing" => {
            push("State the position", "One sentence a neighbor would repeat.", lead.clone(), "plan/positioning.md");
            push("Draft the calendar", "Two weeks, three posts a week, no filler days.", nth(1), "plan/calendar.md");
            push("Write captions", "Short enough to post. Specific to the shop.", nth(1), "plan/captions.md");
            push("Hand it over", "Analyst notes what we did not measure.", nth(2), "PLAN.md");
        }
        "research" => {
            push("Frame the decision", "What would change if this memo is right.", lead.clone(), "notes/decision.md");
            push("List the unknowns", "Separate facts in the brief from guesses.", nth(1), "PLAN.md");
            push("Recommend a next build", "One concrete slice, not a platform.", lead.clone(), "");
        }
        "product" => {
            push("Slice the change", "Name the module and the non-goals.", lead.clone(), "PLAN.md");
            push("Scaffold the module", &format!("A {} draft for {}.", snap.seed.stack, snap.seed.module), nth(1), module_path(snap));
            push("Note the UI seam", "Where the export or feature shows up for a person.", nth(2), "");
            push("QA pass", "What the check covers and what it does not.", nth(3), &format!("tests/{}_test.md", snap.seed.module));
        }
        _ => {
            push("Name the offer", "Headline, city, and what a visitor can do.", lead.clone(), "PLAN.md");
            push("Draft the page", "One scrolling page. No fake accounts.", nth(2), "site/index.html");
            push("Check the facts", "City, name, and services match the brief.", nth(1), "");
            push("Ask to publish", "The preview is local until you approve it.", lead.clone(), "");
        }
    }
    if snap.seed.alloy {
        push("Second pass", "Expressive pass reviews the structured draft and merges wording.", nth(1), "");
    }
    if snap.business.model == "devstral" && snap.seed.kind != "bugfix" {
        push("Extra check", "Devstral profile adds a pass that reads like a test plan.", nth(2), "");
    }
    tasks
}

fn module_path(snap: &Snapshot) -> &'static str {
    match snap.seed.stack.as_str() {
        "typescript" => "src/feature.ts",
        "python" => "src/feature.py",
        "go" => "src/feature.go",
        _ => "src/feature.rs",
    }
}

struct DraftFile {
    path: String,
    language: String,
    content: String,
}

fn draft_files(snap: &Snapshot) -> Vec<DraftFile> {
    let mut files = Vec::new();
    let plan_md = snap_plan_md(snap);
    files.push(DraftFile { path: "PLAN.md".into(), language: "markdown".into(), content: plan_md });
    match snap.seed.kind.as_str() {
        "website" => {
            files.push(DraftFile {
                path: "site/index.html".into(),
                language: "html".into(),
                content: String::new(),
            });
        }
        "marketing" => {
            files.push(DraftFile {
                path: "plan/positioning.md".into(),
                language: "markdown".into(),
                content: format!("# Positioning\n\n{} should sound like this: {}.\n\nProof we will not invent: {}\n", snap.seed.name, snap.seed.subhead, snap.seed.proof),
            });
            files.push(DraftFile {
                path: "plan/calendar.md".into(),
                language: "markdown".into(),
                content: calendar_md(snap),
            });
            files.push(DraftFile {
                path: "plan/captions.md".into(),
                language: "markdown".into(),
                content: captions_md(snap),
            });
        }
        "research" => {
            files.push(DraftFile {
                path: "notes/decision.md".into(),
                language: "markdown".into(),
                content: format!("# Decision memo — {}\n\nBrief: {}\n\n## Recommendation\n\nShip the smallest slice that tests the offer. Do not staff a platform.\n\n## Unknowns\n\n- Demand is asserted, not measured.\n- The local planner did not browse the web.\n", snap.seed.name, snap.business.brief),
            });
        }
        _ => {
            files.push(code_file(snap));
            if snap.seed.kind == "bugfix" {
                files.push(DraftFile {
                    path: format!("tests/{}.rs", snap.seed.module),
                    language: "rust".into(),
                    content: test_stub(snap),
                });
            } else {
                files.push(DraftFile {
                    path: format!("tests/{}_test.md", snap.seed.module),
                    language: "markdown".into(),
                    content: format!("# Checks for {}\n\n- Module exports the behavior named in the brief.\n- Empty input is rejected.\n- Approval still sits with a human.\n", snap.seed.module),
                });
            }
        }
    }
    files
}

fn code_file(snap: &Snapshot) -> DraftFile {
    let module = &snap.seed.module;
    let brief = &snap.business.brief;
    match snap.seed.stack.as_str() {
        "typescript" => DraftFile {
            path: "src/feature.ts".into(),
            language: "typescript".into(),
            content: format!(
                "/**\n * {module} — local draft from OpenCTO.\n * Brief: {brief}\n */\nexport function run{camel}(input: string): string {{\n  const value = input.trim();\n  if (!value) throw new Error(\"empty input\");\n  return value;\n}}\n",
                camel = camel(module)
            ),
        },
        "python" => DraftFile {
            path: "src/feature.py".into(),
            language: "python".into(),
            content: format!("\"\"\"{module} — local draft from OpenCTO.\nBrief: {brief}\n\"\"\"\n\ndef run(value: str) -> str:\n    text = value.strip()\n    if not text:\n        raise ValueError(\"empty input\")\n    return text\n"),
        },
        "go" => DraftFile {
            path: "src/feature.go".into(),
            language: "go".into(),
            content: format!("package {module}\n\nimport \"errors\"\n\n// Run is a local draft. Brief: {brief}\nfunc Run(value string) (string, error) {{\n    if len(value) == 0 {{\n        return \"\", errors.New(\"empty input\")\n    }}\n    return value, nil\n}}\n"),
        },
        _ => {
            if snap.seed.kind == "bugfix" {
                DraftFile {
                    path: format!("src/{module}.rs"),
                    language: "rust".into(),
                    content: bugfix_rs(snap),
                }
            } else {
                DraftFile {
                    path: "src/feature.rs".into(),
                    language: "rust".into(),
                    content: format!(
                        "//! {module} — local draft from OpenCTO.\n//! Brief: {brief}\n\npub fn run(input: &str) -> Result<String, &'static str> {{\n    let value = input.trim();\n    if value.is_empty() {{\n        return Err(\"empty input\");\n    }}\n    Ok(value.to_string())\n}}\n\n#[cfg(test)]\nmod tests {{\n    use super::*;\n\n    #[test]\n    fn rejects_empty() {{\n        assert!(run(\"  \").is_err());\n    }}\n}}\n"
                    ),
                }
            }
        }
    }
}

fn bugfix_rs(snap: &Snapshot) -> String {
    let module = &snap.seed.module;
    format!(
        r#"//! {module} — patched locally by OpenCTO.
//! The previous path waited forever on a slow dependency.
//! This draft bounds the wait and refuses an empty idempotency key.

use std::time::Duration;

pub const TIMEOUT: Duration = Duration::from_secs(8);
pub const RETRIES: u8 = 2;

#[derive(Debug, PartialEq, Eq)]
pub enum Fail {{
    InvalidAmount,
    MissingKey,
    TimedOut,
}}

pub struct Client {{
    pub timeout: Duration,
    pub retries: u8,
}}

impl Default for Client {{
    fn default() -> Self {{
        Self {{ timeout: TIMEOUT, retries: RETRIES }}
    }}
}}

impl Client {{
    /// Charges are not retried. Reads could be. A hang is a timeout, not a success.
    pub fn charge(&self, amount_cents: u64, idempotency_key: &str) -> Result<String, Fail> {{
        if amount_cents == 0 {{
            return Err(Fail::InvalidAmount);
        }}
        if idempotency_key.trim().is_empty() {{
            return Err(Fail::MissingKey);
        }}
        if self.timeout.is_zero() {{
            return Err(Fail::TimedOut);
        }}
        Ok(format!("ok_{{}}", idempotency_key.trim()))
    }}
}}
"#
    )
}

fn test_stub(snap: &Snapshot) -> String {
    let module = &snap.seed.module;
    format!(
        r#"use crate::{module}::{{Client, Fail}};

#[test]
fn timeout_is_not_success() {{
    let mut client = Client::default();
    client.timeout = std::time::Duration::ZERO;
    let err = client.charge(1200, "key_1").unwrap_err();
    assert_eq!(err, Fail::TimedOut);
}}

#[test]
fn missing_key_is_rejected() {{
    let client = Client::default();
    assert_eq!(client.charge(1200, "  ").unwrap_err(), Fail::MissingKey);
}}
"#
    )
}

fn calendar_md(snap: &Snapshot) -> String {
    let name = &snap.seed.name;
    let label = &snap.seed.niche_label;
    format!(
        "# Calendar — {name}\n\nTwo weeks. Three posts. No daily guilt.\n\n## Week 1\n\n- Mon — What {label} actually means here, in one photo.\n- Wed — A process detail only this shop would know.\n- Fri — How to book or visit{city}.\n\n## Week 2\n\n- Mon — A customer's real constraint, handled.\n- Wed — The thing we do not offer, on purpose.\n- Fri — A quiet invitation, not a discount code.\n",
        city = city_phrase(&snap.seed.city)
    )
}

fn captions_md(snap: &Snapshot) -> String {
    format!(
        "# Captions — {}\n\n1. {} {}\n\n2. {}\n\n3. If you want this, the next step is small. Come in{}.\n",
        snap.seed.name,
        snap.seed.headline,
        snap.seed.subhead,
        snap.seed.proof,
        city_phrase(&snap.seed.city)
    )
}

fn snap_plan_md(snap: &Snapshot) -> String {
    let mut out = format!("# Plan — {}\n\n", snap.seed.name);
    for section in build_plan(snap) {
        out.push_str(&format!("## {}\n\n{}\n\n", section.heading, section.body));
    }
    out
}

fn build_plan(snap: &Snapshot) -> Vec<PlanSection> {
    let names = snap.team.iter().map(|e| format!("{} ({})", e.name, e.role)).collect::<Vec<_>>().join(", ");
    let mut sections = vec![
        PlanSection {
            heading: "What we heard".into(),
            body: snap.business.brief.clone(),
        },
        PlanSection {
            heading: "Offer".into(),
            body: format!("{}\n\n{}", snap.seed.headline, snap.seed.subhead),
        },
        PlanSection {
            heading: "Team".into(),
            body: format!("{names}. Profile: {}.", snap.business.model),
        },
        PlanSection {
            heading: "Stack".into(),
            body: format!(
                "{} for the draft. Kind: {}. Module: {}.",
                snap.seed.stack, snap.seed.kind, snap.seed.module
            ),
        },
        PlanSection {
            heading: "Risks".into(),
            body: "The local planner does not browse, bill, or push. Treat copy and code as a first draft with the facts you supplied. Approval stays manual.".into(),
        },
    ];
    if snap.seed.alloy {
        sections.push(PlanSection {
            heading: "Alloy merge".into(),
            body: format!(
                "Structured pass kept the section order. Expressive pass rewrote the headline to “{}”. Both sit in this one thread — no second vendor was called.",
                snap.seed.headline
            ),
        });
    }
    if snap.business.model == "deepseek" || snap.business.model == "kimi" {
        sections.push(PlanSection {
            heading: "Diagnosis".into(),
            body: "This profile spends the first pass on framing. If the brief is thin, the draft will say so instead of inventing a market.".into(),
        });
    }
    sections
}

fn rerender(snap: &mut Snapshot) {
    snap.site_html = render_preview(snap);
    snap.business.name = snap.seed.name.clone();
    snap.business.tagline = tagline_for(&snap.seed);
    snap.business.kind = snap.seed.kind.clone();
}

fn render_preview(snap: &Snapshot) -> String {
    match snap.seed.kind.as_str() {
        "website" | "marketing" => render_site(snap),
        _ => render_review(snap),
    }
}

struct Palette {
    id: &'static str,
    bg: &'static str,
    ink: &'static str,
    accent: &'static str,
    muted: &'static str,
    paper: &'static str,
}

const PALETTES: &[Palette] = &[
    Palette { id: "chalk", bg: "#f4f0e6", ink: "#1a1c16", accent: "#3d5a28", muted: "#5e6756", paper: "#fbf8f1" },
    Palette { id: "ink", bg: "#14171c", ink: "#f3efe4", accent: "#e2b15a", muted: "#b3ab9f", paper: "#1c2128" },
    Palette { id: "sea", bg: "#e6eef0", ink: "#102126", accent: "#0f5f5c", muted: "#4e6468", paper: "#f5fbfb" },
    Palette { id: "clay", bg: "#f6e7dc", ink: "#2a1814", accent: "#9a3b1e", muted: "#6f564c", paper: "#fff8f3" },
    Palette { id: "night", bg: "#141216", ink: "#f6f1ea", accent: "#ff6b4a", muted: "#c4b8b2", paper: "#1d1a20" },
];

fn palette(id: &str) -> &'static Palette {
    PALETTES.iter().find(|p| p.id == id).unwrap_or(&PALETTES[0])
}

fn render_site(snap: &Snapshot) -> String {
    let p = palette(&snap.seed.palette);
    let name = esc(&snap.seed.name);
    let headline = esc(&snap.seed.headline);
    let sub = esc(&snap.seed.subhead);
    let city = esc(&snap.seed.city);
    let proof = esc(&snap.seed.proof);
    let mut services = String::new();
    for service in &snap.seed.services {
        services.push_str(&format!(
            "<article><h3>{}</h3><p>{}</p></article>",
            esc(&service.title),
            esc(&service.body)
        ));
    }
    let mut extras = String::new();
    if snap.seed.extras.iter().any(|e| e == "pricing") {
        extras.push_str(&format!(
            "<section class=\"block\"><p class=\"kicker\">Pricing</p><h2>Straightforward.</h2><ul><li>Intro session — written quote after a look at the brief</li><li>Main offer — scoped, not a subscription you forget</li><li>Care plan — optional, for {}</li></ul></section>",
            esc(&snap.seed.niche_label)
        ));
    }
    if snap.seed.extras.iter().any(|e| e == "faq") {
        extras.push_str("<section class=\"block\"><p class=\"kicker\">FAQ</p><h2>Before you write.</h2><ul><li>How do I start? Send a note. A person answers.</li><li>Do you need an account? No.</li><li>Where does this run? On the machine you are using.</li></ul></section>");
    }
    if snap.seed.extras.iter().any(|e| e == "menu") {
        extras.push_str(&format!(
            "<section class=\"block\"><p class=\"kicker\">Menu</p><h2>What is on offer.</h2><ul>{}</ul></section>",
            snap.seed.services.iter().map(|s| format!("<li>{}</li>", esc(&s.title))).collect::<String>()
        ));
    }
    if snap.seed.extras.iter().any(|e| e == "journal") {
        extras.push_str("<section class=\"block\"><p class=\"kicker\">Journal</p><h2>A note from the bench.</h2><p>We publish when there is something to show, not on a cadence that makes the work worse.</p></section>");
    }
    let city_line = if snap.seed.city.is_empty() {
        "By appointment".into()
    } else {
        format!("In {city}")
    };
    format!(
        r#"<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{name}</title>
<style>
  :root {{ --bg:{bg}; --ink:{ink}; --accent:{accent}; --muted:{muted}; --paper:{paper}; }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--ink); font-family: Georgia, "Iowan Old Style", Palatino, serif; line-height:1.5; }}
  header, main, footer {{ width:min(880px, calc(100% - 32px)); margin:0 auto; }}
  header {{ display:flex; justify-content:space-between; gap:16px; align-items:baseline; padding:28px 0 12px; }}
  .mark {{ font-family: "Iowan Old Style", Palatino, serif; font-size:22px; letter-spacing:-0.03em; }}
  .loc {{ color:var(--muted); font-family: "Avenir Next", "Segoe UI", sans-serif; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; }}
  .hero {{ padding:28px 0 12px; }}
  h1 {{ font-size: clamp(40px, 7vw, 68px); line-height:0.95; font-weight:500; letter-spacing:-0.03em; margin:0 0 16px; }}
  .sub {{ font-family: "Avenir Next", "Segoe UI", sans-serif; font-size:18px; max-width:38rem; color:var(--ink); }}
  .kicker {{ font-family: "Avenir Next", "Segoe UI", sans-serif; letter-spacing:0.12em; text-transform:uppercase; font-size:12px; color:var(--accent); margin:0 0 8px; }}
  .grid {{ display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; padding:8px 0 20px; }}
  article, .block {{ background:var(--paper); border-radius:18px; padding:18px; }}
  article h3, .block h2 {{ margin:0 0 8px; font-weight:500; letter-spacing:-0.02em; }}
  article p, .block p, .block li {{ font-family: "Avenir Next", "Segoe UI", sans-serif; color:var(--ink); }}
  .proof {{ margin:8px 0 24px; padding-left:16px; border-left:3px solid var(--accent); font-size:20px; }}
  footer {{ padding:12px 0 40px; color:var(--muted); font-family: "Avenir Next", "Segoe UI", sans-serif; font-size:13px; }}
  a.cta {{ display:inline-block; margin-top:18px; background:var(--accent); color:var(--paper); text-decoration:none; padding:12px 16px; border-radius:999px; font-family: "Avenir Next", "Segoe UI", sans-serif; font-size:14px; }}
</style>
</head>
<body>
<header><div class="mark">{name}</div><div class="loc">{city_line}</div></header>
<main>
  <section class="hero"><p class="kicker">{label}</p><h1>{headline}</h1><p class="sub">{sub}</p><a class="cta" href='#visit'>Request a time</a></section>
  <section class="grid">{services}</section>
  <p class="proof">{proof}</p>
  {extras}
  <section class="block" id="visit"><p class="kicker">Visit</p><h2>Come as you are.</h2><p>Write with what you want made. We answer with a time, not a funnel.</p></section>
</main>
<footer>Draft preview from OpenCTO. Not published anywhere but this browser.</footer>
</body>
</html>"#,
        bg = p.bg,
        ink = p.ink,
        accent = p.accent,
        muted = p.muted,
        paper = p.paper,
        label = esc(&snap.seed.niche_label),
    )
}

fn render_review(snap: &Snapshot) -> String {
    let p = palette(&snap.seed.palette);
    let mut items = String::new();
    for file in &snap.files {
        items.push_str(&format!("<li><strong>{}</strong> · {}</li>", esc(&file.path), esc(&file.language)));
    }
    if items.is_empty() {
        items.push_str("<li>Files appear as the team writes them.</li>");
    }
    format!(
        r#"<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{name} review</title>
<style>
  body {{ margin:0; background:{bg}; color:{ink}; font-family: "Avenir Next", "Segoe UI", sans-serif; }}
  main {{ width:min(760px, calc(100% - 32px)); margin:0 auto; padding:36px 0 48px; }}
  .kicker {{ letter-spacing:0.14em; text-transform:uppercase; font-size:12px; color:{accent}; }}
  h1 {{ font-family: Georgia, Palatino, serif; font-weight:500; font-size:44px; letter-spacing:-0.03em; line-height:1; }}
  .card {{ background:{paper}; border-radius:16px; padding:16px 18px; }}
  li {{ margin:8px 0; }}
</style></head>
<body><main>
<p class="kicker">Review · {kind}</p>
<h1>{name}</h1>
<p>{headline}</p>
<div class="card"><p class="kicker">Draft files</p><ul>{items}</ul></div>
<p>Approve in headquarters to mark this review done. Nothing is pushed.</p>
</main></body></html>"#,
        name = esc(&snap.seed.name),
        headline = esc(&snap.seed.headline),
        kind = esc(&snap.seed.kind),
        bg = p.bg,
        ink = p.ink,
        accent = p.accent,
        paper = p.paper,
    )
}

fn empty_snapshot(brief: &str, seed: &Seed, model: &str) -> Snapshot {
    Snapshot {
        version: 1,
        runs: 0,
        business: Business {
            name: seed.name.clone(),
            tagline: tagline_for(seed),
            status: "running".into(),
            model: model.into(),
            kind: seed.kind.clone(),
            brief: brief.into(),
        },
        seed: seed.clone(),
        team: Vec::new(),
        tasks: Vec::new(),
        messages: Vec::new(),
        log: Vec::new(),
        files: Vec::new(),
        approvals: Vec::new(),
        plan: Vec::new(),
        inbox: Vec::new(),
        site_html: String::new(),
        published: false,
        settings: Settings::default(),
    }
}

fn tagline_for(seed: &Seed) -> String {
    if seed.city.is_empty() {
        seed.headline.clone()
    } else {
        format!("{} · {}", seed.headline, seed.city)
    }
}

fn staff(team: &str, model: &str) -> Vec<Employee> {
    let profile = if model == "local" { "local" } else { model };
    match team {
        "marketing" => vec![
            emp("ada", "Ada Voss", "Strategist", profile, "Positioning and the approval gate", true),
            emp("lena", "Lena Cho", "Writer", "qwen", "Captions and the calendar", false),
            emp("priya", "Priya Shah", "Analyst", "kimi", "What we can and cannot claim", false),
        ],
        "bugfix" => vec![
            emp("ada", "Ada Voss", "Technical lead", profile, "Keeps the patch reviewable", true),
            emp("nils", "Nils Okonkwo", "Backend", "devstral", "The module under test", false),
            emp("jules", "Jules Hart", "QA", "local", "The regression check", false),
        ],
        "engineering" => vec![
            emp("ada", "Ada Voss", "Technical lead", profile, "Slices the change", true),
            emp("nils", "Nils Okonkwo", "Backend", "devstral", "Scaffold and edge cases", false),
            emp("mira", "Mira Chen", "Frontend", "qwen", "Where a person sees the change", false),
            emp("jules", "Jules Hart", "QA", "local", "Checks that match the brief", false),
        ],
        "research" => vec![
            emp("ada", "Ada Voss", "Lead", profile, "The decision, stated plainly", true),
            emp("lena", "Lena Cho", "Writer", "kimi", "The memo", false),
        ],
        _ => vec![
            emp("ada", "Ada Voss", "Lead", profile, "Offer, scope, and the publish gate", true),
            emp("noor", "Noor El-Sayed", "Researcher", "kimi", "Facts from the brief, not the open web", false),
            emp("elena", "Elena Varga", "Web", "qwen", "The one-page draft", false),
        ],
    }
}

fn emp(id: &str, name: &str, role: &str, model: &str, focus: &str, lead: bool) -> Employee {
    Employee {
        id: id.into(),
        name: name.into(),
        role: role.into(),
        model: model.into(),
        focus: focus.into(),
        lead,
    }
}

struct Niche {
    id: &'static str,
    keys: &'static [&'static str],
    label: &'static str,
    headline: &'static str,
    sub: &'static str,
    services: [(&'static str, &'static str); 3],
    proof: &'static str,
}

fn niches() -> &'static [Niche] {
    &[
        Niche {
            id: "ceramic",
            keys: &["ceramic", "pottery", "clay", "kiln"],
            label: "Ceramic studio",
            headline: "Clay, fired slowly{city}.",
            sub: "Tableware and small commissions. You book a conversation before you book a kiln.",
            services: [
                ("Tableware", "Sets for daily use. Specified, not guessed from a moodboard."),
                ("Commissions", "A form you describe, a date we can keep."),
                ("Workshops", "Small groups. Hands in clay, not a lecture."),
            ],
            proof: "We would rather fire one honest batch than promise a catalog.",
        },
        Niche {
            id: "bakery",
            keys: &["bakery", "bread", "pastry", "hearth"],
            label: "Bakery",
            headline: "Bread with a schedule{city}.",
            sub: "A short menu. Baked when we said it would be.",
            services: [
                ("Loaves", "The everyday bread, named, priced, and gone when it is gone."),
                ("Pastry", "A few things in the morning. Not a vitrine of plastic."),
                ("Standing orders", "For the cafes that want the same loaf every day."),
            ],
            proof: "If it is not baked today, it is not on the shelf.",
        },
        Niche {
            id: "clinic",
            keys: &["clinic", "dental", "physio", "therapy", "doctor"],
            label: "Clinic",
            headline: "Care with a waiting list you can see{city}.",
            sub: "What we treat, how a first visit works, and who you will actually meet.",
            services: [
                ("First visit", "A clear intake. No portal homework before we have spoken."),
                ("Follow-up", "The plan from visit one, written down."),
                ("Referrals", "When it is not our work, we say so."),
            ],
            proof: "A first visit should explain itself before you arrive.",
        },
        Niche {
            id: "law",
            keys: &["law", "legal", "attorney", "solicitor"],
            label: "Practice",
            headline: "Counsel for a specific problem{city}.",
            sub: "We take matters we can name. We do not take everything.",
            services: [
                ("Consult", "A paid hour to see if the matter is ours."),
                ("Matters", "Scoped work, a responsible person, a written status."),
                ("Limits", "The areas we do not practice, listed on purpose."),
            ],
            proof: "If we cannot say who is responsible, we do not open the file.",
        },
        Niche {
            id: "software",
            keys: &["saas", "software", "app", "api", "billing", "ledger", "export", "checkout"],
            label: "Software",
            headline: "A smaller product, shipped on purpose{city}.",
            sub: "One workflow made legible. The rest can wait.",
            services: [
                ("The slice", "The change named in the brief, and nothing adjacent."),
                ("The seam", "Where a person notices it worked."),
                ("The gate", "A human approves before the word merge is used."),
            ],
            proof: "Scope is a list of non-goals as much as a list of files.",
        },
        Niche {
            id: "coffee",
            keys: &["coffee", "cafe", "espresso", "roaster"],
            label: "Coffee",
            headline: "A counter with a point of view{city}.",
            sub: "A short menu and a roasting note you can taste.",
            services: [
                ("Bar", "The drinks we will make the same way twice."),
                ("Beans", "What is on the shelf this week, and why."),
                ("Wholesale", "For the rooms that want our coffee without our furniture."),
            ],
            proof: "The menu is short because the bar is small.",
        },
    ]
}

fn parse_brief(brief: &str, team: &str, model: &str) -> Seed {
    let kind = infer_kind(brief, team);
    let niche = niches().iter().find(|n| n.keys.iter().any(|k| contains_word(brief, k))).unwrap_or(&niches()[4]);
    let city = extract_city(brief);
    let name = extract_name(brief).unwrap_or_else(|| generated_name(brief, niche.id));
    let city_bit = if city.is_empty() { String::new() } else { format!(" in {city}") };
    let headline = niche.headline.replace("{city}", &city_bit);
    let mut subhead = niche.sub.to_string();
    if model == "alloy" {
        subhead = format!("{subhead} Written twice, then merged.");
    }
    if model == "qwen" {
        subhead = niche.sub.split('.').next().unwrap_or(niche.sub).to_string() + ".";
    }
    let module = extract_module(brief);
    let stack = infer_stack(brief, kind);
    let palette = default_palette(niche.id, brief);
    Seed {
        name,
        city,
        niche: niche.id.into(),
        niche_label: niche.label.into(),
        kind: kind.into(),
        headline,
        subhead,
        services: niche.services.iter().map(|(t, b)| Service { title: (*t).into(), body: (*b).into() }).collect(),
        proof: niche.proof.into(),
        palette: palette.into(),
        extras: Vec::new(),
        stack: stack.into(),
        module,
        alloy: model == "alloy",
    }
}

fn infer_kind(brief: &str, team: &str) -> &'static str {
    let b = brief.to_ascii_lowercase();
    match team {
        "marketing" => return "marketing",
        "research" => return "research",
        "bugfix" => return "bugfix",
        "website" => return "website",
        "engineering" => {
            if looks_like_site(&b) && !looks_like_bug(&b) {
                return "website";
            }
            if looks_like_bug(&b) {
                return "bugfix";
            }
            return "product";
        }
        _ => {}
    }
    if looks_like_bug(&b) && !looks_like_site(&b) {
        "bugfix"
    } else if b.contains("calendar") || b.contains("campaign") || b.contains("caption") || b.contains("content") {
        "marketing"
    } else if b.contains("research") || b.contains("should we") || b.contains("memo") {
        "research"
    } else if looks_like_site(&b) {
        "website"
    } else {
        "product"
    }
}

fn looks_like_bug(b: &str) -> bool {
    ["bug", "fix", "flaky", "timeout", "regression", "broken", "ticket"].iter().any(|k| b.contains(k))
}
fn looks_like_site(b: &str) -> bool {
    ["site", "website", "landing", "studio", "shop", "bakery", "booking", "cafe", "clinic", "homepage"].iter().any(|k| b.contains(k))
}

fn infer_stack(brief: &str, kind: &str) -> &'static str {
    let b = brief.to_ascii_lowercase();
    if b.contains("typescript") || b.contains("react") || b.contains(" node") || b.contains("next.js") {
        "typescript"
    } else if b.contains("python") {
        "python"
    } else if b.contains("golang") || contains_word(&b, "go") {
        "go"
    } else if kind == "website" || kind == "marketing" || kind == "research" {
        "html"
    } else if b.contains("rust") || kind == "bugfix" || kind == "product" {
        "rust"
    } else {
        "rust"
    }
}

fn extract_module(brief: &str) -> String {
    let keys = ["checkout", "billing", "invoice", "export", "auth", "login", "session", "upload", "search", "cart", "ledger", "payment", "webhook"];
    let lower = brief.to_ascii_lowercase();
    for key in keys {
        if lower.contains(key) {
            return key.into();
        }
    }
    "service".into()
}

fn default_palette(niche: &str, brief: &str) -> &'static str {
    if let Some(p) = palette_from_text(&brief.to_ascii_lowercase()) {
        return p;
    }
    match niche {
        "ceramic" => "clay",
        "clinic" | "law" => "sea",
        "coffee" | "bakery" => "chalk",
        "software" => "ink",
        _ => "chalk",
    }
}

fn palette_from_text(lower: &str) -> Option<&'static str> {
    if lower.contains("green") || lower.contains("chalk") {
        Some("chalk")
    } else if lower.contains("dark") || lower.contains("black") || lower.contains("gold") {
        Some("ink")
    } else if lower.contains("blue") || lower.contains("teal") || lower.contains("sea") {
        Some("sea")
    } else if lower.contains("warm") || lower.contains("terracotta") || lower.contains("clay") || lower.contains("orange") {
        Some("clay")
    } else if lower.contains("night") || lower.contains("coral") || lower.contains("red") {
        Some("night")
    } else {
        None
    }
}

fn extra_from_text(lower: &str) -> Option<&'static str> {
    if lower.contains("pricing") || lower.contains("price") {
        Some("pricing")
    } else if lower.contains("faq") || lower.contains("questions") {
        Some("faq")
    } else if lower.contains("menu") {
        Some("menu")
    } else if lower.contains("journal") || lower.contains("blog") {
        Some("journal")
    } else {
        None
    }
}

fn extract_name(brief: &str) -> Option<String> {
    let lower = brief.to_ascii_lowercase();
    for key in ["called ", "named ", "name is ", "name: "] {
        if let Some(idx) = lower.find(key) {
            let rest = brief[idx + key.len()..].trim();
            let name = take_name(rest);
            if !name.is_empty() {
                return Some(name);
            }
        }
    }
    if let Some(start) = brief.find('"') {
        if let Some(end) = brief[start + 1..].find('"') {
            let name = brief[start + 1..start + 1 + end].trim();
            if !name.is_empty() {
                return Some(name.to_string());
            }
        }
    }
    None
}

fn take_name(rest: &str) -> String {
    let stop = [" in ", " for ", " with ", " that ", " which ", ".", ","];
    let lower = rest.to_ascii_lowercase();
    let mut end = rest.len();
    for s in stop {
        if let Some(i) = lower.find(s) {
            end = end.min(i);
        }
    }
    rest[..end].trim().trim_matches(|c: char| c == '"' || c == '\'').to_string()
}

fn extract_city(brief: &str) -> String {
    let name = extract_name(brief).unwrap_or_default();
    let bytes = brief.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_uppercase() && (i == 0 || !bytes[i - 1].is_ascii_alphanumeric()) {
            let start = i;
            i += 1;
            while i < bytes.len() && (bytes[i].is_ascii_alphanumeric() || bytes[i] == b'\'' || bytes[i] == b'-') {
                i += 1;
            }
            let word = &brief[start..i];
            if word != name && !name.starts_with(word) && !is_stop_cap(word) && start != 0 {
                // Prefer "in City"
                return word.to_string();
            }
        } else {
            i += 1;
        }
    }
    // "in lisbon" lowercase
    let lower = brief.to_ascii_lowercase();
    if let Some(idx) = lower.find(" in ") {
        let rest = brief[idx + 4..].trim();
        let city = rest.split_whitespace().next().unwrap_or("");
        let clean = city.trim_matches(|c: char| !c.is_ascii_alphanumeric());
        if !clean.is_empty() && !is_stop_cap(clean) && clean.chars().next().is_some_and(|c| c.is_alphabetic()) {
            if !["our", "the", "a", "an", "this", "my", "your"].contains(&clean.to_ascii_lowercase().as_str()) {
                return capitalize(clean);
            }
        }
    }
    String::new()
}

fn is_stop_cap(word: &str) -> bool {
    matches!(
        word,
        "A" | "I" | "The" | "And" | "For" | "With" | "Our" | "Rust" | "API" | "CSV" | "UI" | "QA" | "OpenCTO" | "GitHub"
    )
}

fn generated_name(brief: &str, niche: &str) -> String {
    let adj = ["North", "Little", "Bright", "Slow", "Kind", "Quiet", "Field", "Second"];
    let noun = match niche {
        "ceramic" => ["Kiln", "Clay", "Bench", "Wheel"],
        "bakery" => ["Hearth", "Crumb", "Oven", "Loaf"],
        "coffee" => ["Kettle", "Bar", "Bloom", "Cup"],
        "clinic" => ["Room", "Practice", "Hour", "Visit"],
        "law" => ["Brief", "Chambers", "Docket", "Margin"],
        _ => ["Ledger", "Yard", "Signal", "Atlas"],
    };
    let h = fnv(brief);
    format!("{} {}", adj[(h as usize) % adj.len()], noun[((h >> 8) as usize) % noun.len()])
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

fn contains_word(hay: &str, needle: &str) -> bool {
    hay.to_ascii_lowercase().split(|c: char| !c.is_ascii_alphanumeric()).any(|w| w == needle)
}

fn normalize_model(model: &str) -> String {
    let m = model.trim().to_ascii_lowercase();
    match m.as_str() {
        "alloy" | "local-alloy" => "alloy".into(),
        "qwen" => "qwen".into(),
        "devstral" => "devstral".into(),
        "deepseek" => "deepseek".into(),
        "kimi" => "kimi".into(),
        "" | "local" | "auto" => "local".into(),
        _ => "local".into(),
    }
}

fn normalize_team(team: &str, brief: &str) -> String {
    match team.trim().to_ascii_lowercase().as_str() {
        "website" => "website".into(),
        "engineering" => "engineering".into(),
        "bugfix" => "bugfix".into(),
        "marketing" => "marketing".into(),
        "research" => "research".into(),
        _ => infer_team(brief).into(),
    }
}

fn infer_team(brief: &str) -> &'static str {
    let b = brief.to_ascii_lowercase();
    if looks_like_bug(&b) {
        "bugfix"
    } else if b.contains("calendar") || b.contains("campaign") || b.contains("caption") || b.contains("content") {
        "marketing"
    } else if b.contains("research") || b.contains("memo") || b.contains("should we") {
        "research"
    } else if looks_like_site(&b) {
        "website"
    } else {
        "engineering"
    }
}

fn hire_target(lower: &str) -> Option<&'static str> {
    if !(lower.contains("hire") || lower.contains("add a ") || lower.contains("bring on")) {
        return None;
    }
    for (key, id) in [
        ("market", "marketing"),
        ("writer", "marketing"),
        ("engineer", "engineering"),
        ("bug", "bugfix"),
        ("qa", "bugfix"),
        ("research", "research"),
        ("web", "website"),
        ("site", "website"),
    ] {
        if lower.contains(key) {
            return Some(id);
        }
    }
    None
}

fn fire_target(lower: &str, snap: &Snapshot) -> Option<String> {
    if !(lower.contains("fire") || lower.contains("remove") || lower.contains("let go")) {
        return None;
    }
    snap.team.iter().find(|e| lower.contains(&e.name.to_ascii_lowercase()) || lower.contains(&e.id)).map(|e| e.id.clone())
}

fn rename_from(message: &str) -> Option<String> {
    let lower = message.to_ascii_lowercase();
    for key in ["rename to ", "call it ", "called ", "name it ", "rename the business to "] {
        if let Some(idx) = lower.find(key) {
            let name = take_name(message[idx + key.len()..].trim());
            if !name.is_empty() {
                return Some(name);
            }
        }
    }
    None
}

fn reason_from(message: &str) -> String {
    let trimmed = message.trim();
    let lower = trimmed.to_ascii_lowercase();
    if lower == "no" || lower == "reject" || lower == "reject it" || lower == "don't publish" {
        return String::new();
    }
    if let Some(rest) = lower.strip_prefix("reject") {
        let start = trimmed.len() - rest.len();
        let rest = trimmed[start..].trim().trim_start_matches(['-', ':', ',', ' ']).trim();
        return rest.to_string();
    }
    if lower.starts_with("don't publish") {
        let rest = trimmed["don't publish".len()..].trim().trim_start_matches(['-', ':', ',']).trim();
        return rest.to_string();
    }
    trimmed.to_string()
}

fn is_pause(message: &str) -> bool {
    let l = message.trim().to_ascii_lowercase();
    l == "pause" || l == "pause the team" || l == "pause the business" || l.starts_with("pause ")
}
fn is_resume(message: &str) -> bool {
    let l = message.trim().to_ascii_lowercase();
    l == "resume" || l == "unpause" || l.starts_with("resume ")
}

fn say(snap: &mut Snapshot, at_step: u32, body: &str) {
    snap.messages.push(Message {
        id: format!("m{}", snap.messages.len() + 1),
        from: "Ada Voss".into(),
        role: "lead".into(),
        body: body.into(),
        at_step,
    });
}

fn note_event(snap: &mut Snapshot, actor: &str, kind: &str, text: &str, task_id: &str) -> u32 {
    let step = next_step(snap);
    snap.log.push(LogEvent {
        step,
        actor: actor.into(),
        kind: kind.into(),
        text: text.into(),
        task_id: task_id.into(),
    });
    step
}

fn next_step(snap: &Snapshot) -> u32 {
    snap.log.last().map(|e| e.step + 1).unwrap_or(1)
}

fn move_task(snap: &mut Snapshot, id: &str, step: u32, column: &str) {
    if let Some(task) = snap.tasks.iter_mut().find(|t| t.id == id) {
        task.column = column.into();
        task.moves.push(Move { step, column: column.into() });
    }
}

fn city_phrase(city: &str) -> String {
    if city.is_empty() { String::new() } else { format!(" in {city}") }
}

fn clip(s: &str, n: usize) -> String {
    let t = s.split_whitespace().collect::<Vec<_>>().join(" ");
    if t.chars().count() <= n {
        return t;
    }
    t.chars().take(n.saturating_sub(1)).collect::<String>() + "…"
}

fn slug_id(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c.to_ascii_lowercase());
        } else if !out.ends_with('-') && !out.is_empty() {
            out.push('-');
        }
        if out.len() > 40 {
            break;
        }
    }
    let out = out.trim_matches('-').to_string();
    if out.is_empty() { "note".into() } else { out }
}

fn camel(s: &str) -> String {
    let mut out = String::new();
    let mut up = true;
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            if up {
                out.extend(c.to_uppercase());
                up = false;
            } else {
                out.push(c);
            }
        } else {
            up = true;
        }
    }
    out
}

fn esc(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => {
                o.push('&');
                o.push_str("amp;");
            }
            '<' => {
                o.push('&');
                o.push_str("lt;");
            }
            '>' => {
                o.push('&');
                o.push_str("gt;");
            }
            '"' => {
                o.push('&');
                o.push_str("quot;");
            }
            _ => o.push(c),
        }
    }
    o
}

fn fnv(s: &str) -> u32 {
    let mut h = 2_166_136_261u32;
    for b in s.as_bytes() {
        h ^= *b as u32;
        h = h.wrapping_mul(16_777_619);
    }
    h
}

#[cfg(test)]
mod tests {
    use super::*;

    fn launch_brief(brief: &str, team: &str, model: &str) -> Snapshot {
        let res = handle(Request {
            op: "launch".into(),
            brief: brief.into(),
            team: team.into(),
            model: model.into(),
            ..Request::default()
        });
        assert!(res.ok, "{:?}", res.error);
        res.snapshot.unwrap()
    }

    #[test]
    fn ceramic_studio_is_named_and_previewed() {
        let snap = launch_brief("A booking site for a Lisbon ceramic studio called Barro", "website", "alloy");
        assert_eq!(snap.business.name, "Barro");
        assert_eq!(snap.seed.city, "Lisbon");
        assert!(snap.site_html.contains("Lisbon"));
        assert!(snap.site_html.contains("Barro"));
        assert!(snap.team.len() >= 3);
        assert!(snap.files.iter().any(|f| f.path.ends_with("index.html")));
        assert!(snap.approvals.iter().any(|a| a.status == "pending"));
        assert!(snap.log.len() > 4);
        assert!(snap.seed.alloy);
    }

    #[test]
    fn bugfix_writes_rust() {
        let snap = launch_brief("Find and fix the flaky checkout timeout in our Rust API", "bugfix", "devstral");
        assert_eq!(snap.seed.kind, "bugfix");
        assert_eq!(snap.seed.module, "checkout");
        let code = snap.files.iter().find(|f| f.path == "src/checkout.rs").unwrap();
        assert!(code.content.contains("TimedOut"));
        assert!(snap.files.iter().any(|f| f.path.starts_with("tests/")));
    }

    #[test]
    fn follow_up_adds_pricing_without_losing_name() {
        let snap = launch_brief("A booking site for a Lisbon ceramic studio called Barro", "website", "local");
        let res = handle(Request {
            op: "chat".into(),
            message: "Add a pricing section and make it warmer".into(),
            state: Some(snap),
            ..Request::default()
        });
        let next = res.snapshot.unwrap();
        assert_eq!(next.business.name, "Barro");
        assert!(next.seed.extras.iter().any(|e| e == "pricing"));
        assert_eq!(next.seed.palette, "clay");
        assert!(next.site_html.contains("Pricing"));
        assert!(res.play_from >= 0);
    }

    #[test]
    fn approve_marks_published() {
        let snap = launch_brief("Plan a two-week content calendar for a neighborhood bakery called Hearth", "marketing", "kimi");
        assert_eq!(snap.business.name, "Hearth");
        let res = handle(Request {
            op: "approve".into(),
            state: Some(snap),
            ..Request::default()
        });
        let next = res.snapshot.unwrap();
        assert!(next.published);
        assert!(next.approvals.iter().all(|a| a.status != "pending"));
    }

    #[test]
    fn reject_records_a_reason() {
        let snap = launch_brief("A booking site for a Lisbon ceramic studio called Barro", "website", "local");
        let res = handle(Request {
            op: "reject".into(),
            message: "The headline could belong to any studio.".into(),
            state: Some(snap),
            ..Request::default()
        });
        let next = res.snapshot.expect("snapshot");
        assert!(next.approvals.iter().any(|a| a.status == "rejected"));
        assert!(!next.published);
        assert!(next.messages.iter().any(|m| m.body.contains("any studio")));
    }

    #[test]
    fn custom_hire_adds_one_person() {
        let snap = launch_brief("A booking site for a Lisbon ceramic studio called Barro", "website", "local");
        let before = snap.team.len();
        let res = handle(Request {
            op: "hire".into(),
            name: "Sam Iyer".into(),
            role: "Editor".into(),
            message: "Cuts the long sentences.".into(),
            state: Some(snap),
            ..Request::default()
        });
        let next = res.snapshot.expect("snapshot");
        assert_eq!(next.team.len(), before + 1);
        let sam = next.team.iter().find(|e| e.name == "Sam Iyer").unwrap();
        assert_eq!(sam.role, "Editor");
        assert!(!sam.lead);
        assert!(sam.focus.contains("sentences"));
    }

    #[test]
    fn does_not_treat_rust_as_a_city() {
        let snap = launch_brief("Find and fix the flaky checkout timeout in our Rust API", "bugfix", "local");
        assert_ne!(snap.seed.city, "Rust");
    }
}
