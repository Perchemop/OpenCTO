import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { suggestions } from "@/lib/opencto/suggest";
import { useOpenCto } from "@/lib/opencto/store";
import { columnAt, TEAMS, type Employee, type Snapshot } from "@/lib/opencto/types";

export function Lead({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const send = useOpenCto((s) => s.send);
  const busy = useOpenCto((s) => s.busy);
  const [text, setText] = useState("");
  const messages = snapshot.messages.filter((message) => message.at_step <= step);
  const events = snapshot.log.filter((event) => event.step <= step);
  const latest = events[events.length - 1];
  const ideas = suggestions(snapshot, step);
  const timeline = [
    ...messages.map((message) => ({
      key: message.id,
      order: message.at_step * 10,
      kind: "message" as const,
      message,
    })),
    ...events.map((event) => ({
      key: `e${event.step}-${event.kind}`,
      order: event.step * 10 + 1,
      kind: "event" as const,
      event,
    })),
  ].sort((a, b) => a.order - b.order);

  function submit(next: string) {
    const value = next.trim();
    if (!value) return;
    setText("");
    void send(value);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-w-0 flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {timeline.map((item) =>
            item.kind === "message" ? (
              <li
                key={item.key}
                className={`max-w-prose rounded-lg px-4 py-3 text-sm leading-relaxed ${item.message.role === "user" ? "ml-auto bg-accent text-ink" : "mr-auto border border-line bg-surface text-fg"}`}
              >
                <p className="mb-1 text-xs tracking-wide uppercase opacity-70">{item.message.from}</p>
                {item.message.body}
              </li>
            ) : (
              <li key={item.key} className="mr-auto max-w-prose rounded-lg border border-line px-3 py-2 text-sm">
                <p className="text-xs tracking-wide text-accent uppercase">
                  {item.event.actor} · {item.event.kind}
                </p>
                <p className="mt-1 leading-relaxed">{item.event.text}</p>
              </li>
            ),
          )}
        </ul>
        <div className="flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={busy}
              onClick={() => submit(idea)}
              className="min-h-11 rounded-full border border-line px-3 text-left text-sm text-muted"
            >
              {idea}
            </button>
          ))}
        </div>
        <form
          className="sticky bottom-0 flex items-end gap-2 rounded-lg border border-line bg-surface p-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <label htmlFor="lead-message" className="sr-only">
            Message the lead
          </label>
          <textarea
            id="lead-message"
            rows={2}
            value={text}
            suppressHydrationWarning
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a pricing section, hire a writer, or pause."
            className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={busy || text.trim().length === 0}
            className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-ink disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      </section>
      <aside className="min-w-0 rounded-lg border border-line bg-surface p-4" aria-live="polite">
        <p className="text-xs tracking-widest text-accent uppercase">Floor</p>
        {latest ? (
          <>
            <p className="mt-2 font-medium">{latest.actor}</p>
            <p className="text-xs text-muted uppercase">{latest.kind}</p>
            <p className="mt-2 text-sm leading-relaxed">{latest.text}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Waiting for the first note.</p>
        )}
        <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto text-xs text-muted">
          {events.slice(-8).map((event) => (
            <li key={event.step}>
              <span className="text-fg">{event.actor}</span> · {event.text}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

export function Team({ snapshot, step }: { snapshot: Snapshot; step: number }) {
  const hire = useOpenCto((s) => s.hire);
  const hireCustom = useOpenCto((s) => s.hireCustom);
  const fire = useOpenCto((s) => s.fire);
  const busy = useOpenCto((s) => s.busy);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState("");
  const working = new Set(
    snapshot.tasks.filter((task) => columnAt(task, step) === "doing").map((task) => task.owner),
  );
  const lead = snapshot.team.find((person) => person.lead);
  const reports = snapshot.team.filter((person) => !person.lead);

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4">
      <h2 className="font-serif text-3xl">Org chart</h2>
      <p className="mt-1 text-sm text-muted">The lead delegates. Everyone else reports to them.</p>
      {lead ? (
        <div className="mx-auto mt-4 max-w-md">
          <PersonCard person={lead} working={working.has(lead.id)} busy={busy} />
          {reports.length > 0 ? <div className="mx-auto h-6 w-px bg-line" aria-hidden /> : null}
        </div>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {reports.map((person) => (
          <li key={person.id}>
            <PersonCard
              person={person}
              working={working.has(person.id)}
              busy={busy}
              onFire={() => void fire(person.id)}
            />
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-serif text-2xl">Hire one person</h2>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void hireCustom(name, role, focus);
          setName("");
          setRole("");
          setFocus("");
        }}
      >
        <label className="text-sm">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <label className="text-sm">
          Role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Editor"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Focus
          <input
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Cuts the long sentences"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-ink disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          Hire
        </button>
      </form>

      <h2 className="mt-8 font-serif text-2xl">Hire another desk</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {TEAMS.map((team) => (
          <li key={team.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{team.name}</p>
              <p className="text-sm text-muted">{team.detail}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void hire(team.id)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm"
            >
              Hire
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LocalTip() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem("opencto.tip.v1") !== "1";
    } catch {
      return true;
    }
  });
  if (!open) return null;
  return (
    <div className="flex flex-col gap-2 border-b border-line bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-muted">
        This desk is saved in <span className="text-fg">this browser only</span>. Download a workspace zip from
        commands (⌘K) when you want a backup. No account, no keys.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem("opencto.tip.v1", "1");
          } catch {
            /* ignore */
          }
          setOpen(false);
        }}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm"
      >
        Got it
      </button>
    </div>
  );
}

export function PersonCard({
  person,
  working,
  busy,
  onFire,
}: {
  person: Employee;
  working: boolean;
  busy: boolean;
  onFire?: () => void;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl">{person.name}</p>
          <p className="text-sm text-muted">
            {person.role}
            {person.lead ? " · lead" : ""}
          </p>
        </div>
        <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">
          {working ? "Working" : "Idle"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{person.focus}</p>
      <p className="mt-2 text-xs tracking-wide text-accent uppercase">{person.model}</p>
      {onFire ? (
        <button
          type="button"
          disabled={busy}
          onClick={onFire}
          className="mt-4 min-h-11 text-sm text-muted underline-offset-2 hover:underline"
        >
          Remove from team
        </button>
      ) : null}
    </article>
  );
}
