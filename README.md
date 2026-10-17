# FileCrypt Auto-Bypass & Decrypter (Link Extractor)

## How It Works

The script uses a lightweight Node.js proxy server to decrypt `.dlc` files via the [dcrypt.it](https://dcrypt.it/) API. Because web browsers block direct file uploads to third-party APIs due to CORS restrictions, the proxy handles the `.dlc` upload and returns the decrypted raw links back to the userscript.

You can use the default public proxy configured in the script, or self-host your own instance by running `server.js` and updating the `UPLOAD_URL` constant.

---

## Features

* **Universal Filecrypt Support:** Operates seamlessly across all official Filecrypt domains and mirrors (`.cc`, `.to`, `.co`, `.org`, `.is`).
* **Automated DLC Extraction:** Detects and decrypts DLC containers instantly at `document-start` using a MutationObserver.
* **Advanced Link Management:** Features a 1-click "Copy all links" button, individual copy buttons for single links and an export function to save all links directly as a `.txt` file.
* **Optimized Dark Mode UI:** Displays links in a modern, scrollable container so massive download packs do not stretch or break the page layout.
* **Instant Session Caching:** Extracted links are cached in the session storage, meaning page refreshes load the links immediately with zero delay.
* **Ad Removal:** Actively targets and removes dynamic ad banners (such as Rapidgator promotions) and unnecessary site branding for a distraction-free view.
* **Multi-Language Integration:** Fully localized metadata for accurate international search indexing.

## Supported Filehosters

Extract plain-text links for all popular filehosters embedded in Filecrypt, including Rapidgator, Ddownload, Mega.nz, Datanodes, Filekeeper, Mediafire, Fuckingfast, Hexload, Turbo.to, and more.

---

## Userscript Installation

1. Install a userscript manager such as [Tampermonkey](https://tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Enable *Allow User Scripts* in your userscript manager's extension settings (required for Chrome Manifest V3).
3. Install the script directly from Greasy Fork, or create a new script in your extension and paste the contents of `script.user.js`.
4. *(Optional)* Update the `UPLOAD_URL` constant in the script if you are self-hosting the proxy server on your own domain.

---

## Proxy Server Installation (Self-Hosting)

To run your own decryption proxy, deploy `server.js` on a Node.js environment and keep it running with `pm2` or another process manager.

1. Clone the repository:

```bash
git clone [https://github.com/czrsd/filecrypt-link-unlocker.git](https://github.com/czrsd/filecrypt-link-unlocker.git)
cd filecrypt-link-unlocker
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
node server.js
```

4. *(Optional)* Run as a background service using pm2:

```bash
pm2 start process.json
```
