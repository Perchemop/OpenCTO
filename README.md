# OpenCTO

A free, open-source headquarters for an AI team. You describe the work. A lead staffs a small desk, writes a plan and files, and stops at an approval. The orchestrator is Rust. The desk runs in the browser via WebAssembly, or as a CLI. No account. No API key. No paid model.

OpenCTO is an independent reimplementation of the public [cto.new](https://cto.new) workflow (lead chat, employees, tasks, plan, preview, approvals). It is not affiliated with cto.new or Engine Labs.

## Run the desk

```bash
npm install
npm run dev
```

The app serves the headquarters and loads `public/engine/opencto.wasm`.

## Run only the engine

See [engine/README.md](engine/README.md).

```bash
cargo run --manifest-path engine/Cargo.toml -- catalog
```

## License

MIT. See [LICENSE](LICENSE).
