export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');
  if (!backendUrl) {
    return res.status(500).json({ message: 'The API is not configured. Set BACKEND_URL in Vercel.' });
  }

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('connection');

  const options = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = req.body === undefined
      ? req
      : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (options.body === req) options.duplex = 'half';
  }

  try {
    const upstream = await fetch(`${backendUrl}${req.url}`, options);
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie' && key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });
    const cookies = upstream.headers.getSetCookie?.();
    if (cookies?.length) res.setHeader('set-cookie', cookies);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (_error) {
    res.status(502).json({ message: 'The API server could not be reached. Check its deployment and BACKEND_URL.' });
  }
}
