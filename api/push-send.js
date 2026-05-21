// ─── Country — Enviar push a todos los suscriptores ───────
import webpush from 'web-push';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID        = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID       = process.env.PUSH_TABLE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Auth — leemos el secret dentro del handler para que tome el env var al momento de ejecución
  const ADMIN_SECRET = process.env.PUSH_ADMIN_SECRET;
  const sent_secret  = (req.headers['x-admin-secret'] || '').trim();

  if (!ADMIN_SECRET || sent_secret !== ADMIN_SECRET.trim()) {
    return res.status(401).json({ error: 'No autorizado', debug: !ADMIN_SECRET ? 'secret_not_configured' : 'wrong_secret' });
  }

  const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys no configuradas' });
  }

  webpush.setVapidDetails('mailto:country.homedeco.ar@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const { title, body, url, image } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title y body son requeridos' });

  try {
    let subs = [], offset = '';
    do {
      const r = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={Activa}=1${offset ? '&offset=' + offset : ''}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      );
      const data = await r.json();
      subs.push(...(data.records || []));
      offset = data.offset || '';
    } while (offset);

    const payload = JSON.stringify({ title, body, url: url || '/', image });
    const results = await Promise.allSettled(
      subs.map(record => {
        const keys = JSON.parse(record.fields.Keys || '{}');
        return webpush.sendNotification({ endpoint: record.fields.Endpoint, keys }, payload);
      })
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    return res.status(200).json({ ok: true, sent, failed, total: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
