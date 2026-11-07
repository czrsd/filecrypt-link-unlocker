import { build, createServer, loadEnv } from 'vite';
import { readFile, writeFile, rm } from 'node:fs/promises';
import sharp from 'sharp';
import { minify } from 'html-minifier-terser';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const userscript = await readFile('../script.user.js', 'utf8');
const scriptVersion = userscript.match(/^\/\/\s*@version\s+(\S+)/m)?.[1];
let origin;
if (env.SITE_URL?.trim()) {
  const siteUrl = new URL(env.SITE_URL.trim());
  if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
    throw new Error('SITE_URL must be a bare HTTP(S) origin, without credentials, a path, query, or fragment.');
  }
  if (siteUrl.hostname === 'localhost' || siteUrl.hostname.endsWith('.localhost') || siteUrl.hostname.endsWith('.local') || /^127\./.test(siteUrl.hostname) || siteUrl.hostname === '[::1]') {
    throw new Error('SITE_URL must be the final public website origin. Leave it unset when reviewing locally.');
  }
  origin = siteUrl.origin;
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
  const appId = `${origin || ''}/#software`;
  const app = {
    '@type': ['SoftwareApplication', 'SoftwareSourceCode'], '@id': appId,
    name: 'FileCrypt Link Unlocker', applicationCategory: 'UtilitiesApplication',
    softwareVersion: scriptVersion,
    operatingSystem: 'Any with a compatible browser and userscript manager',
    description: 'A free FileCrypt userscript to extract container links, copy them individually or together, and export a TXT file.',
    ...(origin ? { url: `${origin}/`, image: `${origin}/filecrypt-link-unlocker.webp`, screenshot: `${origin}/filecrypt-preview.webp` } : {}),
    downloadUrl: 'https://greasyfork.org/en/scripts/548711-filecrypt-link-unlocker',
    codeRepository: 'https://github.com/czrsd/filecrypt-link-unlocker',
    license: 'https://github.com/czrsd/filecrypt-link-unlocker/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Cursed', url: 'https://github.com/czrsd' },
    featureList: ['Extract download links from FileCrypt containers', 'Copy individual links or the full list', 'Export links as a TXT file'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [app, ...(origin ? [
      { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'FileCrypt Link Unlocker', inLanguage: 'en' },
      { '@type': 'WebPage', '@id': `${origin}/#webpage`, url: `${origin}/`, name: 'FileCrypt Link Unlocker — Container Link Extractor Userscript', inLanguage: 'en', isPartOf: { '@id': `${origin}/#website` }, mainEntity: { '@id': appId }, primaryImageOfPage: { '@type': 'ImageObject', url: `${origin}/social.png`, width: 1200, height: 630 } },
    ] : [])],
  };
  const safeOrigin = origin?.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const urlMeta = origin ? `<link rel="canonical" href="${safeOrigin}/" />\n<meta property="og:url" content="${safeOrigin}/" />\n<meta property="og:image" content="${safeOrigin}/social.png" />\n<meta name="twitter:image" content="${safeOrigin}/social.png" />` : '';
  const meta = `${urlMeta}\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:image:alt" content="FileCrypt Link Unlocker — Straight to your links" />\n<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
  const rendered = render();
  const preloads = rendered.match(/<link\b[^>]*rel="preload"[^>]*>/g) || [];
  const content = rendered.replace(/<link\b[^>]*rel="preload"[^>]*>/g, '');
  await build({
    plugins: [{
      name: 'static-page',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          if (!html.includes('<div id="root"></div>') || !html.includes('/src/main.jsx')) throw new Error('The page template is missing its application entry.');
          return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`)
            .replace('/src/main.jsx', '/src/client.js')
            .replace('</head>', `${preloads.join('')}${meta}</head>`);
        },
      },
    }],
    build: { modulePreload: false, sourcemap: false, minify: 'oxc', cssMinify: true },
  });
  let html = await readFile('dist/index.html', 'utf8');
  for (const match of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"<>]+\.css)"[^>]*>/g)) {
    const css = await readFile(`dist${match[1]}`, 'utf8');
    html = html.replace(match[0], `<style>${css}</style>`);
    await rm(`dist${match[1]}`);
  }
  await writeFile('dist/index.html', await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    collapseBooleanAttributes: true,
    useShortDoctype: true,
    minifyCSS: { level: { 1: { specialComments: 0 } } },
  }));
  const logo = await sharp('public/filecrypt-link-unlocker.webp').resize(76, 76).png().toBuffer();
  await sharp('public/social.svg').composite([{ input: logo, left: 78, top: 66 }]).png({ compressionLevel: 9 }).toFile('dist/social.png');
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ''}`);
  if (origin) {
    await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${safeOrigin}/</loc></url></urlset>\n`);
  }
  console.log(origin ? `Pre-rendered indexable build for ${origin}; no deployment performed.` : 'Pre-rendered indexable build. Set SITE_URL to add canonical URLs and a sitemap. No deployment performed.');
} finally {
  await server.close();
}
