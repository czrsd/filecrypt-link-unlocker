# FileCrypt Link Unlocker website

A Vite + React one-pager with Tailwind CSS, a shadcn/ui Button, outline Lucide icons, and system typography. The production origin is configured as `https://filecrypt.czrsd.com` in `.env.production`.

```sh
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:5174/ to review the pre-rendered production output. For live source editing, use `npm run dev` at http://127.0.0.1:5173/.

## Put it on your server

Upload the contents of `dist/` after running `npm run build`. The build command creates the files locally; upload them to your server separately.

Serve `dist/` at the domain root. Keep the existing `/upload-dlc` API route working when configuring your web server. Serve missing static paths with a real 404, enable compression, and cache hashed assets for a long time.

If the public origin changes, update `.env.production` before rebuilding. `SITE_URL` can also be overridden through an environment variable. It must be a bare public HTTP(S) origin, without credentials, a path, query, or fragment.

## Content and maintenance

The build renders the page into HTML. The visible userscript version comes from `src/project.json`; the build checks it against `../script.user.js` to catch stale version information. Update that JSON when releasing a new userscript version.

Troubleshooting topics have stable fragment links. Following a help link opens its answer. Native disclosure controls work without JavaScript. The screenshot is served locally and opens in a larger dialog with keyboard and reduced-motion support. The website itself does not extract container links; its installation and issue links lead to the project.
