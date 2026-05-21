// ─── Country — Obtener reseñas por producto ───────────────
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID        = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID       = process.env.REVIEWS_TABLE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { product } = req.query;
  if (!product) return res.status(400).json({ error: 'product requerido' });

  try {
    const formula = encodeURIComponent(`{Product}="${product}"`);
    const r = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${formula}&sort[0][field]=Fecha&sort[0][direction]=desc`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    const data = await r.json();
    const reviews = (data.records || []).map(rec => ({
      author:   rec.fields.Author   || '',
      location: rec.fields.Location || '',
      stars:    rec.fields.Stars    || 5,
      text:     rec.fields.Text     || '',
      date:     rec.fields.Fecha    || ''
    }));
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ reviews });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
