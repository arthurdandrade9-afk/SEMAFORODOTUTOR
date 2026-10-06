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
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await desktop.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });

  assert.equal(await desktop.locator("[data-demo-carousel]").count(), 1, "a galeria deve ser um carrossel");
  assert.equal(await desktop.locator(".demo-slide:not([data-demo-clone])").count(), 20, "o carrossel deve conter os vinte demonstrativos originais");

  const desktopLayout = await desktop.evaluate(() => {
    const track = document.querySelector("[data-demo-track]").getBoundingClientRect();
    const slides = [...document.querySelectorAll(".demo-slide:not([data-demo-clone])")].map((slide) => slide.getBoundingClientRect());
    return {
      visible: Math.round(track.width / (slides[0].width + 17)),
      status: document.querySelector("[data-demo-status]")?.textContent,
    };
  });
  assert.equal(desktopLayout.visible, 4, "o desktop deve exibir quatro demonstrativos completos por vez");
  assert.match(desktopLayout.status, /1 de 5/, "o desktop deve organizar os demonstrativos em cinco grupos");

  const initialPosition = await desktop.locator("[data-demo-track]").evaluate((track) => track.scrollLeft);
  await desktop.waitForTimeout(900);
  const movingPosition = await desktop.locator("[data-demo-track]").evaluate((track) => track.scrollLeft);
  assert.ok(movingPosition > initialPosition + 8, `os demonstrativos devem deslizar continuamente para o lado (${initialPosition} → ${movingPosition})`);

  await desktop.locator("[data-demo-carousel]").hover();
  await desktop.waitForTimeout(150);
  const pausedPosition = await desktop.locator("[data-demo-track]").evaluate((track) => track.scrollLeft);
  await desktop.waitForTimeout(500);
  const stillPausedPosition = await desktop.locator("[data-demo-track]").evaluate((track) => track.scrollLeft);
  assert.ok(Math.abs(stillPausedPosition - pausedPosition) < 2, "o movimento deve pausar enquanto o mouse estiver sobre o carrossel");

  await desktop.mouse.move(5, 5);
  await desktop.waitForTimeout(650);
  const resumedPosition = await desktop.locator("[data-demo-track]").evaluate((track) => track.scrollLeft);
  assert.ok(resumedPosition > stillPausedPosition + 5, "o movimento deve retomar suavemente após a interação");
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 540, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  const mobileLayout = await mobile.evaluate(() => {
    const track = document.querySelector("[data-demo-track]").getBoundingClientRect();
    const slides = [...document.querySelectorAll(".demo-slide:not([data-demo-clone])")].map((slide) => slide.getBoundingClientRect());
    return {
      visible: Math.round(track.width / (slides[0].width + 17)),
      status: document.querySelector("[data-demo-status]")?.textContent,
    };
  });
  assert.equal(mobileLayout.visible, 1, "o celular deve exibir um demonstrativo por vez");
  assert.match(mobileLayout.status, /1 de 20/, "o celular deve permitir navegar pelos vinte demonstrativos");
  await mobile.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("demo carousel behavior: ok");
