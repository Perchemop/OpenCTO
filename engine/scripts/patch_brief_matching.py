#!/usr/bin/env python3
"""Improve OpenCTO planner brief matching after logic.rs is restored."""
from pathlib import Path
import re
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "engine/src/logic.rs")
text = path.read_text()
orig = text

text = text.replace(
    'fn looks_like_site(b: &str) -> bool {\n    ["site", "website", "landing", "studio", "shop", "bakery", "booking", "cafe", "clinic", "homepage"].iter().any(|k| b.contains(k))\n}',
    '''fn looks_like_site(b: &str) -> bool {
    [
        "site", "website", "landing", "studio", "shop", "bakery", "booking", "cafe", "clinic",
        "homepage", "web app", "webapp", "dashboard", "portal", "tracker", "tracking",
    ]
    .iter()
    .any(|k| b.contains(k))
}''',
)

old_infer = '''fn infer_kind(brief: &str, team: &str) -> &'static str {
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
}'''

new_infer = '''fn infer_kind(brief: &str, team: &str) -> &'static str {
    let b = brief.to_ascii_lowercase();
    // Brief wins over a sticky team picker when the ask is unambiguous.
    if looks_like_bug(&b) && !looks_like_site(&b) {
        return "bugfix";
    }
    if looks_like_site(&b)
        && !b.contains("calendar")
        && !b.contains("campaign")
        && !b.contains("caption")
    {
        // "weather tracking website" should not become a content calendar.
        return "website";
    }
    match team {
        "marketing" => return "marketing",
        "research" => return "research",
        "bugfix" => return "bugfix",
        "website" => return "website",
        "engineering" => {
            if looks_like_bug(&b) {
                return "bugfix";
            }
            return "product";
        }
        _ => {}
    }
    if b.contains("calendar") || b.contains("campaign") || b.contains("caption") || b.contains("content calendar") {
        "marketing"
    } else if b.contains("research") || b.contains("should we") || b.contains("memo") {
        "research"
    } else if looks_like_site(&b) {
        "website"
    } else {
        "product"
    }
}'''

if old_infer in text:
    text = text.replace(old_infer, new_infer)
else:
    print("WARN: infer_kind block not found exactly")

m = re.search(r"fn niches\(\) -> &'static \[Niche\] \{.*?\n\}\n\n", text, re.S)
if not m:
    m = re.search(r"fn niches\(\) -> &'static \[Niche\] \{.*?\n\}", text, re.S)
if not m:
    print("ERROR: niches not found")
    sys.exit(1)

new_niches = r'''fn niches() -> &'static [Niche] {
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
            id: "weather",
            keys: &["weather", "forecast", "climate", "temperature", "humidity", "radar", "meteorology"],
            label: "Weather product",
            headline: "Conditions you can check without noise{city}.",
            sub: "A tracker for the weather that matters to you — not a wall of widgets.",
            services: [
                ("Live conditions", "Temperature, wind, and the next few hours in one glance."),
                ("Forecast", "A short-range outlook written for a person, not a model card."),
                ("Alerts", "Only the warnings you asked to hear about."),
            ],
            proof: "If the number is not from a source we trust, it is not on the page.",
        },
        Niche {
            id: "tracking",
            keys: &["track", "tracking", "tracker", "monitor", "dashboard", "analytics", "metrics", "log"],
            label: "Tracking product",
            headline: "A tracker that stays narrow{city}.",
            sub: "Watch the numbers you named. Ignore the rest.",
            services: [
                ("The metric", "One primary number, labeled, with when it updates."),
                ("History", "A short trail so you can see change without a spreadsheet."),
                ("Export", "A clean file when you need the data offline."),
            ],
            proof: "Scope is the metric list, not a platform roadmap.",
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
'''

text = text[: m.start()] + new_niches + text[m.end() :]

old_parse = '''fn parse_brief(brief: &str, team: &str, model: &str) -> Seed {
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
}'''

