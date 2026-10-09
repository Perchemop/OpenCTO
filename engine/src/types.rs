use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Request {
    #[serde(default)]
    pub op: String,
    #[serde(default)]
    pub brief: String,
    #[serde(default)]
    pub message: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub team: String,
    #[serde(default)]
    pub employee_id: String,
    #[serde(default)]
    pub approval_id: String,
    #[serde(default)]
    pub state: Option<Snapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Response {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub snapshot: Option<Snapshot>,
    /// -1 keeps the caller's playback cursor. Otherwise show events with step <= play_from, then play forward.
    pub play_from: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub catalog: Option<Catalog>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Catalog {
    pub version: String,
    pub models: Vec<ModelInfo>,
    pub teams: Vec<TeamInfo>,
    pub prompts: Vec<PromptInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamInfo {
    pub id: String,
    pub name: String,
    pub detail: String,
    pub roles: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptInfo {
    pub team: String,
    pub model: String,
    pub brief: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub version: u32,
    pub runs: u32,
    pub business: Business,
    pub seed: Seed,
    pub team: Vec<Employee>,
    pub tasks: Vec<Task>,
    pub messages: Vec<Message>,
    pub log: Vec<LogEvent>,
    pub files: Vec<FileNode>,
    pub approvals: Vec<Approval>,
    pub plan: Vec<PlanSection>,
    pub inbox: Vec<Note>,
    pub site_html: String,
    pub published: bool,
    pub settings: Settings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Business {
    pub name: String,
    pub tagline: String,
    pub status: String,
    pub model: String,
    pub kind: String,
    pub brief: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Seed {
    pub name: String,
    pub city: String,
    pub niche: String,
    pub niche_label: String,
    pub kind: String,
    pub headline: String,
    pub subhead: String,
    pub services: Vec<Service>,
    pub proof: String,
    pub palette: String,
    pub extras: Vec<String>,
    pub stack: String,
    pub module: String,
    pub alloy: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Service {
    pub title: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub role: String,
    pub model: String,
    pub focus: String,
    pub lead: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub detail: String,
    pub owner: String,
    pub column: String,
    pub moves: Vec<Move>,
    pub artifact: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub step: u32,
    pub column: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub from: String,
    pub role: String,
    pub body: String,
    pub at_step: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub step: u32,
    pub actor: String,
    pub kind: String,
    pub text: String,
    pub task_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub path: String,
    pub language: String,
    pub content: String,
    pub reveal_step: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Approval {
    pub id: String,
    pub title: String,
    pub detail: String,
    pub risk: String,
    pub reveal_step: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanSection {
    pub heading: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub body: String,
    pub kind: String,
    pub reveal_step: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub repo: String,
    pub webhook: String,
    pub schedule: String,
    pub require_approval: bool,
    pub mcp: Vec<McpFlag>,
    pub secrets: Vec<Secret>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpFlag {
    pub id: String,
    pub label: String,
    pub detail: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Secret {
    pub key: String,
    pub value: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            repo: String::new(),
            webhook: String::new(),
            schedule: "off".into(),
            require_approval: true,
            mcp: vec![
                flag("files", "Files", "Read and write the workspace draft", true),
                flag("shell", "Shell", "Run checks inside the local planner", true),
                flag("git", "Git", "Prepare a review note. Nothing is pushed", false),
                flag("web", "Web", "No live browsing in the local planner", false),
                flag("calendar", "Calendar", "Draft a schedule. Nothing is sent", false),
            ],
            secrets: Vec::new(),
        }
    }
}

fn flag(id: &str, label: &str, detail: &str, enabled: bool) -> McpFlag {
    McpFlag {
        id: id.into(),
        label: label.into(),
        detail: detail.into(),
        enabled,
    }
}
