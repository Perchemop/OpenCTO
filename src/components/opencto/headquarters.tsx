import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mark } from "@/components/opencto/mark";
import { Desk } from "@/components/opencto/hq-desk";
import { useOpenCto } from "@/lib/opencto/store";

export function Headquarters() {
  const [hydrated, setHydrated] = useState(false);
  const snapshot = useOpenCto((s) => s.snapshot);
  usePlayback();

  useEffect(() => {
    void useOpenCto.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p>Opening the desk…</p>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 bg-bg px-6 text-fg">
        <Mark className="size-8 text-accent" />
        <h1 className="font-serif text-4xl font-medium">No business on the desk</h1>
        <p className="text-muted">Start a team from the front door. The run stays in this browser.</p>
        <Link to="/" className="inline-flex min-h-11 w-fit items-center rounded-full bg-accent px-4 text-sm font-medium text-ink">
          Start a team
        </Link>
      </main>
    );
  }

  return <Desk snapshot={snapshot} />;
}

function usePlayback() {
  const playing = useOpenCto((s) => s.playing);
  const step = useOpenCto((s) => s.step);
  const len = useOpenCto((s) => s.snapshot?.log.length ?? 0);
  const advance = useOpenCto((s) => s.advance);
  const finishPlayback = useOpenCto((s) => s.finishPlayback);

  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || step >= len) {
      finishPlayback();
      return;
    }
    const timer = window.setTimeout(advance, 680);
    return () => window.clearTimeout(timer);
  }, [playing, step, len, advance, finishPlayback]);
}
