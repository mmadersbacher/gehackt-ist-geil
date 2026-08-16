import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";

function resolveChromium() {
  const base = join(homedir(), ".vscode/extensions");
  const dirs = readdirSync(base)
    .filter((d) => d.startsWith("danielsanmedium.dscodegpt-"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const root = join(base, dirs[dirs.length - 1], "standalone") + "/";
  const mod = createRequire(root)("patchright");
  return mod.chromium ?? mod.default.chromium;
}

const URL = "http://localhost:4321/gehackt-ist-geil/";
const DIR =
  "C:/Users/Home/AppData/Local/Temp/claude/C--Users-Home/87876560-b0f3-492f-ac4d-3c467bc518ba/scratchpad/gig-site";

const chromium = resolveChromium();
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];

async function shoot(name, width, height) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: "de-AT",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${name}: ${m.text().slice(0, 200)}`);
  });
  await page.goto(URL, { waitUntil: "load", timeout: 25000 });
  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in"))
  );
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${DIR}/shot-${name}.png`, fullPage: true });
  const diag = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const over = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        over.push(
          `${el.tagName}.${(el.className || "").toString().trim().split(/\s+/)[0]} L${Math.round(r.left)} R${Math.round(r.right)} w${Math.round(r.width)}`
        );
      }
    }
    return { vw, docScroll: document.documentElement.scrollWidth, over: over.slice(0, 12) };
  });
  await ctx.close();
  return { name, width, hscrollDoc: diag.docScroll > diag.vw + 1, vw: diag.vw, over: diag.over };
}

const out = [];
out.push(await shoot("desktop", 1440, 900));
out.push(await shoot("mobile", 390, 844));
await browser.close();
console.log(JSON.stringify({ out, errors }, null, 2));
