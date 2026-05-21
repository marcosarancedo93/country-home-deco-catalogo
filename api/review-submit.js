// ─── Country — Guardar reseña de cliente ─────────────────
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID        = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID       = process.env.REVIEWS_TABLE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { product, author, location, stars, text } = req.body;
  if (!product || !author || !stars || !text) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Product:  product,
            Author:   author,
            Location: location || '',
            Stars:    Number(stars),
            Text:     text,
            Fecha:    new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
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
