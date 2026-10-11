import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Mark } from "@/components/opencto/mark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-fg">
          <Mark className="size-6 text-accent" />
          <span className="font-serif text-xl tracking-tight">OpenCTO</span>
        </Link>
        <Link to="/" className="rounded-full px-3 py-2 text-sm text-muted hover:text-fg">
          Home
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-sm place-items-center px-4 pb-16 pt-10">
        <div className="w-full space-y-6 rounded-lg border border-line bg-surface p-6">
          <div>
            <p className="text-xs tracking-widest text-accent uppercase">Account</p>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Save your businesses across devices. The planner stays local in this browser — no API keys.
            </p>
          </div>

          {authEnabled ? (
            <div className="space-y-3">
              {GROK_PROVIDERS.map((p) => (
                <button
                  key={p.providerId}
                  type="button"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line bg-bg px-4 text-sm font-medium text-fg hover:border-accent"
                >
                  Continue with {p.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Sign-in is not available on this deploy yet.</p>
          )}

          <p className="text-xs leading-relaxed text-muted">
            You can still use OpenCTO without an account. Sign in only if you want desks synced to the cloud.
          </p>
        </div>
      </main>
    </div>
  );
}
