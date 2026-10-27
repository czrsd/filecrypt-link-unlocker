import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';

function runBuild(siteUrl) {
  return spawnSync(process.execPath, ['scripts/build.mjs'], {
    encoding: 'utf8', env: { ...process.env, ...(siteUrl === undefined ? {} : { SITE_URL: siteUrl }) }, windowsHide: true,
  });
}

function checkedBuild(siteUrl) {
  const result = runBuild(siteUrl);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync('dist/index.html', 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('Turn a FileCrypt DLC container'));
  assert.equal((html.match(/<details\b/g) || []).length, 5);
  assert.ok(html.includes('Complete any CAPTCHA'));
  assert.ok(html.includes('data-nosnippet'));
  assert.ok(html.includes('id="screenshot-dialog"'));
  assert.ok(html.includes('/filecrypt-preview.webp 991w'));
  assert.ok(html.includes('<style>'));
  assert.doesNotMatch(html, /<!--|\/\*|rel="stylesheet"|\/src\/main\.jsx/);
  const scriptBytes = readdirSync('dist/assets').filter(name => name.endsWith('.js')).reduce((total, name) => total + statSync(`dist/assets/${name}`).size, 0);
  assert.ok(scriptBytes < 8192, `Unexpected client script size: ${scriptBytes}`);
  assert.ok(html.includes('name="robots" content="index,follow,max-image-preview:large"'));
  assert.doesNotMatch(html, /noindex/);
  assert.doesNotMatch(html, /chatgpt\.site|appgprj_/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.ok(schema['@graph'][0]['@type'].includes('SoftwareSourceCode'));
  assert.equal(schema['@graph'][0].softwareVersion, JSON.parse(readFileSync('src/project.json', 'utf8')).version);
  assert.ok(!schema['@graph'].some(item => item['@type'] === 'FAQPage' || item.aggregateRating));
  for (const [, fragment] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${fragment}"`), `Broken section link #${fragment}`);
  }
  return { html, schema };
}

try {
  const origin = 'https://filecrypt-seo.example';
  const { html, schema } = checkedBuild(origin);
  assert.ok(html.includes(`rel="canonical" href="${origin}/"`));
  assert.ok(html.includes('name="robots" content="index,follow,max-image-preview:large"'));
  assert.ok(readFileSync('dist/sitemap.xml', 'utf8').includes(`<loc>${origin}/</loc>`));
  assert.ok(readFileSync('dist/robots.txt', 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.equal(schema['@graph'].length, 3);
  for (const invalidUrl of ['https://filecrypt-seo.example/subpath', 'https://user:password@filecrypt-seo.example', 'http://127.0.0.1:5174']) {
    assert.notEqual(runBuild(invalidUrl).status, 0, `Accepted invalid SITE_URL: ${invalidUrl}`);
  }
  console.log('Public metadata, static content, and invalid-origin checks passed.');
  const fallback = checkedBuild('');
  assert.doesNotMatch(fallback.html, /rel="canonical"|filecrypt-seo\.example/);
  assert.equal(existsSync('dist/sitemap.xml'), false);
  assert.doesNotMatch(readFileSync('dist/robots.txt', 'utf8'), /Sitemap:/);
  assert.equal(fallback.schema['@graph'].length, 1);
  console.log('Domain-free indexable build checks passed.');
} finally {
  const restored = checkedBuild();
  assert.doesNotMatch(restored.html, /filecrypt-seo\.example/);
  console.log('Restored the configured production build. No upload or deployment.');
}
