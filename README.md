# OpenCTO

A free, open-source headquarters for an AI team. You describe the work. A lead staffs a small desk, writes a plan and files, and stops at an approval. You can keep more than one business, hire a named person, reject with a reason, and download the workspace. The orchestrator is Rust. The desk runs in the browser via WebAssembly, or as a CLI. No account. No API key. No paid model.

OpenCTO is an independent reimplementation of the public [cto.new](https://cto.new) workflow (lead chat, employees, tasks, plan, preview, approvals). It is not affiliated with cto.new or Engine Labs.

## Live on GitHub Pages (free)

After the first successful Actions run the app is available at:

**https://perchemop.github.io/OpenCTO/**

### One-time setup (do this once)

1. Open the repository on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Push to `main` (or run the workflow manually under the **Actions** tab)

The workflow builds a pure static SPA and deploys it. Subsequent pushes to `main` update the site automatically.

### Use from your phone

1. Open https://perchemop.github.io/OpenCTO/ in Safari (iPhone) or Chrome (Android)
2. Tap **Share** → **Add to Home Screen** (iOS) or the install banner / menu → **Install app** (Android)
3. The desk now works like a native app. After the first load the Rust engine stays in the browser cache and works offline.

## Run locally

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
