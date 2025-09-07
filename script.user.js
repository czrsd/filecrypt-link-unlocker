// ==UserScript==
// @name         Filecrypt Link Unlocker
// @namespace    https://github.com/czrsd/filecrypt-link-unlocker
// @version      1.0.0
// @description  Display all links from a Filecrypt container
// @author       Cursed
// @match        https://*.filecrypt.cc/Container/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=filecrypt.cc
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    // You can check out the server code at github.com/czrsd/filecrypt-link-unlocker

    /** @constant {string} Server URL to upload DLC for decryption */
    const UPLOAD_URL = 'https://filecrypt.czrsd.com/upload-dlc';

    // removes the rapidgator banner if it exists
    const removeBanner = _ => {
        const banner = document.querySelector('.fiIItheadblockqueue4');
        if (banner) banner.remove();
    };


    /**
     * Observe the DOM for the DLC button and button container to appear
     * Once they appear, set up the link container
     */
    const observer = new MutationObserver((_, obs) => {
        const dlcButton = document.querySelector('.dlcdownload');
        const btnsDiv = document.querySelector('.butt1ns');

        if (dlcButton && btnsDiv) {
            obs.disconnect();
            removeBanner();
            initLinkContainer(dlcButton, btnsDiv);
        }
    });

    observer.observe(document, { childList: true, subtree: true });

    /**
     * Create the UI box, fetch the DLC and render the links
     * @param {HTMLElement} dlcButton
     * @param {HTMLElement} btnsDiv
     */
    async function initLinkContainer(dlcButton, btnsDiv) {
        const attributes = dlcButton.getAttributeNames();
        const id = dlcButton.getAttribute(attributes[attributes.length - 1]);
        const url = `https://www.filecrypt.cc/DLC/${id}.dlc`;

        const container = document.createElement('div');
        container.innerHTML = `
            <h3 style="margin:0 0 10px 0;font-size:20px;font-weight:600;color:#222;">Link Unlocker</h3>
            <span style="margin-bottom:10px;color:#555;font-size:13px;font-style:italic">Made by Cursed</span>
            <button id="cz-copy" style="width:fit-content;margin-bottom:10px;display:none;align-items:center;
                    background: rgba(255,255,255,0.35);border-radius:6px;color:#222;padding:10px 16px;
                    border:2px solid transparent;transition:border .15s ease;">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 640 640">
                    <path fill="#222222" d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/>
                </svg>
                Copy all links
            </button>
            <div id="cz-links" style="color:#777;font-style:italic;">Loading links...</div>
        `;

        Object.assign(container.style, {
            display: 'flex',
            flexDirection: 'column',
            background:
                'linear-gradient(135deg, rgba(89,136,255,0.2), rgba(249,89,255,0.2))',
            borderRadius: '12px',
            padding: '15px',
            width: 'fit-content',
            margin: '20px auto',
            border: '1px solid rgba(0,0,0,0.2)',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        });
        btnsDiv.insertAdjacentElement('afterend', container);

        const copyBtn = document.querySelector('#cz-copy');
        copyBtn.addEventListener('click', () => {
            const links = Array.from(
                document.querySelectorAll('#cz-links a')
            ).map((a) => a.href);
            if (links.length) navigator.clipboard.writeText(links.join('\n'));

            // visual feedback
            copyBtn.style.border = '2px solid #9CF7A3';
            setTimeout(
                () => (copyBtn.style.border = '2px solid transparent'),
                1500
            );
        });
        copyBtn.onmouseenter = _ => (copyBtn.style.scale = '1.03');
        copyBtn.onmouseleave = _ => (copyBtn.style.scale = '1');

        // fetch DLC content and render links
        const linksDiv = document.querySelector('#cz-links');
        try {
            const buffer = await fetch(url).then((res) => res.arrayBuffer());
            const formData = new FormData();
            formData.append('dlcfile', new Blob([buffer]), 'file.dlc');

            const res = await fetch(UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });
            const json = await res.json();

            linksDiv.innerHTML = '';
            json.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link;
                a.innerText = link;
                a.target = '_blank';
                Object.assign(a.style, {
                    display: 'block',
                    marginBottom: '4px',
                    wordBreak: 'break-all',
                    color: '#0077ff',
                    textDecoration: 'underline',
                    textAlign: 'left',
                });
                linksDiv.appendChild(a);
            });
            copyBtn.style.display = 'flex';
        } catch (err) {
            linksDiv.innerText = 'Failed to fetch links';
            linksDiv.style.color = 'red';
            linksDiv.style.fontStyle = 'normal';
            console.error(err);
        }
    }
})();
