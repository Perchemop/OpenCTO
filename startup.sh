#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
if [ ! -f public/engine/opencto.wasm ]; then
  rustup target add wasm32-unknown-unknown
  cargo build --manifest-path engine/Cargo.toml --target wasm32-unknown-unknown --release --lib
  mkdir -p public/engine
  cp engine/target/wasm32-unknown-unknown/release/opencto.wasm public/engine/opencto.wasm
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
