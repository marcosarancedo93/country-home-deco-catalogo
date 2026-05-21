// ─── Country — Guardar suscripción push ───────────────────
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID        = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID       = process.env.PUSH_TABLE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });

  try {
    // Verificar si ya existe ese endpoint
    const search = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${encodeURIComponent(`{Endpoint}="${subscription.endpoint}"`)}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    const existing = await search.json();
    if (existing.records?.length > 0) return res.status(200).json({ ok: true, existing: true });

    // Guardar nueva suscripción
    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{
          fields: {
            Endpoint: subscription.endpoint,
            Keys: JSON.stringify(subscription.keys || {}),
            Fecha: new Date().toISOString(),
            Activa: true
          }
        }]
      })
    });
    if (!resp.ok) throw new Error(await resp.text());
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
