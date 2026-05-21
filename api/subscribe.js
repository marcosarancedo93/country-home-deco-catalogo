// ─── Country CRM — Endpoint suscripción ──────────────────
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appOAZAqWbeldiKlR';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblq9UlPCy4ZOpVdY';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { nombre, whatsapp, email, ciudad, barrio, gps_lat, gps_lng, acepta_ubicacion, dispositivo, canal } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const record = {
      fields: {
        Nombre: nombre || '',
        WhatsApp: whatsapp || '',
        Email: email || '',
        Ciudad: ciudad || '',
        Barrio: barrio || '',
        Dispositivo: dispositivo || '',
        Canal: canal || 'Sitio web',
        GPS_Lat: gps_lat ? String(gps_lat) : '',
        GPS_Lng: gps_lng ? String(gps_lng) : '',
        Acepta_Ubicacion: acepta_ubicacion === true,
        Fecha: new Date().toISOString(),
        Estado: 'Frio'
      }
    };

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [record] })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
