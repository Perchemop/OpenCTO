/**
 * Optional GitHub integration for OpenCTO (browser-only).
 *
 * Uses OAuth Device Flow (no client secret, no pasted PAT required).
 * Desks sync to a private Gist owned by the signed-in GitHub user.
 * Pure local mode still works with no GitHub connection.
 */

import type { DeskRecord } from "./store";

const LS_TOKEN = "opencto.github.token";
const LS_USER = "opencto.github.user";
const LS_GIST = "opencto.github.gist";
const LS_CLIENT = "opencto.github.clientId";
const LS_AUTO = "opencto.github.autoPush";
const LS_PULL = "opencto.github.pullOnOpen";
const GIST_FILENAME = "opencto-desks.json";

export type GitHubUser = { login: string; name?: string | null; avatar_url?: string };

export type GitHubSession = {
  token: string;
  user: GitHubUser;
  gistId: string | null;
};

type GistPayload = {
  version: 1;
  updatedAt: string;
  desks: DeskRecord[];
  activeId: string | null;
};

function envClientId(): string {
  try {
    return (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim() || "";
  } catch {
    return "";
  }
}

export function getClientId(): string {
  try {
    return localStorage.getItem(LS_CLIENT)?.trim() || envClientId();
  } catch {
    return envClientId();
  }
}

export function setClientId(id: string) {
  try {
    const v = id.trim();
    if (v) localStorage.setItem(LS_CLIENT, v);
    else localStorage.removeItem(LS_CLIENT);
  } catch {
    /* ignore */
  }
}

export function getAutoPush(): boolean {
  try {
    return localStorage.getItem(LS_AUTO) === "1";
  } catch {
    return false;
  }
}

export function setAutoPush(on: boolean) {
  try {
    if (on) localStorage.setItem(LS_AUTO, "1");
    else localStorage.removeItem(LS_AUTO);
  } catch {
    /* ignore */
  }
}

export function getPullOnOpen(): boolean {
  try {
    return localStorage.getItem(LS_PULL) === "1";
  } catch {
    return false;
  }
}

export function setPullOnOpen(on: boolean) {
  try {
    if (on) localStorage.setItem(LS_PULL, "1");
    else localStorage.removeItem(LS_PULL);
  } catch {
    /* ignore */
  }
}

export function loadSession(): GitHubSession | null {
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const userRaw = localStorage.getItem(LS_USER);
    if (!token || !userRaw) return null;
    const user = JSON.parse(userRaw) as GitHubUser;
    const gistId = localStorage.getItem(LS_GIST);
    return { token, user, gistId };
  } catch {
    return null;
  }
}

function saveSession(session: GitHubSession) {
  localStorage.setItem(LS_TOKEN, session.token);
  localStorage.setItem(LS_USER, JSON.stringify(session.user));
  if (session.gistId) localStorage.setItem(LS_GIST, session.gistId);
  else localStorage.removeItem(LS_GIST);
}

export function clearSession() {
  try {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_GIST);
  } catch {
    /* ignore */
  }
}

async function gh<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text.slice(0, 240) || res.statusText };
    }
    if (res.status === 204) return { ok: true, data: undefined as T };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export type DeviceStart = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

/** Start GitHub OAuth device flow. Requires a public OAuth App client id. */
export async function startDeviceFlow(
  clientId = getClientId(),
): Promise<{ ok: true; start: DeviceStart } | { ok: false; error: string }> {
  if (!clientId) {
    return {
      ok: false,
      error:
        "Add a GitHub OAuth App client id (Settings → Developer settings → OAuth Apps). Enable Device Flow. Only the public Client ID is needed — no secret.",
    };
  }
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      scope: "gist",
    });
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as DeviceStart & { error?: string; error_description?: string };
    if (!res.ok || data.error || !data.device_code) {
      return {
        ok: false,
        error: data.error_description || data.error || "Could not start GitHub device login",
      };
    }
    return { ok: true, start: data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reach GitHub" };
  }
}

/** Poll until the user completes device login or the code expires. */
export async function pollDeviceToken(
  deviceCode: string,
  intervalSec: number,
  clientId = getClientId(),
  signal?: AbortSignal,
): Promise<{ ok: true; session: GitHubSession } | { ok: false; error: string }> {
  const interval = Math.max(intervalSec, 5) * 1000;
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    if (signal?.aborted) return { ok: false, error: "Cancelled" };
    await new Promise((r) => setTimeout(r, interval));
    if (signal?.aborted) return { ok: false, error: "Cancelled" };
    try {
      const body = new URLSearchParams({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      });
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = (await res.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };
      if (data.access_token) {
        const userRes = await gh<GitHubUser>("/user", data.access_token);
        if (!userRes.ok) return { ok: false, error: userRes.error };
        const session: GitHubSession = {
          token: data.access_token,
          user: userRes.data,
          gistId: localStorage.getItem(LS_GIST),
        };
        saveSession(session);
        return { ok: true, session };
      }
      if (data.error === "authorization_pending" || data.error === "slow_down") continue;
      if (data.error === "expired_token") return { ok: false, error: "Code expired — try again" };
      if (data.error === "access_denied") return { ok: false, error: "Access denied on GitHub" };
      if (data.error) return { ok: false, error: data.error_description || data.error };
    } catch {
      /* retry */
    }
  }
  return { ok: false, error: "Timed out waiting for GitHub" };
}

