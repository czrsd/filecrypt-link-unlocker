import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import http from 'node:http';
import express from 'express';
import multer from 'multer';

const source = readFileSync(new URL('../script.user.js', import.meta.url), 'utf8');

function loadUpload(request) {
    const context = vm.createContext({
        GM_xmlhttpRequest: request,
        MutationObserver: class { observe() {} },
        document: {},
    });
    vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.uploadDLC = uploadDLC; })();'), context);
    return context.uploadDLC;
}

test('upload permission is limited to the configured server', () => {
    assert.match(source, /@grant\s+GM_xmlhttpRequest/);
    assert.match(source, /@connect\s+filecrypt\.czrsd\.com\s*\n/);
    assert.doesNotMatch(source, /@grant\s+none|fetch\(UPLOAD_URL/);
});

test('extension upload preserves binary DLC and metadata as multipart data', async t => {
    const app = express();
    let received;
    app.post('/upload-dlc', multer().single('dlcfile'), (req, res) => {
        received = { file: req.file, fields: req.body };
        res.json({ status: 'success', links: ['https://example.com/download'], referrer: 'unknown' });
    });
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));

    const upload = loadUpload(details => {
        assert.equal(details.url, 'https://filecrypt.czrsd.com/upload-dlc');
        assert.equal(details.method, 'POST');
        assert.equal(details.anonymous, true);
        assert.equal(details.timeout, 30000);
        assert.equal(details.headers, undefined);
        fetch(`http://127.0.0.1:${server.address().port}/upload-dlc`, {
            method: details.method, body: details.data,
        }).then(async response => details.onload({
            status: response.status, responseText: await response.text(),
        })).catch(details.onerror);
    });
    const bytes = new Uint8Array([0, 255, 128, 65, 13, 10]);
    const form = new FormData();
    const metadata = { link: 'https://filecrypt.cc/Container/test.html', name: 'Test container', size: '1 GB', referrer: 'unknown' };
    for (const [key, value] of Object.entries(metadata)) form.append(key, value);
    form.append('dlcfile', new Blob([bytes]), 'file.dlc');
    const result = await upload(form);
    assert.equal(result.links[0], 'https://example.com/download');
    assert.deepEqual(received.file.buffer, Buffer.from(bytes));
    assert.equal(received.file.originalname, 'file.dlc');
    assert.deepEqual({ ...received.fields }, metadata);
});

for (const [name, response, message] of [
    ['HTTP error', { status: 403, responseText: '<html>Blocked</html>' }, /HTTP 403/],
    ['invalid JSON', { status: 200, responseText: '<html>Challenge</html>' }, /invalid JSON/],
    ['empty links', { status: 200, responseText: '{"status":"success","links":[]}' }, /no valid links/],
    ['failed response with links', { status: 200, responseText: '{"status":"failed","links":["https://example.com"]}' }, /no valid links/],
    ['non-string link', { status: 200, responseText: '{"status":"success","links":[null]}' }, /no valid links/],
]) {
    test(`rejects ${name}`, async () => {
        await assert.rejects(loadUpload(details => details.onload(response))(new FormData()), message);
    });
}

for (const [event, message] of [['onerror', /connection/], ['ontimeout', /timed out/], ['onabort', /cancelled/]]) {
    test(`handles ${event}`, async () => {
        await assert.rejects(loadUpload(details => details[event]())(new FormData()), message);
    });
}

test('explains missing userscript permission', async () => {
    await assert.rejects(loadUpload(undefined)(new FormData()), /Update or reinstall/);
});
