# opencto

Local-first orchestrator for [OpenCTO](../README.md). Rust library, CLI, and `cdylib` for WebAssembly. No network. No API key.

```bash
cargo test --manifest-path engine/Cargo.toml
cargo run --manifest-path engine/Cargo.toml -- catalog
cargo run --manifest-path engine/Cargo.toml -- run <<'JSON'
{"op":"launch","brief":"A booking site for a Lisbon ceramic studio called Barro","team":"website","model":"local"}
JSON
```

Operations: `catalog`, `launch`, `chat`, `approve`, `reject`, `pause`, `resume`, `hire`, `fire`.

`reject` may include `message` as the reason. `hire` with `name` and `role` adds one person instead of a whole desk.

Follow-up operations take the previous response's `snapshot` as `state`.

Model ids (`local`, `alloy`, `qwen`, `devstral`, `deepseek`, `kimi`) are planning profiles. They do not call those providers. Wire your own OpenAI-compatible server in a fork if you want weights in the loop — the browser build is the deterministic planner on purpose.

Browser build:

```bash
rustup target add wasm32-unknown-unknown
cargo build --manifest-path engine/Cargo.toml --target wasm32-unknown-unknown --release --lib
```

The artifact is `engine/target/wasm32-unknown-unknown/release/opencto.wasm`. Exports: `alloc`, `dealloc`, `opencto_run` (pointer to a little-endian `u32` length plus UTF-8 JSON).
