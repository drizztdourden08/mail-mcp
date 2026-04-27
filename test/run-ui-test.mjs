/**
 * Webview UI test harness using Playwright.
 *
 * Serves the webview dist via a local HTTP server with a mock VS Code API,
 * then navigates, clicks tabs, measures timings, and takes screenshots.
 *
 * Usage:  node test/run-ui-test.mjs
 * Output: test/screenshots/*.png
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const PORT = 9876;

// ── Tiny static file server ──────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".json": "application/json",
};

function serve(req, res) {
  let filePath = path.join(ROOT, req.url === "/" ? "test/harness.html" : req.url);
  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found: " + req.url);
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // Ensure screenshot dir
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Start server
  const server = http.createServer(serve);
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  console.log(`[harness] Serving on http://127.0.0.1:${PORT}`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 350, height: 600 },  // VS Code sidebar size
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push(text);
  });

  try {
    // ═════════════════════════════════════════════════════════
    // SCENARIO 1: Normal mode (fire-and-forget, fast responses)
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SCENARIO 1: Normal mode (fire-and-forget, 50ms IPC) ══");
    await page.goto(`http://127.0.0.1:${PORT}/test/harness.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".app", { timeout: 5000 });
    await sleep(600);

    console.log("[test] Taking screenshot: 01-normal-connect.png");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-normal-connect.png") });

    // Click Setup
    let t0 = Date.now();
    await page.click("text=Setup");
    try { await page.waitForSelector(".setup-view", { timeout: 5000 }); } catch {}
    let t1 = Date.now();
    console.log(`[test] Setup render: ${t1 - t0}ms`);
    await sleep(200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-normal-setup.png") });

    // Click Settings
    t0 = Date.now();
    await page.click("text=Settings");
    try { await page.waitForSelector(".settings-view", { timeout: 5000 }); } catch {}
    t1 = Date.now();
    console.log(`[test] Settings render: ${t1 - t0}ms`);

    // Click Connect
    t0 = Date.now();
    await page.click("text=Connect");
    await sleep(200);
    t1 = Date.now();
    console.log(`[test] Connect render: ${t1 - t0}ms`);

    // Rapid switching
    const tabs1 = ["Setup", "Settings", "Connect", "Setup", "Connect"];
    const times1 = [];
    for (const tab of tabs1) {
      const ts = Date.now();
      await page.click(`text=${tab}`);
      await sleep(50);
      times1.push({ tab, ms: Date.now() - ts });
    }
    console.log(`[test] Rapid: ${times1.map(s => `${s.tab}:${s.ms}ms`).join(", ")}`);

    // ═════════════════════════════════════════════════════════
    // SCENARIO 2: Serial mode (simulates the OLD bug: async queue)
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SCENARIO 2: Serial mode (OLD bug: async message queue, 50ms IPC) ══");
    await page.goto(`http://127.0.0.1:${PORT}/test/harness.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => { window.__serialMode = true; });
    await page.waitForSelector(".app", { timeout: 5000 });
    await sleep(600);

    t0 = Date.now();
    await page.click("text=Setup");
    try { await page.waitForSelector(".setup-view", { timeout: 8000 }); } catch { console.log("[test] WARNING: Setup did not render!"); }
    t1 = Date.now();
    console.log(`[test] Setup render (serial): ${t1 - t0}ms`);
    await sleep(200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-serial-setup.png") });

    // ═════════════════════════════════════════════════════════
    // SCENARIO 3: Slow IPC (simulates unresponsive MCP server)
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SCENARIO 3: Slow IPC (2s per call, fire-and-forget) ══");
    await page.goto(`http://127.0.0.1:${PORT}/test/harness.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => { window.__slowMode = true; });
    await page.waitForSelector(".app", { timeout: 5000 });
    await sleep(3000); // wait for slow ready response

    t0 = Date.now();
    await page.click("text=Setup");
    await sleep(3000); // wait for slow providers response
    t1 = Date.now();
    console.log(`[test] Setup render (slow IPC): ${t1 - t0}ms`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-slow-setup.png") });

    // Can we still switch tabs while providers load?
    t0 = Date.now();
    await page.click("text=Settings");
    try { await page.waitForSelector(".settings-view", { timeout: 2000 }); } catch {}
    t1 = Date.now();
    console.log(`[test] Settings render (during slow IPC): ${t1 - t0}ms`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-slow-settings.png") });

    // ═════════════════════════════════════════════════════════
    // SCENARIO 4: Auth polling (simulates auth-bridge sending auth-status every 2s)
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SCENARIO 4: Auth polling active ══");
    await page.goto(`http://127.0.0.1:${PORT}/test/harness.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".app", { timeout: 5000 });
    await sleep(600);
    await page.evaluate(() => { startAuthPolling(); });

    // Navigate to Setup, then wait to see if auth-status bounces us back
    await page.click("text=Setup");
    await sleep(500);
    const viewBefore = await page.evaluate(() => {
      return document.querySelector(".setup-view") ? "setup" : 
             document.querySelector(".login-view") ? "login" : "unknown";
    });
    console.log(`[test] View after clicking Setup: ${viewBefore}`);

    // Wait for an auth-status poll cycle
    await sleep(2500);
    const viewAfter = await page.evaluate(() => {
      return document.querySelector(".setup-view") ? "setup" :
             document.querySelector(".login-view") ? "login" : "unknown";
    });
    console.log(`[test] View after auth-status poll: ${viewAfter}`);
    const bounced = viewBefore === "setup" && viewAfter !== "setup";
    console.log(`[test] Auth-status bounced user: ${bounced ? "YES (BUG!)" : "No (correct)"}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-auth-polling.png") });

    // ═════════════════════════════════════════════════════════
    // SCENARIO 5: Realistic startup (server starts 2s after webview mount)
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SCENARIO 5: Realistic startup (server starts 2s late) ══");
    // Set flag BEFORE page loads so get-providers returns empty on first call
    await page.addInitScript(() => {
      window.__realisticStartup = true;
    });
    await page.goto(`http://127.0.0.1:${PORT}/test/harness.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".app", { timeout: 5000 });
    // Trigger delayed server start
    await page.evaluate(() => { simulateServerStart(); });
    await sleep(500);

    // Check state before server starts
    let hasProviders = await page.evaluate(() => document.querySelector(".provider-card") !== null);
    console.log(`[test] Providers visible before server start: ${hasProviders}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-before-server.png") });

    // Click Setup before server starts
    t0 = Date.now();
    await page.click("text=Setup");
    await sleep(200);
    let setupContent = await page.evaluate(() => document.querySelector(".setup-view")?.textContent ?? "NOT FOUND");
    console.log(`[test] Setup content before server: "${setupContent.slice(0, 80)}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-setup-no-server.png") });

    // Wait for server to start (2s) and push providers
    await sleep(2500);
    setupContent = await page.evaluate(() => document.querySelector(".setup-view")?.textContent ?? "NOT FOUND");
    console.log(`[test] Setup content after server push: "${setupContent.slice(0, 80)}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-setup-after-push.png") });

    // ═════════════════════════════════════════════════════════
    // Summary
    // ═════════════════════════════════════════════════════════
    console.log("\n══ SUMMARY ══");
    const outgoing = await page.evaluate(() => window.__outgoing.map(o => o.msg.type));
    console.log(`  Total outgoing messages: ${outgoing.length}`);
    console.log("  ✓ All screenshots saved to test/screenshots/");
    if (bounced) {
      console.log("  ✗ FAIL: Auth polling bounced user off Setup tab!");
    } else {
      console.log("  ✓ Auth polling did NOT bounce user off Setup tab");
    }

  } catch (err) {
    console.error("[test] ERROR:", err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "error.png") });
  } finally {
    await browser.close();
    server.close();
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch(console.error);