new_parse = '''fn parse_brief(brief: &str, team: &str, model: &str) -> Seed {
    let kind = infer_kind(brief, team);
    let matched = niches()
        .iter()
        .find(|n| n.keys.iter().any(|k| contains_word(brief, k) || brief.to_ascii_lowercase().contains(k)));
    let city = extract_city(brief);
    let city_bit = if city.is_empty() { String::new() } else { format!(" in {city}") };
    let module = extract_module(brief);
    let stack = infer_stack(brief, kind);

    if let Some(niche) = matched {
        let name = extract_name(brief).unwrap_or_else(|| generated_name(brief, niche.id));
        let headline = niche.headline.replace("{city}", &city_bit);
        let mut subhead = niche.sub.to_string();
        if model == "alloy" {
            subhead = format!("{subhead} Written twice, then merged.");
        }
        if model == "qwen" {
            subhead = niche.sub.split('.').next().unwrap_or(niche.sub).to_string() + ".";
        }
        let palette = default_palette(niche.id, brief);
        return Seed {
            name,
            city,
            niche: niche.id.into(),
            niche_label: niche.label.into(),
            kind: kind.into(),
            headline,
            subhead,
            services: niche
                .services
                .iter()
                .map(|(t, b)| Service {
                    title: (*t).into(),
                    body: (*b).into(),
                })
                .collect(),
            proof: niche.proof.into(),
            palette: palette.into(),
            extras: Vec::new(),
            stack: stack.into(),
            module,
            alloy: model == "alloy",
        };
    }

    // No canned niche: build the desk from the brief itself.
    let topic = brief_topic(brief);
    let name = extract_name(brief).unwrap_or_else(|| generated_name(brief, "software"));
    let headline = format!("{topic}{city_bit}.");
    let mut subhead = format!("Built from your brief: {brief}");
    if subhead.len() > 160 {
        subhead = format!("A first draft for {topic}. Scope stays what you wrote.");
    }
    if model == "alloy" {
        subhead = format!("{subhead} Written twice, then merged.");
    }
    let services = brief_services(brief, kind);
    let proof = format!("This draft answers: {brief}");
    let palette = default_palette("software", brief);
    Seed {
        name,
        city,
        niche: "custom".into(),
        niche_label: topic.clone(),
        kind: kind.into(),
        headline,
        subhead,
        services,
        proof,
        palette: palette.into(),
        extras: Vec::new(),
        stack: stack.into(),
        module,
        alloy: model == "alloy",
    }
}

fn brief_topic(brief: &str) -> String {
    let cleaned = brief
        .trim()
        .trim_matches(|c: char| c == '.' || c == '!' || c == '?')
        .to_string();
    if cleaned.is_empty() {
        return "New product".into();
    }
    if cleaned.len() <= 48 {
        return cleaned;
    }
    let words: Vec<&str> = cleaned.split_whitespace().take(6).collect();
    words.join(" ")
}

fn brief_services(brief: &str, kind: &str) -> Vec<Service> {
    let b = brief.to_ascii_lowercase();
    let mut out = Vec::new();
    if b.contains("track") || b.contains("monitor") || b.contains("dashboard") {
        out.push(Service {
            title: "Tracking".into(),
            body: "The primary signal from the brief, shown clearly and updated honestly.".into(),
        });
    }
    if b.contains("weather") || b.contains("forecast") {
        out.push(Service {
            title: "Forecast".into(),
            body: "A short outlook people can use without a second tab.".into(),
        });
    }
    if b.contains("book") || b.contains("appoint") || b.contains("reserv") {
        out.push(Service {
            title: "Booking".into(),
            body: "A path from interest to a confirmed time.".into(),
        });
    }
    if kind == "website" || kind == "marketing" {
        out.push(Service {
            title: "Landing".into(),
            body: format!("States what this is, from the brief: {}", brief_topic(brief)),
        });
        out.push(Service {
            title: "Next step".into(),
            body: "One clear action — not a maze of links.".into(),
        });
    } else {
        out.push(Service {
            title: "Core slice".into(),
            body: format!("Implements the ask: {}", brief_topic(brief)),
        });
        out.push(Service {
            title: "Check".into(),
            body: "A human gate before anything is called done.".into(),
        });
    }
    if out.len() > 3 {
        out.truncate(3);
    }
    if out.is_empty() {
        out.push(Service {
            title: "Draft".into(),
            body: format!("First cut for: {}", brief_topic(brief)),
        });
    }
    out
}'''

