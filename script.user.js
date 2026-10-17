// ==UserScript==
// @name                 FileCrypt Auto-Bypass & Decrypter (Link Extractor) [2026]
// @name:de              FileCrypt Auto-Bypass & Entschlüsseler (Link Extractor) [2026]
// @name:fr              FileCrypt Auto-Bypass & Déchiffreur (Extracteur de liens) [2026]
// @name:es              FileCrypt Auto-Bypass & Descifrador (Extractor de enlaces) [2026]
// @name:it              FileCrypt Auto-Bypass & Decrittatore (Estrattore di link) [2026]
// @name:ru              FileCrypt Авто-обход и дешифратор (Экстрактор ссылок) [2026]
// @name:zh-CN           FileCrypt 自动绕过与解密器 (链接提取器) [2026]
// @namespace            https://github.com/czrsd/filecrypt-link-unlocker
// @version              1.1.0
// @description          Instantly extracts original download links from Filecrypt via server-side DLC decryption. Features a clean UI, 1-click copy for JDownloader, and ad removal!
// @description:de       Extrahiert sofort Original-Download-Links von Filecrypt via serverseitiger DLC-Entschlüsselung. Bietet eine saubere UI, 1-Klick-Kopieren für JDownloader und Adblocker!
// @description:fr       Extrait instantanément les liens de téléchargement originaux de Filecrypt via le décryptage DLC côté serveur. Interface épurée, copie en 1 clic pour JDownloader et suppression des pubs !
// @description:es       Extrae al instante los enlaces de descarga originales de Filecrypt mediante descifrado DLC en el servidor. ¡Interfaz limpia, copia con 1 clic para JDownloader y eliminación de anuncios!
// @description:it       Estrae istantaneamente i link di download originali da Filecrypt tramite decrittazione DLC lato server. Interfaccia pulita, copia in 1 clic per JDownloader e rimozione degli annunci!
// @description:ru       Мгновенно извлекает оригинальные ссылки на скачивание из Filecrypt через серверную расшифровку DLC. Чистый интерфейс, копирование в 1 клик для JDownloader и удаление рекламы!
// @description:zh-CN    通过服务器端 DLC 解密即时提取 Filecrypt 的原始下载链接。提供简洁无广告的界面，并支持一键复制到 JDownloader！
// @author               Cursed
// @match                https://*.filecrypt.cc/Container/*
// @match                https://*.filecrypt.to/Container/*
// @match                https://*.filecrypt.co/Container/*
// @match                https://*.filecrypt.org/Container/*
// @match                https://*.filecrypt.is/Container/*
// @icon                 https://czrsd.com/static/filecrypt/filecrypt-link-unlocker.png
// @grant                none
// @run-at               document-start
// @license              MIT
// ==/UserScript==

