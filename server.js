import express from 'express';
import cors from 'cors';
import multer from 'multer';
import https from 'https';

const app = express();

app.use(
    cors({
        origin: ['https://www.filecrypt.cc', 'https://filecrypt.cc'],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
    })
);

const PORT = 4000;
const upload = multer();

const agent = new https.Agent({ keepAlive: true });

app.get('/', (_, res) => {
    res.send('success.');
});

app.post('/upload-dlc', upload.single('dlcfile'), async (req, res) => {
    const dlcBuffer = req.file.buffer;

    const formData = new FormData();
    formData.append('dlcfile', new Blob([dlcBuffer]), 'file.dlc');

    const response = await fetch('https://dcrypt.it/decrypt/upload', {
        method: 'POST',
        body: formData,
        agent
    });

    const text = await response.text();

    const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
    if (!match) return res.status(500).send({ error: 'No textarea found' });

    let json;
    try {
        json = JSON.parse(match[1]);
    } catch (e) {
        return res.status(500).send({ error: 'Invalid JSON in textarea' });
    }

    const links = json?.success?.links ?? [];

    res.json({
        status: 'success',
        links: links,
    });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
