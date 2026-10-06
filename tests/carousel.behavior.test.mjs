import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };

const server = http.createServer((request, response) => {
  const relative = request.url === "/" ? "index.html" : request.url.split("?")[0].replace(/^\//, "");
  const file = path.join(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });

  const carousel = page.locator("[data-testimonial-carousel]");
  assert.equal(await carousel.count(), 1, "o carrossel real precisa estar presente");
  assert.equal(await page.locator(".testimonial-slide").count(), 10, "deve exibir dez provas reais");

  const widths = await page.evaluate(() => {
    const track = document.querySelector("[data-testimonial-track]");
    const first = document.querySelector(".testimonial-slide");
    return { track: track.clientWidth, slide: first.getBoundingClientRect().width };
  });
  assert.ok(Math.abs(widths.track - widths.slide) < 2, "somente uma prova deve ocupar o visor por vez");

  const trackBox = await page.locator("[data-testimonial-track]").boundingBox();
  await page.mouse.move(trackBox.x + trackBox.width * 0.78, trackBox.y + trackBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(trackBox.x + trackBox.width * 0.18, trackBox.y + trackBox.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector("[data-testimonial-status]")?.textContent.includes("2 de 10"));

  await page.locator("[data-testimonial-next]").click();
  await page.waitForFunction(() => document.querySelector("[data-testimonial-status]")?.textContent.includes("3 de 10"));

  await page.waitForTimeout(6200);
  assert.match(await page.locator("[data-testimonial-status]").textContent(), /4 de 10/, "deve avançar automaticamente a cada seis segundos");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("testimonial carousel behavior: ok");
