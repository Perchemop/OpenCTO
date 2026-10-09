import type { EngineResponse } from "./types";

type Exports = {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  dealloc: (ptr: number, len: number) => void;
  opencto_run: (ptr: number, len: number) => number;
};

export type Engine = {
  run: (request: unknown) => EngineResponse;
};

let pending: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  if (!pending) pending = init();
  return pending;
}

async function init(): Promise<Engine> {
  const response = await fetch("/engine/opencto.wasm");
  if (!response.ok) {
    pending = null;
    throw new Error("The Rust engine did not load.");
  }
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
  const exp = instance.exports as Exports;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return {
    run(request: unknown) {
      const input = encoder.encode(JSON.stringify(request));
      const ptr = exp.alloc(input.length);
      new Uint8Array(exp.memory.buffer).set(input, ptr);
      const out = exp.opencto_run(ptr, input.length);
      exp.dealloc(ptr, input.length);
      const view = new DataView(exp.memory.buffer);
      const len = view.getUint32(out, true);
      const json = decoder.decode(new Uint8Array(exp.memory.buffer).subarray(out + 4, out + 4 + len));
      exp.dealloc(out, 4 + len);
      return JSON.parse(json) as EngineResponse;
    },
  };
}
