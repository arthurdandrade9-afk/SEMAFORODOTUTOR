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
const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await desktop.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });

  assert.equal(await desktop.locator("[data-demo-carousel]").count(), 1, "a galeria deve ser um carrossel");
  assert.equal(await desktop.locator(".demo-slide").count(), 20, "o carrossel deve conter os vinte demonstrativos");

  const desktopLayout = await desktop.evaluate(() => {
    const track = document.querySelector("[data-demo-track]").getBoundingClientRect();
    const slides = [...document.querySelectorAll(".demo-slide")].map((slide) => slide.getBoundingClientRect());
    return {
      visible: slides.filter((slide) => slide.left >= track.left - 1 && slide.right <= track.right + 1).length,
      status: document.querySelector("[data-demo-status]")?.textContent,
    };
  });
  assert.equal(desktopLayout.visible, 4, "o desktop deve exibir quatro demonstrativos completos por vez");
  assert.match(desktopLayout.status, /1 de 5/, "o desktop deve organizar os demonstrativos em cinco grupos");

  await desktop.locator("[data-demo-next]").click();
  await desktop.waitForFunction(() => document.querySelector("[data-demo-status]")?.textContent.includes("2 de 5"));
  await desktop.waitForTimeout(6200);
  assert.match(await desktop.locator("[data-demo-status]").textContent(), /3 de 5/, "o carrossel deve avançar a cada seis segundos");
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 540, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  const mobileLayout = await mobile.evaluate(() => {
    const track = document.querySelector("[data-demo-track]").getBoundingClientRect();
    const slides = [...document.querySelectorAll(".demo-slide")].map((slide) => slide.getBoundingClientRect());
    return {
      visible: slides.filter((slide) => slide.left >= track.left - 1 && slide.right <= track.right + 1).length,
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
