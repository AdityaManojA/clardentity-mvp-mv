// Answers CORS preflights on the API port, and nothing else.
//
// Playwright's page.route() intercepts the real API calls in every engine, but
// WebKit sends the CORS preflight (OPTIONS) for a cross-origin request with an
// Authorization header straight to the network, unrouted. With nothing on the
// port the preflight fails and WebKit never issues the request the mock would
// have answered. This stub lets the preflight pass; the request itself is
// still served by the mock. Any non-OPTIONS request reaching it means a test
// forgot to mock that call - it answers 501 to make that obvious.
//
// Started by playwright.config.ts (webServer). If a real backend is already on
// the port, Playwright reuses it instead, and its own CORS handles preflights.
import http from "node:http";

const port = Number(process.env.E2E_API_PORT ?? 8000);

http
  .createServer((req, res) => {
    const headers = {
      "access-control-allow-origin": req.headers.origin ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "authorization, content-type",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-max-age": "600",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, headers).end();
    } else if (req.url === "/health") {
      res.writeHead(200, { ...headers, "content-type": "application/json" }).end('{"status":"e2e-stub"}');
    } else {
      res.writeHead(501, { ...headers, "content-type": "application/json" })
        .end(JSON.stringify({ detail: `e2e preflight stub: ${req.method} ${req.url} was not mocked` }));
    }
  })
  .listen(port, () => console.log(`e2e preflight stub on :${port}`));
