import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal((html.match(/class="bonus-card"/g)||[]).length,5);
assert.doesNotMatch(html,/Velhice|seis bônus|6 bônus|6 Bônus/);
assert.equal((html.match(/class="bonus-preview"/g)||[]).length,5);
for(const match of html.matchAll(/src="(assets\/images\/bonus\/[^"?]+)/g)) {
 assert.ok(fs.existsSync(new URL('../'+match[1],import.meta.url)),match[1]);
}
console.log('Cinco bônus com demonstrativos reais e oferta coerente: OK');
