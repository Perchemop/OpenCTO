import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Mark } from "@/components/opencto/mark";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: LoginRedirect,
});

/** Fallback if redirect is skipped — local product has no accounts. */
function LoginRedirect() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <div className="max-w-sm space-y-4 text-center">
        <Mark className="mx-auto size-8 text-accent" />
        <h1 className="font-serif text-2xl">No account needed</h1>
        <p className="text-sm text-muted">
          OpenCTO runs fully in your browser. Start a team from the home page — nothing to sign in for.
        </p>
        <Link to="/" className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink">
          Back home
        </Link>
      </div>
    </div>
  );
}
