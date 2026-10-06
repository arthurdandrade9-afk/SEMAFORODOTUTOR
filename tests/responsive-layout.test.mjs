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
  for (const viewport of [
    { width: 1440, height: 960 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.fonts.status === "loaded");

    const layout = await page.evaluate(() => {
      const rect = (selector) => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width };
      };
      const mockup = document.querySelector(".hero-showcase > img");
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        hero: rect(".hero"),
        copy: rect(".hero__copy"),
        showcase: rect(".hero-showcase"),
        cta: rect(".hero .button"),
        mockupWidth: mockup.naturalWidth,
        mockupHeight: mockup.naturalHeight,
      };
    });

    assert.ok(layout.documentWidth <= layout.viewportWidth, `${viewport.width}px não deve ter rolagem horizontal`);
    for (const [name, box] of Object.entries({ hero: layout.hero, copy: layout.copy, showcase: layout.showcase, cta: layout.cta })) {
      assert.ok(box.left >= -1, `${name} começa fora da tela em ${viewport.width}px`);
      assert.ok(box.right <= layout.viewportWidth + 1, `${name} termina fora da tela em ${viewport.width}px`);
    }
    assert.deepEqual([layout.mockupWidth, layout.mockupHeight], [1536, 1024], "o hero deve usar o mockup final sem corte");

    await page.locator("#depoimentos").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".testimonial-slide img")?.naturalWidth > 0);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("responsive layout: ok");