(() => {
    'use strict';

    /** @constant {string} Server URL to upload DLC for decryption */
    const UPLOAD_URL = 'https://filecrypt.czrsd.com/upload-dlc';

    // removes all rapidgator / ads banners matching fiIItheadblockqueue*
    const removeBanner = () => {
        const banners = document.querySelectorAll('div[class^="fiIItheadblockqueue"], div[class*=" fiIItheadblockqueue"]');
        banners.forEach(b => b.remove());
    };

    /**
     * Observe the DOM for the DLC button and button container to appear
     * Once they appear, set up the link container
     */
    const observer = new MutationObserver((_, obs) => {
        const dlcButton = document.querySelector('.dlcdownload');
        const btnsDiv = document.querySelector('.butt1ns');
        const containerInfo = document.querySelector('.window.container.online');
        const name = containerInfo?.querySelector('h2')?.textContent?.trim() || '';

        if (dlcButton && btnsDiv && name) {
            let size;
            const pElements = containerInfo.querySelectorAll('p');
            for (const p of pElements) {
                const match = p.textContent.match(/([\d.]+\s*(GB|MB|KB))/i);
                if (match) {
                    size = match[1];
                    break;
                }
            }

            obs.disconnect();
            removeBanner();
            initLinkContainer(dlcButton, btnsDiv, name, size);
        }
    });

    observer.observe(document, { childList: true, subtree: true });

    /**
     * Create the UI box, fetch the DLC and render the links
     * @param {HTMLElement} dlcButton
     * @param {HTMLElement} btnsDiv
     */
    async function initLinkContainer(dlcButton, btnsDiv, name, size) {
        const attributes = dlcButton.getAttributeNames();
        let id = dlcButton.getAttribute(attributes[attributes.length - 1]);
        if (!id || id.length < 5) {
            const onclickAttr = dlcButton.getAttribute('onclick') || '';
            const match = onclickAttr.match(/DownloadDLC\(['"]?([^'")\s]+)/);
            if (match) id = match[1];
        }

        const url = `${window.location.origin}/DLC/${id}.dlc`;

        const container = document.createElement('div');
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;margin-bottom:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <h3 style="margin:0;font-size:20px;font-weight:600;color:#f0f0f0;">Link Unlocker</h3>
                    <span id="cz_count_badge" style="display:none;background:#2d3748;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;"></span>
                </div>
                <span style="font-size:11px;color: #ccc;">Made by <a href="https://github.com/czrsd" target="_blank" rel="noopener noreferrer" style="color:#63b3ed!important;text-decoration:none!important;">Cursed</a></span>
            </div>
            <div id="cz_files_info" style="margin-bottom:10px;color:#a0aec0;font-size:12px;line-height:1.5;">Loading...</div>
            <div id="cz_actions" style="display:none;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                <button id="cz_copy" type="button" style="display:inline-flex;align-items:center;gap:6px;background:#2b6cb0;color:#ffffff;font-size:13px;font-weight:500;padding:8px 14px;border:none;border-radius:6px;cursor:pointer;transition:background 0.15s ease;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:static!important;margin:0!important;padding:0!important;max-width:none!important;top:auto!important;left:auto!important;height:15px!important;width:15px!important;">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span style="padding-left:0!important;line-height:normal!important;">Copy all links</span>
                </button>
                <button id="cz_export" type="button" style="display:inline-flex;align-items:center;gap:6px;background:#2d3748;color:#e2e8f0;font-size:13px;font-weight:500;padding:8px 14px;border-radius:6px;border:none;cursor:pointer;transition:background 0.15s ease;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:static!important;margin:0!important;padding:0!important;max-width:none!important;top:auto!important;left:auto!important;height:15px!important;width:15px!important;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span style="padding-left:0!important;line-height:normal!important;">Export .txt</span>
                </button>
            </div>
            <div id="cz_links" style="color:#a0aec0;display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;padding:6px;background:rgba(0,0,0,0.25);border-radius:6px;border:1px solid rgba(255,255,255,0.06);box-sizing:border-box;">Loading links...</div>
        `;

        Object.assign(container.style, {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #1f242d 0%, #161a22 100%)',
            borderRadius: '10px',
            padding: '16px',
            width: '90%',
            maxWidth: '680px',
            margin: '20px auto',
            textAlign: 'left',
            border: '1px solid #2d3748',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            boxSizing: 'border-box',
            zIndex: 999999
        });

        btnsDiv.insertAdjacentElement('afterend', container);

        const copyBtn = container.querySelector('#cz_copy');
        const exportBtn = container.querySelector('#cz_export');
        const actionsDiv = container.querySelector('#cz_actions');
        const countBadge = container.querySelector('#cz_count_badge');
        const linksDiv = container.querySelector('#cz_links');
        const files_info = container.querySelector('#cz_files_info');

        copyBtn.onmouseenter = () => (copyBtn.style.background = '#3182ce');
        copyBtn.onmouseleave = () => (copyBtn.style.background = '#2b6cb0');
        exportBtn.onmouseenter = () => (exportBtn.style.background = '#4a5568');
        exportBtn.onmouseleave = () => (exportBtn.style.background = '#2d3748');

        const containerId = window.location.pathname.split('Container/')[1]?.split('.html')[0] || '';
        const storageKey = containerId ? `fc_unlock_${containerId}` : null;

        if (storageKey) {
            try {
                const cachedData = sessionStorage.getItem(storageKey);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (parsed && Array.isArray(parsed.links) && parsed.links.length > 0) {
                        renderLinks(parsed.links, parsed.referrer);
                        return;
                    }
                }
            } catch (_) {}
        }

        try {
            const buffer = await fetch(url).then(res => res.arrayBuffer());
            const formData = new FormData();
            formData.append('link', window.location.href);
            formData.append('referrer', document.referrer || 'unknown');
            formData.append('name', name);
            formData.append('size', size);
            formData.append('dlcfile', new Blob([buffer]), 'file.dlc');

            const res = await fetch(UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();
            const { referrer, links } = json;

            if (!links || !links.length) {
                throw new Error('No links returned');
            }

            if (storageKey) {
                try {
                    sessionStorage.setItem(storageKey, JSON.stringify({ links, referrer }));
                } catch (_) {}
            }

            renderLinks(links, referrer);
        } catch (err) {
            linksDiv.innerText = 'Failed to fetch links';
            linksDiv.style.color = '#fc8181';
            linksDiv.style.fontStyle = 'normal';
            console.error(err);
        }

        function renderLinks(links, referrer) {
            const refDomain = referrer && referrer !== 'unknown' ? new URL(referrer).hostname : 'unknown';

            files_info.innerHTML = `
                <div><strong>Size:</strong> ${size}</div>
                <div style="color:#718096;font-size:11px;margin-top:2px;">ID: ${containerId} &bull; Download from: ${refDomain}</div>
            `;

            countBadge.innerText = `${links.length} link${links.length === 1 ? '' : 's'}`;
            countBadge.style.display = 'inline-block';

            // Copy all links with active visual feedback
            const copyBtnText = copyBtn.querySelector('span');
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(links.join('\n'));
                const prev = copyBtnText.innerText;
                copyBtnText.innerText = `✓ Copied (${links.length})!`;
                copyBtn.style.background = '#38a169';
                setTimeout(() => {
                    copyBtnText.innerText = prev;
                    copyBtn.style.background = '#2b6cb0';
                }, 1600);
            };

            // Export .txt
            exportBtn.onclick = () => {
                const blob = new Blob([links.join('\n')], { type: 'text/plain;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `${name ? name.replace(/[^\w.-]/g, '_') : 'links'}.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(blobUrl);
            };

            actionsDiv.style.display = 'flex';
            linksDiv.innerHTML = '';

            links.forEach(linkItem => {
                const row = document.createElement('div');
                row.style = 'display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:4px;background:rgba(255,255,255,0.05);gap:10px;box-sizing:border-box;width:100%;';
                row.onmouseenter = () => (row.style.background = 'rgba(255,255,255,0.1)');
                row.onmouseleave = () => (row.style.background = 'rgba(255,255,255,0.05)');

                const a = document.createElement('a');
                a.href = '#';
                a.innerText = linkItem;
                a.title = linkItem;
                a.style = 'display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-width:calc(100% - 35px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#63b3ed!important;text-decoration:none!important;font-size:12px!important;font-family:monospace!important;cursor:pointer;line-height:1.5!important;text-align:left!important;';
                a.onmouseenter = () => (a.style.textDecoration = 'underline');
                a.onmouseleave = () => (a.style.textDecoration = 'none');
                a.onclick = e => {
                    e.preventDefault();
                    window.open(linkItem, '_blank');
                };

                const itemCopy = document.createElement('button');
                itemCopy.title = 'Copy link';
                itemCopy.type = 'button';
                itemCopy.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:static!important;margin:0!important;padding:0!important;max-width:none!important;top:auto!important;left:auto!important;height:14px!important;width:14px!important;pointer-events:none;">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                `;
                itemCopy.style = 'flex-shrink:0;width:auto;height:auto;background:none;border:none;color:#a0aec0;cursor:pointer;padding:4px 6px;border-radius:4px;display:flex;align-items:center;justify-content:center;margin:0;';
                itemCopy.onmouseenter = () => (itemCopy.style.color = '#fff');
                itemCopy.onmouseleave = () => (itemCopy.style.color = '#a0aec0');
                itemCopy.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigator.clipboard.writeText(linkItem);
                    itemCopy.style.color = '#48bb78';
                    setTimeout(() => (itemCopy.style.color = '#a0aec0'), 1200);
                };

                row.appendChild(a);
                row.appendChild(itemCopy);
                linksDiv.appendChild(row);
            });
        }
    }
})();
