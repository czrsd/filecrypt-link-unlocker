export default async function validateInput(req) {
    if (!req.files?.['dlcfile']?.[0])
     throw new Error('Missing dlcfile')

    const dlcBuffer = req.files['dlcfile'][0].buffer
    const { link, name, size, referrer } = req.body

    if (!link || typeof link !== 'string' || !/^https?:\/\/\S+$/.test(link))
        throw new Error('Invalid link')

    if (!name || typeof name !== 'string' || name.trim().length < 2)
        throw new Error('Invalid name')

    if (!size || typeof size !== 'string')
        throw new Error('Missing size')

    const sizeMatch = size.match(/([\d.]+)\s*(GB|MB|KB)/i)
    if (!sizeMatch)
        throw new Error('Invalid size format')

    if (!referrer || typeof referrer !== 'string' || (referrer !== 'unknown' && !referrer.includes('http')))
        throw new Error('Missing referrer');

    return { dlcBuffer, link, name, size, referrer }
}