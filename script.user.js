// ==UserScript==
// @name                 FileCrypt Auto-Bypass & Decrypter (Link Extractor) [2026]
// @name:de              FileCrypt Auto-Bypass & Entschlüsseler (Link Extractor) [2026]
// @name:fr              FileCrypt Auto-Bypass & Déchiffreur (Extracteur de liens) [2026]
// @name:es              FileCrypt Auto-Bypass & Descifrador (Extractor de enlaces) [2026]
// @name:it              FileCrypt Auto-Bypass & Decrittatore (Estrattore di link) [2026]
// @name:ru              FileCrypt Авто-обход и дешифратор (Экстрактор ссылок) [2026]
// @name:zh-CN           FileCrypt 自动绕过与解密器 (链接提取器) [2026]
// @namespace            https://github.com/czrsd/filecrypt-link-unlocker
// @version              2.0.0
// @description          Extract original download links from Filecrypt containers. Copy links to JDownloader, export TXT, and manage mirrors or episodes in a clean interface.
// @description:de       Extrahiert Original-Download-Links aus Filecrypt-Containern. Links für JDownloader kopieren, als TXT exportieren und Spiegel oder Folgen übersichtlich auswählen.
// @description:fr       Extrait les liens de téléchargement des conteneurs Filecrypt. Copie pour JDownloader, export TXT et sélection des miroirs ou épisodes dans une interface claire.
// @description:es       Extrae enlaces de descarga de contenedores Filecrypt. Copia para JDownloader, exportación TXT y selección de mirrors o episodios en una interfaz clara.
// @description:it       Estrae i link di download dai contenitori Filecrypt. Copia per JDownloader, esportazione TXT e selezione di mirror o episodi in un’interfaccia semplice.
// @description:ru       Извлекает ссылки на скачивание из контейнеров Filecrypt. Копирование для JDownloader, экспорт TXT и выбор зеркал или эпизодов в удобном интерфейсе.
// @description:zh-CN    提取 Filecrypt 容器中的原始下载链接。通过简洁界面复制链接到 JDownloader、导出 TXT 并选择镜像或剧集。
// @author               Cursed
// @match                https://*.filecrypt.cc/Container/*
// @match                https://*.filecrypt.to/Container/*
// @match                https://*.filecrypt.co/Container/*
// @grant                none
// @inject-into          content
// @sandbox              DOM
// @noframes
// @run-at               document-start
// @license              MIT
// ==/UserScript==

