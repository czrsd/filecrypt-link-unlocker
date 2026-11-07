# FileCrypt Auto-Bypass & Decrypter (Link Extractor)

Extract original download links from supported Filecrypt containers directly in your browser. Copy the complete list into JDownloader, copy individual links, or export a TXT file.

## Features

* **Container link extraction:** Collects the original download links from supported Filecrypt containers into one list.
* **Mirror and episode support:** Uses the selected mirror, season, or episode when Filecrypt provides the required data. Changing selections cancels stale work.
* **Link management:** Copy all links or choose a subset with checkboxes. Select all, clear the selection, or Shift-click a range. The copy button shows the selected count, and TXT export uses the same selection. Individual copy buttons remain available. Exact duplicates are removed.
* **Hoster selection:** When links span multiple hosters, click a hoster button to select its links. Ctrl/Command-click adds or removes hosters. Available icons are shown; favicons are requested directly from the hoster without a referrer.
* **Flexible interface:** Uses the normal button area when available. Otherwise, the panel floats at the bottom with margins and scrolling. Collapse it when you need more space.
* **Session caching:** Matching results are cached in the browser session for up to 30 minutes. Use Retry to refresh them.
* **Fallback extraction:** Attempts supported individual Filecrypt link pages when bulk data is unavailable. Unresolved links remain available to open manually.
* **Diagnostics:** Export a diagnostic report for troubleshooting. Nothing is submitted automatically.
* **Banner removal:** Removes the known banner containers targeted by the script. Continue using your usual ad blocker for network filtering.

## Supported pages and filehosters

Configured for HTTPS container pages on Filecrypt `.cc`, `.to`, and `.co`, including subdomains. Actual extraction depends on each page’s available data; support for every container is not guaranteed.

Extracted URLs can point to Rapidgator, Ddownload, Mega, Mediafire, Datanodes, Filekeeper, Fuckingfast, and other hosts. The script returns links supplied by Filecrypt; it does not unlock premium downloads or bypass filehost restrictions.

## Keyboard shortcuts

Shortcuts work throughout the Filecrypt page, including when the panel is collapsed. On macOS, use Command instead of Ctrl.

* **Ctrl + A:** Select all links, or clear the selection if all are selected.
* **Ctrl + Shift + A** or **Escape:** Clear the selection.
* **Ctrl + C:** Copy selected links. Highlighted text keeps normal copy behavior.
* **Ctrl + S:** Export selected links as TXT.
* **Up / Down** and **Home / End** on a link checkbox: Move between checkboxes.
* **Space:** Toggle the focused checkbox. **Tab / Shift + Tab:** Move between controls.
* **Shift-click:** Select or deselect a range of links.

Shortcuts leave editable fields alone and use the current selection. Open **Keyboard shortcuts** beside **Export diagnostics** for a reminder.

## Limitations

Complete any CAPTCHA or password prompt on Filecrypt first. DLC-only containers cannot be decrypted by the script; their original DLC download is offered when available. Some individual redirects or security prompts require opening links manually. Partial results are labelled.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Allow the extension to run userscripts if your browser requires it.
3. Click **Install this script** and confirm in your extension.
4. Open a Filecrypt container and complete any page prompts.

If extraction fails, press **Retry**. Export diagnostics to include a report with your feedback. It includes browser and script versions but excludes cookies, IP addresses, container URLs, referrers, decrypted URLs, and encryption keys. Share the affected container URL separately if needed.

---

[Source code and issue tracker on GitHub](https://github.com/czrsd/filecrypt-link-unlocker)
