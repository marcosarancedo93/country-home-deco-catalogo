const nodemailer = require('nodemailer');

const fmt = n => '$' + Math.round(Number(n)).toLocaleString('es-AR');

const GMAIL = 'country.homedeco.ar@gmail.com';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL,
      pass: process.env.GMAIL_PASS
    }
  });
}

async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  const result = await transporter.sendMail({
    from: `Country Home Deco <${GMAIL}>`,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html
  });
  return result;
}

// Email para Marco (interno)
function buildAdminHTML({ buyer, items, shipping, total, paymentId, type }) {
  const itemsHTML = (items || []).map(i =>
    `<tr>
      <td style="padding:6px 0;border-bottom:1px solid #f0e8d8;">${i.name || i.title}</td>
      <td style="padding:6px 0;border-bottom:1px solid #f0e8d8;text-align:center;">${i.qty || i.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px solid #f0e8d8;text-align:right;">${fmt((i.price || i.unit_price) * (i.qty || i.quantity))}</td>
    </tr>`
  ).join('');

  const badge = type === 'transfer'
    ? `<span style="background:#5a7a4a;color:white;padding:4px 12px;border-radius:20px;font-size:0.8em;">🏦 Transferencia pendiente</span>`
    : `<span style="background:#009ee3;color:white;padding:4px 12px;border-radius:20px;font-size:0.8em;">💳 Pago con Mercado Pago</span>`;

  return `
  <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#faf7f3;border-radius:8px;overflow:hidden;">
    <div style="background:#2c1f0e;padding:24px 28px;text-align:center;">
      <div style="font-size:1.8em;font-weight:300;letter-spacing:10px;color:#f5ead8;text-transform:uppercase;">Country</div>
      <div style="font-size:0.7em;letter-spacing:4px;color:#c4a87a;margin-top:4px;">NUEVA VENTA</div>
    </div>
    <div style="padding:24px 28px;">
      <div style="margin-bottom:16px;">${badge}</div>
      <h3 style="margin:0 0 12px;color:#2c1f0e;font-size:1em;">Comprador</h3>
      <table style="width:100%;font-size:0.88em;color:#3a2e20;margin-bottom:20px;">
        <tr><td style="color:#8a6840;width:110px;">Nombre</td><td><strong>${buyer?.name || '—'}</strong></td></tr>
        <tr><td style="color:#8a6840;">Teléfono</td><td>${buyer?.phone || '—'}</td></tr>
        <tr><td style="color:#8a6840;">Email</td><td>${buyer?.email || '—'}</td></tr>
        <tr><td style="color:#8a6840;">Dirección</td><td>${buyer?.address || '—'}</td></tr>
        ${buyer?.notes ? `<tr><td style="color:#8a6840;">Notas</td><td>${buyer.notes}</td></tr>` : ''}
      </table>
      <h3 style="margin:0 0 12px;color:#2c1f0e;font-size:1em;">Productos</h3>
      <table style="width:100%;font-size:0.88em;color:#3a2e20;margin-bottom:20px;">
        <thead><tr>
          <th style="text-align:left;color:#8a6840;font-weight:400;padding-bottom:6px;">Producto</th>
          <th style="text-align:center;color:#8a6840;font-weight:400;padding-bottom:6px;">Cant.</th>
          <th style="text-align:right;color:#8a6840;font-weight:400;padding-bottom:6px;">Subtotal</th>
        </tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <table style="width:100%;font-size:0.9em;color:#3a2e20;">
        <tr><td style="color:#8a6840;">Envío — ${shipping?.label || '—'}</td><td style="text-align:right;">${fmt(shipping?.cost || 0)}</td></tr>
        <tr><td style="font-weight:700;font-size:1.05em;padding-top:8px;">TOTAL</td><td style="text-align:right;font-weight:700;font-size:1.05em;padding-top:8px;">${fmt(total)}</td></tr>
      </table>
      ${paymentId ? `<p style="font-size:0.78em;color:#8a6840;margin-top:16px;">ID de pago MP: ${paymentId}</p>` : ''}
      ${type === 'transfer' ? `<div style="background:#f5ead8;border:1px solid #c4a87a;border-radius:4px;padding:12px;margin-top:16px;font-size:0.85em;"><strong>Verificar transferencia:</strong> Alias <strong>countryhomedeco</strong> · CVU 0000003100099040747536 · Monto esperado: <strong>${fmt(total)}</strong></div>` : ''}
    </div>
    <div style="background:#2c1f0e;padding:12px 28px;text-align:center;font-size:0.75em;color:#c4a87a;letter-spacing:2px;">COUNTRY HOME & DECO</div>
  </div>`;
}

