import type { NextApiRequest, NextApiResponse } from 'next';
import { requireCloudflareEnv } from '@/lib/cloudflare';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query;
  const objectKey = Array.isArray(key) ? key.join('/') : key;
  if (!objectKey) {
    return res.status(400).json({ error: 'Missing object key' });
  }

  try {
    const bucket = requireCloudflareEnv('MEDIA_BUCKET');
    const object = await bucket.get(objectKey);
    if (!object?.body) {
      return res.status(404).send('Not found');
    }

    res.setHeader('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    if (object.size) {
      res.setHeader('Content-Length', object.size.toString());
    }

    // Stream the body to the response using standard ReadableStream reader
    const reader = (object.body as unknown as ReadableStream).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in media-download endpoint:', message);
    return res.status(500).json({ error: message });
  }
}
