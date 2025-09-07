# Link Unlocker - Filecrypt

Link Unlocker is a Tampermonkey userscript that makes dealing with Filecrypt containers much easier.  
Instead of clicking every single download button, it collects all the links for you and shows them in one simple box with a copy button.

It uses a small Node.js proxy server to decrypt .dlc files via [dcrypt.it](https://dcrypt.it/), because browsers can’t upload files directly to their API due to CORS restrictions.  
The proxy handles the upload and sends the results back to the script.  
Setting it up yourself is easy: copy over `server.js`, install the dependencies and update the `UPLOAD_URL` in the script.  
You can keep it running with pm2 or any other process manager.

---

## Features

-   Instantly detect Filecrypt DLC containers
-   Decrypts and fetches all links inside a DLC file
-   Copy all links to clipboard with a single click
-   Modern, colorful UI
-   Automatically removes annoying banners
-   Starts early (document-start) and uses a mutation observer for speed

---

## Userscript installation

1. Install [Tampermonkey](https://tampermonkey.net/) in your browser
2. Enable _Allow User Scripts_ in the tampermonkey extension settings.
3. Create a new userscript and paste the contents of `script.user.js`
4. Adjust the `UPLOAD_URL` if your server runs on a different domain

---

## Proxy installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Run the server:

```bash
node server.js
```

or with pm2:

```bash
pm2 start process.json
```
