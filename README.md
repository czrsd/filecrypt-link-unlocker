# FileCrypt Auto-Bypass & Decrypter (Link Extractor)

[Website and installation](https://filecrypt.czrsd.com/) · [Greasy Fork](https://greasyfork.org/en/scripts/548711-filecrypt-link-unlocker)

Extract original download links from Filecrypt containers directly in your browser. Copy the complete list into a download manager, copy individual links, or export a TXT file.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Allow the extension to run userscripts if your browser requires it.
3. Install from Greasy Fork, or open `script.user.js` in your userscript manager.
4. Open a Filecrypt container and complete any CAPTCHA or password prompt on the page.

Configured for HTTPS container pages on `filecrypt.cc`, `filecrypt.to`, and `filecrypt.co`, including subdomains. URL matches do not guarantee that every domain or layout is currently usable.

## How extraction works

1. Reuse a matching result from the session cache if it is less than 30 minutes old.
2. Decode embedded `CNLPOP(...)`, standard `jk`/`crypted` forms, or plain CNL URL fields.
3. For selected seasons or episodes, request and decode their CNL data from the current Filecrypt origin.
4. When bulk data is unavailable, try individual Filecrypt links with two requests at a time. Supported responses include explicit HTML refresh and literal JavaScript redirects; response scripts are not executed.

AES decryption uses the browser's native Web Crypto API. Filecrypt requests keep the browser's current session and stop before following redirects outside the current origin.

## Features

- Copy all links, choose links with checkboxes, or copy an individual link. TXT export uses the same selection.
- Select all, clear the selection, or Shift-click a range. The selected count and copy button show exactly how many links will be copied.
- With multiple hosters, click a hoster button to select its links. Ctrl/Command-click adds or removes a hoster's links. Icons use available page images or the hoster's favicon; failed icons are omitted. Favicon requests go directly to the hoster without a referrer.
- Preserve URL queries, fragments, and container order; remove exact duplicate URLs.
- Follow the selected mirror, season, and episode. Changes cancel stale work and use separate cache entries.
- Render independently of folder status classes, heading, and file-size metadata.
- Display inline after the button row, or in a fixed bottom panel with 16px margins when that row is absent.
- Collapse the panel and remember the preference on the current Filecrypt origin.
- Isolate the interface using Shadow DOM; keep long lists scrollable.
- Remove known `fiIItheadblockqueue*` banner containers. This is not a general network ad blocker.
- Retry extraction or explicitly download a sanitized diagnostic report.

Extraction returns URLs supplied by Filecrypt without host-specific download plugins. Filehost account requirements, download limits, and file availability still apply.

## Keyboard shortcuts

Shortcuts work throughout the Filecrypt page, including when the panel is collapsed. Use Command instead of Ctrl on macOS. Editable fields keep their normal shortcuts, and highlighted text keeps normal copy behavior.

| Shortcut | Action |
| --- | --- |
| Ctrl + A | Select all extracted links, or clear the selection if all are selected |
| Ctrl + Shift + A or Escape | Clear the link selection |
| Ctrl + C | Copy selected links; if text is highlighted, copy that text normally |
| Ctrl + S | Export selected links as TXT |
| Up / Down on a link checkbox | Focus the previous / next checkbox |
| Home / End on a link checkbox | Focus the first / last checkbox |
| Space on a checkbox | Toggle it |
| Tab / Shift + Tab | Move between controls |

Copy and export require at least one selected link. Holding a shortcut does not repeatedly copy or download files. The panel's **Keyboard shortcuts** disclosure lists the controls. Shift-click a checkbox to select or deselect a range.
