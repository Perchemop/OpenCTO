use opencto::run_json;
use std::io::{self, Read, Write};

fn main() {
    let mut args = std::env::args().skip(1);
    match args.next().as_deref() {
        Some("catalog") => {
            println!("{}", run_json(r#"{"op":"catalog"}"#));
        }
        Some("run") => {
            let mut buf = String::new();
            io::stdin().read_to_string(&mut buf).expect("read stdin");
            println!("{}", run_json(&buf));
        }
        Some("version") => {
            println!("{}", opencto::VERSION);
        }
        _ => {
            let mut out = io::stdout();
            let _ = writeln!(
                out,
                "OpenCTO engine {version}\n\n\
                 A local planner for an AI-team headquarters. No network. No API key.\n\n\
                 Usage:\n  \
                 opencto catalog\n  \
                 opencto run < request.json\n  \
                 opencto version\n\n\
                 request.json: {{\"op\":\"launch\",\"brief\":\"...\",\"team\":\"website\",\"model\":\"local\"}}\n\
                 ops: catalog | launch | chat | approve | reject | pause | resume | hire | fire\n\
                 hire one person with {{\"op\":\"hire\",\"name\":\"Sam Iyer\",\"role\":\"Editor\",\"message\":\"Cuts long sentences.\"}}",
                version = opencto::VERSION
            );
        }
    }
}
