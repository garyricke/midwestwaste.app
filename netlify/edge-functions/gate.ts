import type { Context } from "https://edge.netlify.com";

// Pre-launch password gate for midwestwaste.app. Branded cookie-session gate
// (same pattern as the consulting site). Remove this edge function — or set
// GATE_DISABLED=true — at go-live.
const PASSWORD = Netlify.env.get("GATE_PASSWORD") || "ilovegarbage";
const DISABLED = (Netlify.env.get("GATE_DISABLED") || "") === "true";
const COOKIE_NAME = "mwa_unlock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Paths that must NEVER be gated (machine callers that can't enter a password).
const BYPASS_PREFIXES = ["/api/webhook"];

const gateHtml = (error = "") => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Midwest Waste · Coming Soon</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: "Open Sans", system-ui, -apple-system, sans-serif;
    min-height: 100vh; display: grid; place-items: center; color: #fff;
    background:
      radial-gradient(900px 500px at 80% 10%, rgba(255,130,0,0.22), transparent 60%),
      radial-gradient(800px 600px at 12% 95%, rgba(20,40,73,0.85), transparent 55%),
      linear-gradient(180deg, #142849 0%, #1B365D 100%);
    padding: 24px; position: relative; overflow: hidden;
  }
  .gate {
    position: relative; z-index: 1; width: 100%; max-width: 460px; padding: 48px 44px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14);
    border-radius: 22px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 40px 100px rgba(0,0,0,0.45);
  }
  .brand {
    display: inline-flex; align-items: center; gap: 10px; font-family: "Montserrat", sans-serif;
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em;
    color: #FFC272; font-weight: 700; margin-bottom: 22px;
  }
  .brand::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #FF8200; box-shadow: 0 0 0 3px rgba(255,130,0,0.25); }
  h1 { font-family: "Montserrat", sans-serif; font-weight: 900; letter-spacing: -0.015em; font-size: clamp(1.8rem, 3.4vw, 2.2rem); line-height: 1.05; margin-bottom: 10px; }
  p.sub { color: rgba(255,255,255,0.72); font-size: 0.98rem; line-height: 1.5; margin-bottom: 28px; }
  form { display: flex; flex-direction: column; gap: 10px; }
  label { font-family: "Montserrat", sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(255,255,255,0.62); font-weight: 700; }
  .field { display: flex; gap: 8px; align-items: center; padding: 6px 6px 6px 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22); background: rgba(255,255,255,0.06); transition: border-color 200ms ease, background 200ms ease; }
  .field:focus-within { border-color: #FF8200; background: rgba(255,255,255,0.1); }
  input { flex: 1; padding: 12px 0; background: transparent; border: 0; color: #fff; font-size: 1rem; font-family: inherit; outline: none; }
  input::placeholder { color: rgba(255,255,255,0.45); }
  button { padding: 12px 22px; border-radius: 999px; background: #FF8200; color: #142849; border: 0; font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 0.92rem; letter-spacing: 0.04em; cursor: pointer; transition: transform 200ms ease, background 200ms ease; }
  button:hover { background: #ffffff; transform: translateY(-1px); }
  button:disabled { opacity: 0.7; cursor: progress; }
  form.loading .field { opacity: 0.85; }
  form.loading input { pointer-events: none; }
  .err { min-height: 1.4em; font-size: 0.86rem; color: #ffc7c7; padding-left: 4px; }
  .foot { margin-top: 26px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.12); font-family: "Montserrat", sans-serif; font-size: 0.72rem; color: rgba(255,255,255,0.55); line-height: 1.5; letter-spacing: 0.04em; text-transform: uppercase; }
</style>
</head>
<body>
  <main class="gate" role="main">
    <span class="brand">Midwest Waste · Online Ordering</span>
    <h1>Almost ready.</h1>
    <p class="sub">Our online dumpster ordering is in private preview. Enter the access phrase to continue.</p>
    <form method="POST" action="/_gate" autocomplete="off"
      onsubmit="var b=this.querySelector('button');b.textContent='Unlocking…';this.classList.add('loading');setTimeout(function(){b.disabled=true;},10);">
      <label for="pw">Access phrase</label>
      <div class="field">
        <input id="pw" type="password" name="password" autofocus required placeholder="••••••••••" />
        <button type="submit">Enter</button>
      </div>
      <p class="err" role="status" aria-live="polite">${error}</p>
    </form>
    <p class="foot">Prepared by Orbis Design · 2026</p>
  </main>
</body>
</html>`;

const htmlResponse = (status: number, body: string) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

const hasValidCookie = (request: Request): boolean => {
  const cookie = request.headers.get("cookie") || "";
  return cookie.split(";").some((c) => c.trim() === `${COOKIE_NAME}=${PASSWORD}`);
};

export default async (request: Request, context: Context) => {
  if (DISABLED) return context.next();

  const url = new URL(request.url);

  // Never gate machine callers (e.g. the Stripe webhook).
  if (BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    return context.next();
  }

  // Handle login submission.
  if (url.pathname === "/_gate" && request.method === "POST") {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const pw = (params.get("password") || "").trim();

    if (pw === PASSWORD) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": `${COOKIE_NAME}=${PASSWORD}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure; HttpOnly`,
        },
      });
    }
    return htmlResponse(401, gateHtml("That's not the phrase. Try again."));
  }

  // Already unlocked — pass through.
  if (hasValidCookie(request)) return context.next();

  // Locked — serve the gate page.
  return htmlResponse(200, gateHtml());
};

export const config = {
  path: "/*",
};
