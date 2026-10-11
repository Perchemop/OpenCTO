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

include!("logic_p1.inc");
include!("logic_p2.inc");
include!("logic_p3.inc");
include!("logic_p4.inc");
include!("logic_p5.inc");
