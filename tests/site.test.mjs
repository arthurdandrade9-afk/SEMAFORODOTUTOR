import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const htmlPath = path.join(root, "index.html");

assert.ok(fs.existsSync(htmlPath), "index.html precisa existir");
const html = fs.readFileSync(htmlPath, "utf8");

for (const id of ["inicio", "falha-padrao", "mecanismo", "demonstrativos", "conteudo", "bonus", "depoimentos", "faq", "oferta"]) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /mantenha a observação[\s\S]*Verde/i);
assert.match(html, /Amarelo[\s\S]*24[–-]48 horas/i);
assert.match(html, /Vermelho[\s\S]*imediatamente/i);
assert.match(html, /não substitui[\s\S]*atendimento veterinário/i);
assert.equal((html.match(/class="demo-card/g) || []).length, 20);
assert.equal((html.match(/class="bonus-card/g) || []).length, 6);
assert.match(html, /R\$\s*17/);
assert.match(html, /R\$\s*37/);
assert.match(html, /Google[\s\S]*pânico|pânico[\s\S]*Google/i);
assert.doesNotMatch(html, /id="responsabilidade"/);
assert.doesNotMatch(html, /data-testimonials-placeholder/);
assert.doesNotMatch(html, /section class="social-proof[^>]+hidden/);
assert.equal((html.match(/class="testimonial-slide/g) || []).length, 10);
assert.match(html, /data-testimonial-carousel/);
assert.match(html, /data-testimonial-track/);
assert.match(html, /class="hero-showcase"/);
assert.match(html, /assets\/images\/hero-mockup-completo\.webp/);
assert.match(html, /fetchpriority="high"/);
assert.match(html, /assets\/css\/styles\.css\?v=20261006-2/);
assert.match(html, /assets\/js\/main\.js\?v=20261006-2/);
assert.doesNotMatch(html, /class="product-page/);
assert.doesNotMatch(html, /class="hero-bonus-rack/);
assert.equal((html.match(/class="failure-card/g) || []).length, 4);

for (let index = 1; index <= 6; index += 1) {
  const file = `bonus-${String(index).padStart(2, "0")}.png`;
  assert.ok(
    fs.existsSync(path.join(root, "assets", "images", "bonus", file)),
    `${file} precisa existir`,
  );
}

assert.ok(
  fs.existsSync(path.join(root, "assets", "images", "hero-mockup-completo.webp")),
  "hero-mockup-completo.webp precisa existir",
);

for (let index = 1; index <= 10; index += 1) {
  const file = `testimonial-${String(index).padStart(2, "0")}.webp`;
  assert.ok(
    fs.existsSync(path.join(root, "assets", "images", "testimonials", file)),
    `${file} precisa existir`,
  );
}

for (let index = 1; index <= 4; index += 1) {
  const file = `failure-avatar-${String(index).padStart(2, "0")}.png`;
  assert.ok(
    fs.existsSync(path.join(root, "assets", "images", "failure", file)),
    `${file} precisa existir`,
  );
}

assert.ok(
  fs.existsSync(path.join(root, "assets", "js", "main.js")),
  "main.js precisa existir",
);

for (const match of html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)) {
  assert.ok(fs.existsSync(path.join(root, match[1])), `asset ausente: ${match[1]}`);
}

const cssPath = path.join(root, "assets", "css", "styles.css");
assert.ok(fs.existsSync(cssPath), "styles.css precisa existir");
const css = fs.readFileSync(cssPath, "utf8");
for (const token of ["--forest", "--ivory", "--gold", "--signal-green", "--signal-yellow", "--signal-red"]) {
  assert.ok(css.includes(token), `token ${token} ausente`);
}
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@media\s*\(max-width:\s*760px\)/);

console.log("site structure: ok");
