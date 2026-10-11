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
        task.moves.push(Move {
            step,
            column: column.into(),
        });
    }
}

fn clip(s: &str, max: usize) -> String {
    let t = s.trim();
    if t.chars().count() <= max {
        return t.to_string();
    }
    let mut out: String = t.chars().take(max.saturating_sub(1)).collect();
    out.push('…');
    out
}

fn slug_id(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c.to_ascii_lowercase());
        } else if !out.ends_with('-') && !out.is_empty() {
            out.push('-');
        }
    }
    out.trim_matches('-').to_string()
}

fn esc(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
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
        res.snapshot.expect("snapshot")
    }

    #[test]
    fn catalog_lists_profiles() {
        let cat = catalog();
        assert!(!cat.models.is_empty());
        assert!(!cat.teams.is_empty());
    }

    #[test]
    fn website_launch_has_site_html() {
        let snap = launch_brief(
            "A booking site for a Lisbon ceramic studio called Barro",
            "website",
            "local",
        );
        assert_eq!(snap.business.name, "Barro");
        assert!(!snap.site_html.is_empty());
        assert!(!snap.plan.is_empty());
        assert!(!snap.team.is_empty());
    }

    #[test]
    fn chat_can_add_pricing_and_palette() {
        let snap = launch_brief(
            "A booking site for a Lisbon ceramic studio called Barro",
            "website",
            "local",
        );
        let res = handle(Request {
            op: "chat".into(),
            message: "Add pricing and switch to the clay palette".into(),
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