// Email para el comprador (confirmación)
function buildBuyerHTML({ buyerName, items, shipping, total, type }) {
  const itemsHTML = (items || []).map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-size:0.88em;color:#3a2e20;">${i.name || i.title}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:center;font-size:0.88em;color:#8a6840;">${i.qty || i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:right;font-size:0.88em;color:#3a2e20;">${fmt((i.price || i.unit_price) * (i.qty || i.quantity))}</td>
    </tr>`
  ).join('');

  const paymentNote = type === 'transfer'
    ? `<div style="background:#f5ead8;border-left:3px solid #c4a87a;padding:10px 14px;margin-bottom:16px;font-size:0.85em;color:#3a2e20;"><strong>Próximo paso:</strong> Verificamos tu transferencia y te confirmamos el envío.</div>`
    : `<div style="background:#f5ead8;border-left:3px solid #c4a87a;padding:10px 14px;margin-bottom:16px;font-size:0.85em;color:#3a2e20;"><strong>Pago acreditado.</strong> Estamos preparando tu pedido para enviarlo.</div>`;

  const reviewLinks = (items || []).map(i => {
    const nombre = i.name || i.title || '';
    const link = `https://countryhomedeco.vercel.app/?resena=${encodeURIComponent(nombre)}`;
    return `<a href="${link}" style="display:inline-block;margin:4px;padding:7px 14px;background:#2c1f0e;color:#f5ead8;border-radius:20px;font-size:0.8em;text-decoration:none;">⭐ Opinar sobre ${nombre}</a>`;
  }).join('');

  const B = 'https://countryhomedeco.vercel.app/collage';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px 0;background:#e8e0d5;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#f5f0eb;">

  <tr>
    <td colspan="3" style="padding:0;line-height:0;">
      <img src="${B}/strip_top.jpg" width="600" height="160" style="display:block;width:600px;height:160px;object-fit:cover;" alt="" />
    </td>
  </tr>

  <tr>
    <td width="80" valign="top" style="padding:0;line-height:0;background:#2c1f0e;">
      <img src="${B}/strip_left.jpg" width="80" style="display:block;width:80px;" alt="" />
    </td>

    <td width="440" valign="top" style="padding:0;background:#ffffff;">
      <table width="440" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#2c1f0e;padding:22px 20px;text-align:center;">
            <div style="font-size:22px;font-weight:300;letter-spacing:8px;color:#f5ead8;text-transform:uppercase;font-family:Georgia,serif;">Country</div>
            <div style="width:50px;height:1px;background:#c4a87a;margin:6px auto;"></div>
            <div style="font-size:10px;letter-spacing:4px;color:#c4a87a;text-transform:uppercase;font-family:Arial,sans-serif;">Home &amp; Deco</div>
          </td>
        </tr>
        <tr>
          <td style="background:#f5ead8;padding:22px 20px;text-align:center;">
            <div style="font-size:20px;color:#2c1f0e;font-weight:300;font-family:Georgia,serif;">¡Gracias por tu compra, ${(buyerName || '').split(' ')[0]}!</div>
            <div style="font-size:13px;color:#6a4f30;margin-top:8px;line-height:1.6;font-family:Arial,sans-serif;">Recibimos tu pedido y ya estamos trabajando en él.<br>Te avisamos cuando esté listo para despachar.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;font-family:Arial,sans-serif;">
            ${paymentNote}
            <p style="margin:0 0 10px;color:#2c1f0e;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Tu pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <thead><tr>
                <th style="text-align:left;color:#8a6840;font-weight:400;font-size:11px;padding-bottom:6px;">Producto</th>
                <th style="text-align:center;color:#8a6840;font-weight:400;font-size:11px;padding-bottom:6px;">Cant.</th>
                <th style="text-align:right;color:#8a6840;font-weight:400;font-size:11px;padding-bottom:6px;">Subtotal</th>
              </tr></thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#3a2e20;">
              <tr><td style="color:#8a6840;padding:3px 0;">Envío — ${shipping?.label || '—'}</td><td style="text-align:right;">${fmt(shipping?.cost || 0)}</td></tr>
              <tr><td style="font-weight:700;padding-top:8px;border-top:2px solid #2c1f0e;">TOTAL</td><td style="text-align:right;font-weight:700;padding-top:8px;border-top:2px solid #2c1f0e;">${fmt(total)}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#f5ead8;border-radius:6px;text-align:center;">
              <div style="font-size:13px;font-weight:600;color:#2c1f0e;margin-bottom:4px;">Contanos cómo te fue 🙏</div>
              <div style="font-size:11px;color:#6a4f30;margin-bottom:10px;">Tu opinión ayuda a otros clientes.</div>
              ${reviewLinks}
            </div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid #f0e8d8;text-align:center;font-size:12px;color:#8a6840;line-height:1.8;">
              ¿Consultas? <a href="https://wa.me/541131655653" style="color:#2c1f0e;font-weight:600;text-decoration:none;">+54 9 11 3165-5653</a>
              &nbsp;·&nbsp;
              <a href="https://instagram.com/country.homedeco" style="color:#2c1f0e;font-weight:600;text-decoration:none;">@country.homedeco</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#2c1f0e;padding:14px 20px;text-align:center;">
            <div style="font-size:10px;letter-spacing:3px;color:#c4a87a;text-transform:uppercase;font-family:Arial,sans-serif;">Feel at Home</div>
          </td>
        </tr>
      </table>
    </td>

    <td width="80" valign="top" style="padding:0;line-height:0;background:#2c1f0e;">
      <img src="${B}/strip_right.jpg" width="80" style="display:block;width:80px;" alt="" />
    </td>
  </tr>

  <tr>
    <td colspan="3" style="padding:0;line-height:0;">
      <img src="${B}/strip_bottom.jpg" width="600" height="160" style="display:block;width:600px;height:160px;object-fit:cover;" alt="" />
    </td>
  </tr>

</table>
</body></html>`;
}
module.exports = { sendEmail, buildAdminHTML, buildBuyerHTML };