if old_parse in text:
    text = text.replace(old_parse, new_parse)
else:
    print("WARN: parse_brief block not found exactly")

old_open = '''    let open = match kind.as_str() {
        "bugfix" => format!("I read this as a bugfix on {}. We will reproduce it, patch the module, and stop before merge.", snap.seed.module),
        "marketing" => format!("I read this as a marketing job for {}. Positioning first, then a calendar you can actually post.", snap.seed.name),
        "research" => format!("I read this as a research brief. You will get a decision memo, not a fake launch."),
        "product" => format!("I read this as a product change for {}. The squad will scaffold the module and leave a review note.", snap.seed.name),
        _ => format!("I read this as a site for {}{}. First draft stays in this browser until you approve it.", snap.seed.name, city_phrase(&snap.seed.city)),
    };'''

new_open = '''    let brief_snip = {
        let b = snap.business.brief.trim();
        if b.len() > 90 {
            format!("{}…", &b[..87])
        } else {
            b.to_string()
        }
    };
    let open = match kind.as_str() {
        "bugfix" => format!(
            "You asked: “{}”. I treat this as a bugfix on {}. Reproduce, patch, stop before merge.",
            brief_snip, snap.seed.module
        ),
        "marketing" => format!(
            "You asked: “{}”. Marketing desk for {} — positioning and a calendar you could post, scoped to that ask.",
            brief_snip, snap.seed.name
        ),
        "research" => format!(
            "You asked: “{}”. Research desk: a decision memo, not a fake launch.",
            brief_snip
        ),
        "product" => format!(
            "You asked: “{}”. Product change for {} — scaffold the module, leave a review note.",
            brief_snip, snap.seed.name
        ),
        _ => format!(
            "You asked: “{}”. Site desk for {}{}. First draft stays here until you approve it.",
            brief_snip,
            snap.seed.name,
            city_phrase(&snap.seed.city)
        ),
    };'''

if old_open in text:
    text = text.replace(old_open, new_open)
else:
    print("WARN: open message block not found")

old_gen = '''fn generated_name(brief: &str, niche: &str) -> String {
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
}'''

new_gen = '''fn generated_name(brief: &str, niche: &str) -> String {
    let adj = ["North", "Little", "Bright", "Slow", "Kind", "Quiet", "Field", "Second"];
    let noun = match niche {
        "ceramic" => ["Kiln", "Clay", "Bench", "Wheel"],
        "bakery" => ["Hearth", "Crumb", "Oven", "Loaf"],
        "coffee" => ["Kettle", "Bar", "Bloom", "Cup"],
        "clinic" => ["Room", "Practice", "Hour", "Visit"],
        "law" => ["Brief", "Chambers", "Docket", "Margin"],
        "weather" => ["Sky", "Gale", "Front", "Horizon"],
        "tracking" => ["Meter", "Trace", "Pulse", "Gauge"],
        _ => ["Ledger", "Yard", "Signal", "Atlas"],
    };
    let h = fnv(brief);
    format!("{} {}", adj[(h as usize) % adj.len()], noun[((h >> 8) as usize) % noun.len()])
}'''

if old_gen in text:
    text = text.replace(old_gen, new_gen)
else:
    print("WARN: generated_name not found")

if text == orig:
    print("ERROR: no changes applied")
    sys.exit(1)

path.write_text(text)
print(f"OK patched {path} ({len(orig)} -> {len(text)} bytes)")
