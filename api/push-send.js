// ─── Country — Enviar push a todos los suscriptores ───────
import webpush from 'web-push';

const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN;
const BASE_ID           = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID          = process.env.PUSH_TABLE_ID;
const ADMIN_SECRET      = process.env.PUSH_ADMIN_SECRET;
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:country.homedeco.ar@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Protección simple con secret
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { title, body, url, image } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title y body son requeridos' });

  try {
    // Obtener todas las suscripciones activas de Airtable
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
        const subscription = { endpoint: record.fields.Endpoint, keys };
        return webpush.sendNotification(subscription, payload);
      })
    );

    const sent     = results.filter(r => r.status === 'fulfilled').length;
    const failed   = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({ ok: true, sent, failed, total: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
