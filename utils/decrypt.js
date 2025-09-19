export default async function decryptDLC(dlcBuffer, agent) {
  const formData = new FormData()
  formData.append('dlcfile', new Blob([dlcBuffer]), 'file.dlc')

  const response = await fetch('https://dcrypt.it/decrypt/upload', {
    method: 'POST',
    body: formData,
    agent,
  })

  if (!response.ok) {
    throw new Error('Decrypt service failed')
  }

  const text = await response.text()
  const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i)
  if (!match) throw new Error('No textarea found')

  let json
  try {
    json = JSON.parse(match[1])
  } catch {
    throw new Error('Invalid JSON in textarea')
  }

  return json?.success?.links ?? []
}