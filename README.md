# OpenCTO

A free, open-source headquarters for an AI team. You describe the work. A lead staffs a small desk, writes a plan and files, and stops at an approval. Keep more than one business, hire a named person, reject with a reason, and download the workspace.

**Local-first by default.** No account required. The planner is Rust WebAssembly in the browser. Work stays on this device until you export a zip — or optionally sync desks to a **private GitHub gist**.

OpenCTO is an independent reimplementation of the public [cto.new](https://cto.new) workflow (lead chat, employees, tasks, plan, preview, approvals). It is not affiliated with cto.new or Engine Labs.

## Live (free)

**https://perchemop.github.io/OpenCTO/**

### Phone

1. Open the link in Safari (iPhone) or Chrome (Android)
2. **Add to Home Screen** / **Install app**
3. Type a brief or tap an example chip → **Start the team**

### Optional GitHub sync

1. Create a GitHub **OAuth App** (Developer settings) and enable **Device Flow**
2. Copy only the public **Client ID** (no client secret)
3. In the app: **Headquarters → Settings → GitHub sync** → paste Client ID → **Connect GitHub**
4. Enter the one-time code on GitHub, then **Push desks** / **Pull desks**

Desks are stored as a private gist (`opencto-desks.json`). The OAuth token stays in this browser with the `gist` scope only. The planner still does not need model API keys.

You can also set `VITE_GITHUB_CLIENT_ID` at build time so users skip pasting the Client ID.

### One-time Pages setup (repo owner)

1. GitHub → **Settings** → **Pages** → **Source**: **GitHub Actions**
2. Push to `main` (or run **Deploy to GitHub Pages** under Actions)

Every push to `main` rebuilds the WASM engine and redeploys the static SPA.

## Run locally

```bash
npm install
npm run dev
```

Loads `public/engine/opencto.wasm` for the desk.

## Engine only

See [engine/README.md](engine/README.md).

```bash
cargo run --manifest-path engine/Cargo.toml -- catalog
```

## License

MIT. See [LICENSE](LICENSE).