(() => {
    'use strict';

    function stringArguments(source, functionName) {
        const call = new RegExp(`\\b${functionName}\\s*\\(`).exec(source);

        if (!call) return [];
        let index = call.index + call[0].length;
        const values = [];

        while (index < source.length) {
            while (/\s/.test(source[index] || '') && index < source.length) index++;
            const quote = source[index++];

            if (quote !== "'" && quote !== '"') break;
            let value = '';
            let closed = false;

            while (index < source.length) {
                let char = source[index++];

                if (char === quote) {
                    closed = true;
                    break;
                }

                if (char === '\\') {
                    char = source[index++];

                    if (char === 'x' || char === 'u') {
                        const length = char === 'x' ? 2 : 4;
                        const hex = source.slice(index, index + length);

                        if (!new RegExp(`^[a-f0-9]{${length}}$`, 'i').test(hex)) return [];
                        value += String.fromCharCode(parseInt(hex, 16));
                        index += length;
                        continue;
                    }
                    char = { n: '\n', r: '\r', t: '\t' }[char] ?? char;
                }
                value += char;
            }

            if (!closed) return [];
            values.push(value);

            while (/\s/.test(source[index] || '') && index < source.length) index++;

            if (source[index++] !== ',') break;
        }

        return values;
    }

    function normalizeLinks(values) {
        const links = [];

        for (const value of values) {
            const link = value.trim();

            if (!link) continue;
            const url = new URL(link);

            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL in link data.');
            links.push(link);
        }

        return [...new Set(links)];
    }

    async function decodeCNL(payload) {
        let stage = 'parse-cnl';

        try {
            if (payload.urls) return normalizeLinks(payload.urls.split(/[\r\n]+/));
            let keyText = payload.key.trim();

            if (keyText.includes('%')) keyText = decodeURIComponent(keyText);

            if (!/^[a-f0-9]{32}$/i.test(keyText)) {
                keyText = keyText.match(/^\s*function\s+f\s*\(\s*\)\s*\{\s*return\s+['"]([a-f0-9]{32})['"]\s*;?\s*\}\s*;?\s*$/i)?.[1];
            }

            if (!keyText) throw new Error('Unsupported Click’n’Load key format.');
            const key = Uint8Array.from(keyText.match(/../g), (byte) => parseInt(byte, 16));
            let encoded = payload.crypted;

            if (encoded.includes('%')) encoded = decodeURIComponent(encoded);
            const encrypted = Uint8Array.from(atob(encoded.replace(/\s/g, '')), (char) => char.charCodeAt(0));

            if (!encrypted.length || encrypted.length % 16) throw new Error('Invalid Click’n’Load payload.');
            stage = 'import-key';
            const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt', 'decrypt']);
            stage = 'padding-block';
            const paddingBlock = new Uint8Array(
                await crypto.subtle.encrypt({ name: 'AES-CBC', iv: encrypted.slice(-16) }, cryptoKey, new Uint8Array())
            );
            const padded = new Uint8Array(encrypted.length + paddingBlock.length);
            padded.set(encrypted);
            padded.set(paddingBlock, encrypted.length);
            stage = 'decrypt';
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: key }, cryptoKey, padded);
            stage = 'read-buffer';
            const plain = new Uint8Array(decrypted);
            stage = 'remove-padding';
            let end = plain.length;
            const padding = plain[end - 1];
            let pkcs7 = padding >= 1 && padding <= 16;

            for (let i = end - padding; pkcs7 && i < end; i++) {
                if (plain[i] !== padding) pkcs7 = false;
            }

            if (pkcs7) end -= padding;
            else {
                while (end && plain[end - 1] === 0) end--;
            }
            const unpadded = new Uint8Array(end);

            for (let i = 0; i < end; i++) unpadded[i] = plain[i];
            stage = 'decode-urls';

            return normalizeLinks(new TextDecoder('utf-8', { fatal: true }).decode(unpadded).split(/[\r\n]+/));
        } catch (error) {
            error.cnlStage = stage;
            throw error;
        }
    }

    function readCNL(document) {
        for (const element of document.querySelectorAll('[onsubmit], [onclick]')) {
            const source = element.getAttribute('onsubmit') || element.getAttribute('onclick') || '';
            const args = stringArguments(source, 'CNLPOP');

            if (args.length >= 3) return { key: args[1], crypted: args[2] };
        }

        for (const form of document.querySelectorAll('form')) {
            const key = form.querySelector('[name="jk"]')?.value;
            const crypted = form.querySelector('[name="crypted"]')?.value;

            if (key && crypted) return { key, crypted };
            const urls = form.querySelector('[name="urls"]')?.value;

            if (urls) return { urls };
        }

        return null;
    }

    function readPage(document, href) {
        const url = new URL(href);
        const info = document.querySelector('.window.container');
        const containerId = url.pathname.match(/\/Container\/([a-z0-9]+)(?:\.html)?/i)?.[1] || '';
        const season = document.querySelector('#season_select')?.value ?? url.searchParams.get('season') ?? '';
        const episode = document.querySelector('#episode_select')?.value ?? url.searchParams.get('episode') ?? '';
        const mirror = url.searchParams.get('mirror') || '';
        const payload = readCNL(document);
        const cnlId = document.querySelector('[name="hidden_cnl_id"]')?.value || '';
        const protection = document.querySelector('.window.protection, #cform');
        const waitingForCaptcha =
            !payload &&
            !cnlId &&
            Boolean(
                protection?.querySelector(
                    '.cutcaptcha,.g-recaptcha,.h-captcha,.circle_captcha,.fc_captcha,.keycaptcha,[name="cutcaptcha-response"],[name="g-recaptcha-response"],[name="h-captcha-response"],[name="adcopy_response"],input[type="image"][src*="captcha"]'
                )
            );

        const linkUrls = new Set();

        for (const element of document.querySelectorAll('a[href], [onclick]')) {
            const args = stringArguments(element.getAttribute('onclick') || '', 'openLink');
            const href = element.getAttribute('href');
            const candidate = args[0] && /^[a-z0-9]+$/i.test(args[0]) ? `/Link/${args[0]}.html` : href;

            if (!candidate) continue;

            try {
                const link = new URL(candidate, url);

                if (link.origin === url.origin && /^\/Link\/[a-z0-9]+\.html$/i.test(link.pathname)) linkUrls.add(link.href);
            } catch {}
        }

        const button = document.querySelector('.dlcdownload');
        const onclick = button?.getAttribute('onclick') || '';
        const attribute = onclick.match(/getAttribute\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
        const dlcId = (attribute && button.getAttribute(attribute)) || stringArguments(onclick, 'DownloadDLC')[0];
        let dlcUrl = null;

        if (dlcId && /^[a-z0-9]+$/i.test(dlcId)) {
            dlcUrl = new URL(`/DLC/${dlcId}.dlc`, url);

            if (season || episode) {
                dlcUrl.searchParams.set('season', season);
                dlcUrl.searchParams.set('episode', episode);
            }
        }

        const name = info?.querySelector('h2')?.textContent?.trim() || `Filecrypt ${containerId}`;
        const size =
            [...(info?.querySelectorAll('p') || [])]
                .map((p) => p.textContent)
                .join(' ')
                .match(/([\d.,]+\s*(?:TB|GB|MB|KB|B))\b/i)?.[1] || '';

        const identity = JSON.stringify([url.hostname.replace(/^www\./, ''), containerId, mirror, season, episode]);
        const fingerprint = JSON.stringify([identity, payload, cnlId, [...linkUrls], waitingForCaptcha]);
        const cacheFingerprint = JSON.stringify([identity, name, size, [...linkUrls]]);

        return {
            url,
            containerId,
            name,
            size,
            mirror,
            season,
            episode,
            payload,
            cnlId,
            waitingForCaptcha,
            linkUrls: [...linkUrls],
            dlcUrl: dlcUrl?.href,
            identity,
            fingerprint,
            cacheFingerprint,
        };
    }

    function selectionURL(page) {
        if (!page.cnlId || !/^[a-z0-9]+$/i.test(page.cnlId)) return null;
        const url = new URL(`/_CNL/${page.cnlId}.html`, page.url);
        url.searchParams.set('season', page.season);
        url.searchParams.set('episode', page.episode);

        return url;
    }

    function readRedirect(document, href) {
        const refresh = [...document.querySelectorAll('meta[http-equiv]')].find(
            (meta) => meta.getAttribute('http-equiv').toLowerCase() === 'refresh'
        );
        const refreshURL = refresh?.content
            .match(/\burl\s*=\s*(.+)$/i)?.[1]
            ?.trim()
            .replace(/^(['"])(.*)\1$/, '$2');
        const candidates = refreshURL ? [refreshURL] : [];

        for (const script of document.querySelectorAll('script:not([src])')) {
            const match = script.textContent.match(
                /(?:\b(?:window\.|top\.|document\.)?location(?:\.href)?\s*=\s*|\blocation\.(?:replace|assign)\(\s*)(['"])(https?:\/\/[^'"\s]+)\1/
            );

            if (match) candidates.push(match[2]);
        }

        for (const candidate of candidates) {
            const url = new URL(candidate, href);

            if (['https:', 'http:'].includes(url.protocol)) return url.href;
        }

        return null;
    }

    async function requestPage(url, signal) {
        const target = new URL(url);
        const response = await fetch(target.href, {
            credentials: 'include',
            redirect: 'manual',
            signal: AbortSignal.any([signal, AbortSignal.timeout(15000)].filter(Boolean)),
        });

        if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
            const destination = response.headers.get('Location');

            return {
                status: response.status,
                redirect: destination ? new URL(destination, target).href : null,
                text: '',
                needsVisit: !destination,
            };
        }

        if (!response.ok) throw new Error(`Filecrypt returned HTTP ${response.status}.`);

        return { status: response.status, text: await response.text(), redirect: null, needsVisit: false };
    }

    async function resolveLink(url, signal, request = requestPage) {
        let current = url;
        const visited = new Set();

        for (let step = 0; step < 5; step++) {
            if (visited.has(current)) throw new Error('Filecrypt redirect loop.');
            visited.add(current);
            const result = await request(current, signal);

            if (result.needsVisit) throw new Error('Open this link to complete its redirect or security prompt.');
            const doc = new DOMParser().parseFromString(result.text, 'text/html');
            const next = result.redirect || readRedirect(doc, current);

            if (!next) throw new Error('This link requires a visit or has an unsupported layout.');
            const target = new URL(next);

            if (target.origin !== location.origin) throw new Error('This link switches Filecrypt domains. Open it to continue.');
            current = target.href;
        }
        throw new Error('Too many Filecrypt redirects.');
    }

    async function extractLinks(page, { signal, request = requestPage, resolve = resolveLink, progress = () => {} } = {}) {
        signal?.throwIfAborted();
        const errors = [];
        let payload = page.payload;
        let method = 'Embedded CNL';
        const selected = Boolean(page.season || page.episode);

        if (selected || (!payload && page.cnlId)) {
            const url = selectionURL(page);

            if (url) {
                try {
                    progress(selected ? 'Loading the selected episodes from Filecrypt…' : 'Loading Click’n’Load data from Filecrypt…');
                    const result = await request(url, signal);
                    const json = JSON.parse(result.text);

                    if (!json.success || !Array.isArray(json.data) || json.data.length < 2)
                        throw new Error('Filecrypt did not return selection data.');
                    payload = { key: json.data[0], crypted: json.data[1] };
                    method = selected ? 'Selected CNL' : 'Filecrypt CNL';
                } catch (error) {
                    if (signal?.aborted) throw error;
                    errors.push({
                        stage: error.cnlStage || 'filecrypt-cnl',
                        name: error.name,
                        detail: error.cnlStage === 'decrypt' ? error.message : undefined,
                    });

                    if (selected) return { links: [], unresolved: [], method: 'Selected CNL unavailable', errors };
                }
            } else if (selected) {
                errors.push({ stage: 'selected-cnl', name: 'MissingEndpoint' });

                return { links: [], unresolved: [], method: 'Selected CNL unavailable', errors };
            }
        }

        if (payload) {
            try {
                const links = await decodeCNL(payload);

                if (!links.length) throw new Error('Click’n’Load returned no links.');

                return { links, unresolved: [], method, errors };
            } catch (error) {
                errors.push({
                    stage: error.cnlStage || 'filecrypt-cnl',
                    name: error.name,
                    detail: error.cnlStage === 'decrypt' ? error.message : undefined,
                });
            }
        }

        if (!page.linkUrls.length) return { links: [], unresolved: [], method: 'Unavailable', errors };
        const resolved = new Array(page.linkUrls.length);
        const unresolved = [];
        let index = 0;
        let completed = 0;
        async function worker() {
            while (index < page.linkUrls.length) {
                signal?.throwIfAborted();
                const position = index++;
                const url = page.linkUrls[position];

                try {
                    const link = await resolve(url, signal, request);
                    resolved[position] = normalizeLinks([link]);
                } catch (error) {
                    if (signal?.aborted) throw error;
                    unresolved.push(url);
                }
                progress(`Resolved ${++completed}/${page.linkUrls.length} links…`);
            }
        }
        await Promise.all([worker(), worker()]);

        return { links: [...new Set(resolved.flat())], unresolved, method: 'Individual links', errors };
    }

    const PREFIX = 'fc_local_v2:';
    const TTL = 30 * 60 * 1000;

    function readCache(storage, page, now = Date.now()) {
        try {
            const value = JSON.parse(storage.getItem(PREFIX + page.identity));

            if (
                value?.fingerprint === page.cacheFingerprint &&
                now - value.time >= 0 &&
                now - value.time < TTL &&
                Array.isArray(value.links) &&
                value.links.length &&
                value.links.every((link) => typeof link === 'string' && /^https?:\/\//.test(link))
            ) {
                return { links: value.links, unresolved: [], method: 'Local cache', errors: [] };
            }
            storage.removeItem(PREFIX + page.identity);
        } catch {}

        return null;
    }

    function writeCache(storage, page, result, now = Date.now()) {
        if (!result.links.length || result.unresolved.length) return;

        try {
            storage.setItem(PREFIX + page.identity, JSON.stringify({ fingerprint: page.cacheFingerprint, time: now, links: result.links }));
        } catch {}
    }

    function clearCache(storage, page) {
        try {
            storage.removeItem(PREFIX + page.identity);
        } catch {}
    }

    const STYLE = `
    :host {
        all:initial;
        display:block;
        position:relative;
        width:90%;
        max-width:680px;
        margin:20px auto;
        z-index:2147483647;
        color-scheme:dark;
        font:13px/1.5 system-ui,sans-serif;
        color:#e2e8f0;
        text-align:left;
    }
    :host([data-floating]) {
        position:fixed;
        left:50%;
        bottom:16px;
        transform:translateX(-50%);
        width:calc(100% - 32px);
        margin:0;
    }
    * {
        box-sizing:border-box;
    }
    .clipboard {
        position:fixed;
        left:-10000px;
        top:0;
        opacity:0;
    }
    section {
        background:linear-gradient(180deg,#1f242d,#161a22) padding-box,conic-gradient(from var(--fc-border-angle),#b87791,#b18a65,#a49c68,#679d8b,#6a91b9,#9980b5,#b87791) border-box;
        border:1px solid transparent;
        border-radius:10px;
        padding:16px;
        box-shadow:0 8px 24px #0006;
        max-height:calc(100dvh - 32px);
        overflow:auto;
        animation:appear .16s ease-out,rainbow 4s linear infinite;
    }
    header,.actions,.row {
        display:flex;
        align-items:center;
        gap:8px;
    }
    header {
        justify-content:space-between;
    }
    h3 {
        margin:0;
        font-size:20px;
        color:#f0f0f0;
    }
    a {
        color:#63b3ed;
        text-decoration:none;
    }
    a:hover {
        text-decoration:underline;
    }
    small {
        color:#a0aec0;
    }
    .actions {
        flex-wrap:wrap;
        margin:10px 0;
    }
    .tools {
        display:flex;
        flex-wrap:wrap;
        align-items:baseline;
        gap:12px;
        margin-top:14px;
    }
    .tools button {
        background:none;
        color:#a0aec0;
        font-size:11px;
        padding:2px 0;
        border-radius:2px;
    }
    .tools button:hover {
        color:#e2e8f0;
        text-decoration:underline;
    }
    .shortcuts { color:#a0aec0; font-size:11px; }
    .shortcuts summary { cursor:pointer; width:fit-content; }
    .shortcut-table { margin-top:6px; border-collapse:collapse; font-size:10px; line-height:1.35; }
    .shortcut-table th,.shortcut-table td { padding:2px 8px 2px 0; text-align:left; vertical-align:top; }
    .shortcut-table th { color:#e2e8f0; font-weight:600; white-space:nowrap; }
    .credit { margin-left:auto; white-space:nowrap; font-size:11px; }
    kbd { font:inherit; color:#e2e8f0; }
    button {
        font:inherit;
        background:#2d3748;
        color:#e2e8f0;
        border:0;
        border-radius:6px;
        padding:7px 10px;
        cursor:pointer;
        transition:background-color .12s,color .12s;
    }
    button:hover {
        background:#4a5568;
    }
    button:focus-visible,a:focus-visible,input:focus-visible,section:focus-visible,summary:focus-visible {
        outline:2px solid #63b3ed;
        outline-offset:2px;
    }
    button.primary {
        background:#2b6cb0;
        color:white;
    }
    button:disabled {
        opacity:.5;
        cursor:default;
    }
    [hidden] {
        display:none!important;
    }
    .links {
        display:flex;
        flex-direction:column;
        gap:6px;
        max-height:360px;
        overflow:auto;
    }
    .links:not(:empty) { animation:appear .16s ease-out; }
    .loader { display:flex; justify-content:center; padding:18px; }
    .spinner { width:16px; height:16px; border:2px solid #2d3748; border-top-color:#63b3ed; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes rainbow { to { --fc-border-angle:360deg; } }
    @keyframes appear { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
    @media (prefers-reduced-motion:reduce) {
        section,.links:not(:empty),.spinner { animation:none; }
        button { transition:none; }
    }
    .row {
        background:#ffffff0d;
        padding:8px 10px;
        border-radius:4px;
        justify-content:space-between;
        border:1px solid transparent;
        cursor:pointer;
        transition:background-color .12s,border-color .12s;
    }
    .row.selected { background:#63b3ed12; border-color:#63b3ed38; }
    .row:hover { background:#ffffff12; }
    .row:focus-within { border-color:#63b3ed; }
    .selection { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:10px 0 6px; color:#a0aec0; font-size:12px; }
    .selection label,.pick { display:flex; align-items:center; gap:8px; cursor:pointer; }
    .pick { flex-shrink:0; padding:6px; margin:-6px; }
    input[type=checkbox] { width:17px; height:17px; margin:0; accent-color:#63b3ed; cursor:pointer; flex-shrink:0; }
    .selection button { background:none; padding:4px; color:#a0aec0; font-size:12px; }
    .selection button:hover { color:#e2e8f0; text-decoration:underline; }
    .selection-count { margin-left:auto; }
    .hosters { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0; }
    .hosters button { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; font-size:12px; border:1px solid #ffffff1a; background:#ffffff08; }
    .hosters button[aria-pressed=true] { background:#63b3ed20; border-color:#63b3ed70; }
    .hosters button[aria-pressed=mixed] { border-color:#63b3ed70; border-style:dashed; }
    .hosters img { width:16px; height:16px; object-fit:contain; }
    .row a {
        font:12px/1.5 monospace;
        overflow-wrap:anywhere;
        min-width:0;
        flex:1;
    }
    .row button {
        flex-shrink:0;
    }
    .status {
        overflow-wrap:anywhere;
        margin:8px 0;
    }
    .error {
        color:#fc8181;
    }
    .unresolved {
        margin-top:12px;
    }
    .unresolved a {
        display:block;
        overflow-wrap:anywhere;
    }
    .badge {
        font-size:11px;
        background:#2d3748;
        padding:2px 8px;
        border-radius:12px;
    }
    .toggle {
        font-size:12px;
    }
    `;

    function downloadText(text, name, type = 'text/plain;charset=utf-8') {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function copyText(text, root) {
        try {
            await navigator.clipboard.writeText(text);

            return;
        } catch {}
        const active = root.activeElement;
        const textarea = document.createElement('textarea');
        textarea.className = 'clipboard';
        textarea.value = text;
        textarea.readOnly = true;
        root.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        try {
            if (!document.execCommand('copy')) throw new Error('Clipboard access was denied.');
        } finally {
            textarea.remove();
            active?.focus();
        }
    }

    function createPanel(document, { retry, diagnostics }) {
        CSS.registerProperty({ name: '--fc-border-angle', syntax: '<angle>', initialValue: '0deg', inherits: false });

        const host = document.createElement('filecrypt-link-unlocker');
        host.id = 'fc-link-unlocker';
        const root = host.attachShadow({ mode: 'open' });
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(STYLE);
        root.adoptedStyleSheets = [stylesheet];
        root.innerHTML = `<section aria-label="FileCrypt Link Unlocker" tabindex="0">
            <header><h3>Link Unlocker <span class="badge" hidden></span></h3><button class="toggle" type="button" aria-expanded="true">Collapse</button></header>
            <div class="body">
            <div class="actions"><button class="primary copy" type="button" hidden>Copy all links</button><button class="export" type="button" hidden>Export .txt</button></div>
            <div class="status" role="status" aria-live="polite">Waiting for Filecrypt…</div><div class="loader" role="progressbar" aria-label="Extracting links"><span class="spinner" aria-hidden="true"></span></div>
            <div class="hosters" role="group" aria-label="Select links by hoster" hidden></div>
            <div class="selection" hidden><label><input class="select-all" type="checkbox">Select all</label><span class="selection-count" role="status" aria-live="polite"></span><button class="clear-selection" type="button">Clear</button></div>
            <div class="links"></div><div class="unresolved"></div>
            <div class="tools" role="group" aria-label="Tools"><button class="retry" type="button">Retry</button><button class="diagnostics" type="button">Export diagnostics</button>
            <details class="shortcuts"><summary>Keyboard shortcuts</summary><table class="shortcut-table"><tbody>
            <tr><th><kbd>Ctrl/⌘ + A</kbd></th><td>Select all / clear all</td></tr><tr><th><kbd>Ctrl/⌘ + Shift + A</kbd> / <kbd>Esc</kbd></th><td>Clear selection</td></tr>
            <tr><th><kbd>Ctrl/⌘ + C</kbd></th><td>Copy selected</td></tr><tr><th><kbd>Ctrl/⌘ + S</kbd></th><td>Export TXT</td></tr>
            <tr><th><kbd>↑ / ↓</kbd>, <kbd>Home / End</kbd></th><td>Navigate link checkboxes</td></tr><tr><th><kbd>Space</kbd></th><td>Toggle focused checkbox</td></tr>
            </tbody></table></details>
            <small class="credit">Made by <a href="https://github.com/czrsd" target="_blank" rel="noopener noreferrer">Cursed</a></small></div></div>
        </section>`;
        const find = (selector) => root.querySelector(selector);
        let links = [];
        let name = 'links';
        let context;
        let selected = null;
        let selectionKey;
        let checkboxes = [];
        let lastChecked = -1;
        let hosters = [];
        find('.retry').onclick = retry;
        find('.diagnostics').onclick = () =>
            downloadText(JSON.stringify(diagnostics(), null, 2), 'filecrypt-diagnostics.json', 'application/json');
        const collapseKey = 'fc_local_collapsed';
        let collapsed = false;

        try {
            collapsed = localStorage.getItem(collapseKey) === 'true';
        } catch {}
        function applyCollapse() {
            find('.body').hidden = collapsed;
            find('.toggle').textContent = collapsed ? 'Expand' : 'Collapse';
            find('.toggle').setAttribute('aria-expanded', String(!collapsed));
        }
        applyCollapse();
        find('.toggle').onclick = () => {
            collapsed = !collapsed;
            applyCollapse();

            try {
                localStorage.setItem(collapseKey, String(collapsed));
            } catch {}
        };
        async function copy(text, button) {
            try {
                await copyText(text, root);
                const original = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    if (button === find('.copy')) updateSelection();
                    else button.textContent = original;
                }, 1500);
            } catch {
                status('Clipboard access failed. Use Export .txt instead.', true);
            }
        }
        const selectedLinks = () => links.filter((link) => selected?.has(link));
        find('.copy').onclick = (event) => {
            const values = selectedLinks();

            if (values.length) copy(values.join('\n'), event.currentTarget);
        };
        find('.export').onclick = () => {
            const values = selectedLinks();

            if (values.length) downloadText(values.join('\n'), `${name.replace(/[^\w.-]/g, '_') || 'links'}.txt`);
        };
        function updateSelection() {
            const count = selected?.size || 0;
            find('.select-all').checked = count > 0 && count === links.length;
            find('.select-all').indeterminate = count > 0 && count < links.length;
            find('.selection-count').textContent = `${count} of ${links.length} selected`;
            find('.copy').textContent = count === links.length && count ? `Copy all links (${count})` : `Copy selected (${count})`;
            find('.copy').disabled = !count;
            find('.export').disabled = !count;
            find('.export').textContent = count > 0 && count < links.length ? 'Export selected .txt' : 'Export .txt';
            find('.clear-selection').disabled = !count;

            for (let i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = selected.has(links[i]);
                checkboxes[i].closest('.row').classList.toggle('selected', checkboxes[i].checked);
            }

            for (const group of hosters) {
                const count = group.links.filter((link) => selected.has(link)).length;
                group.button.setAttribute('aria-pressed', count === group.links.length ? 'true' : count ? 'mixed' : 'false');
                group.button.title = `${count} of ${group.links.length} selected. Click to select this hoster only; Ctrl/⌘-click to add or remove it.`;
            }
        }
        function showHosters() {
            const container = find('.hosters');
            container.replaceChildren();
            hosters = [];
            const knownHosts = new Map();

            for (const anchor of document.querySelectorAll('table a.external_link[href]')) {
                try {
                    const host = new URL(anchor.href).hostname.replace(/^www\./, '');
                    knownHosts.set(host, anchor);
                } catch {}
            }
            const domains = [...knownHosts.keys()].sort((a, b) => b.length - a.length);
            const groups = new Map();

            for (const link of links) {
                const hostname = new URL(link).hostname.replace(/^www\./, '');
                const host = domains.find((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) || hostname;

                if (!groups.has(host)) groups.set(host, []);
                groups.get(host).push(link);
            }
            container.hidden = groups.size < 2;

            if (container.hidden) return;

            for (const [host, values] of groups) {
                const button = document.createElement('button');
                button.type = 'button';
                const icon = document.createElement('img');
                icon.alt = '';
                icon.hidden = true;
                icon.referrerPolicy = 'no-referrer';
                icon.decoding = 'async';
                icon.onload = () => {
                    icon.hidden = false;
                };
                icon.onerror = () => icon.remove();
                const existing = knownHosts.get(host)?.querySelector('img');
                icon.src = existing?.currentSrc || existing?.src || `https://${host}/favicon.ico`;
                button.append(icon, `${host} (${values.length})`);
                button.onclick = (event) => {
                    if (event.ctrlKey || event.metaKey) {
                        const remove = values.every((link) => selected.has(link));

                        for (const link of values) {
                            if (remove) selected.delete(link);
                            else selected.add(link);
                        }
                    } else selected = new Set(values);
                    lastChecked = -1;
                    updateSelection();
                };
                hosters.push({ links: values, button });
                container.appendChild(button);
            }
        }
        find('.select-all').onchange = (event) => {
            selected = new Set(event.currentTarget.checked ? links : []);
            lastChecked = -1;
            updateSelection();
        };
        find('.clear-selection').onclick = () => {
            selected.clear();
            lastChecked = -1;
            updateSelection();
        };
        find('.copy').setAttribute('aria-keyshortcuts', 'Control+C Meta+C');
        find('.export').setAttribute('aria-keyshortcuts', 'Control+S Meta+S');
        find('.select-all').setAttribute('aria-keyshortcuts', 'Control+A Meta+A');
        find('.clear-selection').setAttribute('aria-keyshortcuts', 'Escape Control+Shift+A Meta+Shift+A');
        document.addEventListener(
            'keydown',
            (event) => {
                const target = event.composedPath()[0];

                if (
                    !links.length ||
                    event.isComposing ||
                    target.isContentEditable ||
                    target.matches('textarea,select,input:not([type=checkbox])')
                )
                    return;
                const key = event.key.toLowerCase();
                const modified = event.ctrlKey || event.metaKey;
                let action;
                let navigation = false;

                if (modified && !event.altKey) {
                    if (key === 'a')
                        action = () => {
                            window.getSelection()?.removeAllRanges();
                            selected = new Set(event.shiftKey || selected.size === links.length ? [] : links);
                            lastChecked = -1;
                            updateSelection();
                        };
                    else if (!event.shiftKey && key === 'c' && !window.getSelection()?.toString()) action = () => find('.copy').click();
                    else if (!event.shiftKey && key === 's') action = () => find('.export').click();
                } else if (!modified && !event.altKey && !event.shiftKey) {
                    if (key === 'escape') action = () => find('.clear-selection').click();
                    else {
                        const index = checkboxes.indexOf(target);

                        if (index >= 0 && ['arrowup', 'arrowdown', 'home', 'end'].includes(key)) {
                            const next =
                                key === 'home'
                                    ? 0
                                    : key === 'end'
                                      ? checkboxes.length - 1
                                      : Math.max(0, Math.min(checkboxes.length - 1, index + (key === 'arrowup' ? -1 : 1)));
                            action = () => checkboxes[next].focus();
                            navigation = true;
                        }
                    }
                }

                if (!action) return;
                event.preventDefault();
                event.stopPropagation();

                if (!event.repeat || navigation) action();
            },
            true
        );
        function place() {
            const anchor = document.querySelector('.butt1ns');
            host.toggleAttribute('data-floating', !anchor);

            if (anchor) {
                if (anchor.nextElementSibling !== host) anchor.insertAdjacentElement('afterend', host);
            } else if (host.parentElement !== document.body) document.body.appendChild(host);
        }
        function status(text, error = false) {
            find('.status').textContent = text;
            find('.status').hidden = !text;
            find('.status').classList.toggle('error', error);

            if (error) busy(false);
        }
        function busy(value) {
            find('.loader').hidden = !value;
            find('section').setAttribute('aria-busy', String(value));
        }
        function reset(page) {
            busy(true);

            if (selectionKey !== page.identity) selected = null;
            selectionKey = page.identity;
            context = page;
            name = page.name;
            links = [];
            checkboxes = [];
            lastChecked = -1;
            hosters = [];
            find('.hosters').replaceChildren();
            find('.hosters').hidden = true;
            find('.selection').hidden = true;
            find('.links').replaceChildren();
            find('.unresolved').replaceChildren();
            find('.copy').hidden = true;
            find('.export').hidden = true;
            find('.badge').hidden = true;
        }
        function show(result) {
            busy(false);
            links = result.links;

            if (links.length) selected = selected === null ? new Set(links) : new Set(links.filter((link) => selected.has(link)));
            checkboxes = [];
            find('.links').replaceChildren(
                ...links.map((link, index) => {
                    const row = document.createElement('div');
                    row.className = 'row';
                    const pick = document.createElement('label');
                    pick.className = 'pick';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.setAttribute('aria-label', `Select link ${index + 1}: ${new URL(link).hostname}`);
                    checkbox.title = 'Shift-click to select a range';
                    checkbox.checked = selected.has(link);
                    checkbox.onclick = (event) => {
                        const first = event.shiftKey && lastChecked >= 0 ? Math.min(lastChecked, index) : index;
                        const last = event.shiftKey && lastChecked >= 0 ? Math.max(lastChecked, index) : index;

                        for (let i = first; i <= last; i++) {
                            if (checkbox.checked) selected.add(links[i]);
                            else selected.delete(links[i]);
                        }
                        lastChecked = index;
                        updateSelection();
                    };
                    pick.appendChild(checkbox);
                    checkboxes.push(checkbox);
                    row.onclick = (event) => {
                        if (event.target.closest('a,button,label,input') || window.getSelection()?.toString()) return;
                        checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: event.shiftKey }));
                    };
                    const anchor = document.createElement('a');
                    anchor.href = link;
                    anchor.textContent = link;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = 'Copy';
                    button.onclick = () => copy(link, button);
                    row.append(pick, anchor, button);

                    return row;
                })
            );
            find('.copy').hidden = !links.length;
            find('.export').hidden = !links.length;
            find('.selection').hidden = !links.length;
            showHosters();

            if (links.length) updateSelection();
            find('.badge').hidden = !links.length;
            find('.badge').textContent = `${links.length} link${links.length === 1 ? '' : 's'}`;
            const unresolved = find('.unresolved');
            unresolved.replaceChildren();

            if (result.unresolved.length) {
                const label = document.createElement('p');
                label.textContent = `${result.unresolved.length} unresolved link${result.unresolved.length === 1 ? '' : 's'}. Open ${result.unresolved.length === 1 ? 'it' : 'them'} to complete any redirect or security prompt:`;
                unresolved.appendChild(label);

                for (const url of result.unresolved) {
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.textContent = url;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';
                    unresolved.appendChild(anchor);
                }
            }

            if (links.length) status(result.unresolved.length ? 'Some links still need a visit. See below.' : '');
            else if (result.method === 'Selected CNL unavailable')
                status('Could not load the selected season or episode. Complete any page prompts, then retry.', true);
            else
                status(
                    result.unresolved.length
                        ? 'Some links require a visit. See below.'
                        : 'No supported link data is available. Complete any CAPTCHA or password prompt, then retry.',
                    true
                );

            if (context.dlcUrl && !links.length) {
                const text = document.createElement('p');
                text.textContent = 'DLC-only containers cannot be decrypted by this script. ';
                const anchor = document.createElement('a');
                anchor.href = context.dlcUrl;
                anchor.textContent = 'Download the original DLC';
                text.appendChild(anchor);
                unresolved.appendChild(text);
            }
        }

        return { host, place, reset, status, show, busy };
    }

    const VERSION = '2.0.0';

    function start(document = globalThis.document) {
        if (document.getElementById('fc-link-unlocker')) return;
        let fingerprint = '';
        let controller;
        let timer;
        let report = {};
        let page;
        const storage = {
            getItem: (key) => sessionStorage.getItem(key),
            setItem: (key, value) => sessionStorage.setItem(key, value),
            removeItem: (key) => sessionStorage.removeItem(key),
        };
        const panel = createPanel(document, {
            retry: () => update(true),
            diagnostics: () => ({
                version: VERSION,
                browser: navigator.userAgent,
                ...report,
            }),
        });
        async function update(force = false) {
            panel.place();

            for (const banner of document.querySelectorAll('div[class^="fiIItheadblockqueue"], div[class*=" fiIItheadblockqueue"]'))
                banner.remove();
            page = readPage(document, location.href);
            const nextFingerprint =
                page.fingerprint + (document.readyState === 'loading' && !page.payload && !page.cnlId ? ':loading' : '');

            if (!force && nextFingerprint === fingerprint) return;
            fingerprint = nextFingerprint;
            controller?.abort();
            controller = new AbortController();
            const signal = controller.signal;
            const currentPage = page;
            panel.reset(page);
            report = {
                state: 'extracting',
                method: null,
                selection: { mirror: page.mirror, season: page.season, episode: page.episode },
                found: {
                    cnl: Boolean(page.payload),
                    selectionEndpoint: Boolean(page.cnlId),
                    individualLinks: page.linkUrls.length,
                    dlc: Boolean(page.dlcUrl),
                },
                resolved: 0,
                unresolved: 0,
                errors: [],
                elapsedMs: 0,
            };

            if (force) clearCache(storage, page);

            if (page.waitingForCaptcha) {
                report.state = 'waiting-captcha';
                panel.busy(false);
                panel.status('Waiting for captcha');

                return;
            }

            if (document.readyState === 'loading' && !page.payload && !page.cnlId) {
                report.state = 'loading';
                panel.status('Waiting for the container…');

                return;
            }
            const started = performance.now();

            try {
                panel.status('Extracting links…');
                const result =
                    readCache(storage, page) ||
                    (await extractLinks(page, {
                        signal,
                        progress: (text) => {
                            if (!signal.aborted) panel.status(text);
                        },
                    }));

                if (signal.aborted) return;
                panel.show(result);
                writeCache(storage, currentPage, result);
                report = {
                    ...report,
                    state: result.unresolved.length ? 'partial' : result.links.length ? 'success' : 'waiting',
                    method: result.method,
                    resolved: result.links.length,
                    unresolved: result.unresolved.length,
                    errors: result.errors,
                    elapsedMs: Math.round(performance.now() - started),
                };
            } catch (error) {
                if (signal.aborted) return;
                panel.status('Extraction failed. Complete any security prompt and retry, or export diagnostics.', true);
                report = {
                    ...report,
                    state: 'error',
                    errors: [{ stage: 'extraction', name: error.name }],
                    elapsedMs: Math.round(performance.now() - started),
                };
            }
        }
        const observer = new MutationObserver(() => {
            if (timer) return;
            timer = setTimeout(() => {
                timer = null;
                update();
            }, 16);
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['onsubmit', 'onclick', 'value', 'selected'],
        });
        document.addEventListener('change', () => update());
        document.addEventListener('DOMContentLoaded', () => update(), { once: true });
        window.addEventListener('popstate', () => update());
        window.addEventListener('hashchange', () => update());
        window.addEventListener('pagehide', () => {
            controller?.abort();
            observer.disconnect();
            clearTimeout(timer);
            timer = null;
        });
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['onsubmit', 'onclick', 'value', 'selected'],
            });
            fingerprint = '';
            update();
        });
        update();
    }

    if (typeof document !== 'undefined') {
        if (document.body) start();
        else {
            const observer = new MutationObserver(() => {
                if (!document.body) return;
                observer.disconnect();
                start();
            });
            observer.observe(document, { childList: true, subtree: true });
        }
    }
})();