function parseGistContent(raw: string): GistPayload | null {
  try {
    const data = JSON.parse(raw) as GistPayload;
    if (data?.version !== 1 || !Array.isArray(data.desks)) return null;
    return data;
  } catch {
    return null;
  }
}

async function findExistingGist(token: string): Promise<string | null> {
  for (let page = 1; page <= 3; page++) {
    const res = await gh<
      { id: string; files: Record<string, { filename?: string }> }[]
    >(`/gists?per_page=30&page=${page}`, token);
    if (!res.ok) break;
    for (const gist of res.data) {
      if (gist.files && GIST_FILENAME in gist.files) return gist.id;
    }
    if (res.data.length < 30) break;
  }
  return null;
}

function safeName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "desk"
  );
}

/** Extra human-readable files for the active desk (site preview + plan). */
function workspaceFiles(desks: DeskRecord[], activeId: string | null): Record<string, { content: string }> {
  const active = desks.find((d) => d.id === activeId) ?? desks[0];
  if (!active?.snapshot) return {};
  const snap = active.snapshot;
  const base = safeName(snap.business?.name || "desk");
  const files: Record<string, { content: string }> = {};
  if (snap.site_html?.trim()) {
    files[`${base}-site.html`] = { content: snap.site_html };
  }
  if (Array.isArray(snap.plan) && snap.plan.length > 0) {
    const md = snap.plan.map((section) => `## ${section.heading}\n\n${section.body}\n`).join("\n");
    files[`${base}-plan.md`] = { content: `# ${snap.business.name}\n\n${md}` };
  }
  // Cap individual file sizes for gist friendliness
  for (const [key, value] of Object.entries(files)) {
    if (value.content.length > 400_000) {
      files[key] = { content: value.content.slice(0, 400_000) + "\n\n/* truncated for gist size */\n" };
    }
  }
  return files;
}

/** Push desks to a private Gist. Creates one if needed. Also writes site/plan for the active desk. */
export async function pushDesksToGist(
  desks: DeskRecord[],
  activeId: string | null,
  session = loadSession(),
): Promise<{ ok: true; gistId: string; htmlUrl?: string } | { ok: false; error: string }> {
  if (!session) return { ok: false, error: "Connect GitHub first" };
  const payload: GistPayload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    desks,
    activeId,
  };
  const content = JSON.stringify(payload, null, 2);
  const files: Record<string, { content: string }> = {
    [GIST_FILENAME]: { content },
    ...workspaceFiles(desks, activeId),
  };
  let gistId = session.gistId || (await findExistingGist(session.token));

  if (gistId) {
    const res = await gh<{ id: string; html_url: string }>(`/gists/${gistId}`, session.token, {
      method: "PATCH",
      body: JSON.stringify({
        description: "OpenCTO desk backup (private)",
        files,
      }),
    });
    if (!res.ok) {
      if (res.error.includes("404") || res.error.includes("Not Found")) {
        gistId = null;
      } else {
        return { ok: false, error: res.error };
      }
    } else {
      const next = { ...session, gistId: res.data.id };
      saveSession(next);
      return { ok: true, gistId: res.data.id, htmlUrl: res.data.html_url };
    }
  }

  const created = await gh<{ id: string; html_url: string }>("/gists", session.token, {
    method: "POST",
    body: JSON.stringify({
      description: "OpenCTO desk backup (private)",
      public: false,
      files,
    }),
  });
  if (!created.ok) return { ok: false, error: created.error };
  saveSession({ ...session, gistId: created.data.id });
  return { ok: true, gistId: created.data.id, htmlUrl: created.data.html_url };
}

/** Pull desks from the linked (or discovered) private Gist. */
export async function pullDesksFromGist(
  session = loadSession(),
): Promise<{ ok: true; payload: GistPayload } | { ok: false; error: string }> {
  if (!session) return { ok: false, error: "Connect GitHub first" };
  const gistId = session.gistId || (await findExistingGist(session.token));
  if (!gistId) return { ok: false, error: "No OpenCTO backup gist found yet — push first" };

  const res = await gh<{
    id: string;
    files: Record<string, { content?: string; filename?: string }>;
  }>(`/gists/${gistId}`, session.token);
  if (!res.ok) return { ok: false, error: res.error };
  const file = res.data.files[GIST_FILENAME];
  if (!file?.content) return { ok: false, error: "Gist is missing opencto-desks.json" };
  const payload = parseGistContent(file.content);
  if (!payload) return { ok: false, error: "Backup file is not a valid OpenCTO export" };
  saveSession({ ...session, gistId: res.data.id });
  return { ok: true, payload };
}

/** Fire-and-forget push when auto-push is on and a session exists. */
export function maybeAutoPush(desks: DeskRecord[], activeId: string | null) {
  if (!getAutoPush() || !loadSession()) return;
  void pushDesksToGist(desks, activeId);
}
