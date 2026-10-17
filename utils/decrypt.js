export default async function decryptDLC(dlcBuffer, agent) {
  try {
    const pasteFormData = new FormData();
    pasteFormData.append('content', dlcBuffer.toString('utf8'));

    const res = await fetch('https://dcrypt.it/decrypt/paste', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
      },
      body: pasteFormData,
      agent,
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.success?.links) && data.success.links.length > 0) {
        return data.success.links;
      }
    }
  } catch (err) {
  }

  // File upload fallback
  const formData = new FormData();
  formData.append('dlcfile', new Blob([dlcBuffer]), 'file.dlc');

  const response = await fetch('https://dcrypt.it/decrypt/upload', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
    },
    body: formData,
    agent,
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error('Decrypt service failed');
  }

  const text = await response.text();
  const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
  if (!match) throw new Error('No textarea found');

  let json;
  try {
    json = JSON.parse(match[1]);
  } catch {
    throw new Error('Invalid JSON in textarea');
  }

  return json?.success?.links ?? [];
}