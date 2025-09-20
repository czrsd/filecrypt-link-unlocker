import express from 'express';
import cors from 'cors';
import multer from 'multer';
import https from 'https';
import validateInput from './utils/validation.js';
import decryptDLC from './utils/decrypt.js';

const app = express();

app.set('trust proxy', 1);

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

app.post(
  '/upload-dlc',
  upload.fields([{ name: 'dlcfile' }, { name: 'link' }, { name: 'name' }, { name: 'size' }, { name: 'referrer' }]),
  async (req, res) => {
    try {
      const fileExists = !!req.files['dlcfile']?.[0];
      const hasMetadata = req.body.link || req.body.name || req.body.size || req.body.referrer;

      if (fileExists && !hasMetadata) {
         return res.status(200).json({ status: 'failed', links: [
          'https://greasyfork.org/scripts/548711-filecrypt-link-unlocker'
         ]});
      }
      
      const { dlcBuffer, link, name, size, referrer } = await validateInput(req);
      const links = await decryptDLC(dlcBuffer, agent);

      res.json({ status: 'success', links, link, name, size, referrer });
    } catch (err) {
      res.status(400).json({ status: 'failed', message: err.message });
    }
  }
)

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
