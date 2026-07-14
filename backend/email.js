let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!nodemailer) return null;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host, port: parseInt(port) || 587, secure: port === '465',
    auth: { user, pass }
  });
  return transporter;
}

async function sendOrderConfirmation(order, config) {
  const transport = getTransporter();
  if (!transport) return;

  const email = order.client?.email || process.env.EMAIL_TO;
  if (!email) return;

  const itemsHtml = order.produits.map(item =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.nom}</td><td style="padding:8px;border-bottom:1px solid #eee">${item.taille || '-'}</td><td style="padding:8px;border-bottom:1px solid #eee">${item.couleur || '-'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantite}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.prix.toFixed(2)} DT</td></tr>`
  ).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1A1A1A;color:#FFFEF9;padding:20px;text-align:center">
        <h1 style="margin:0;font-size:24px;letter-spacing:4px">POINT VETEMENTS</h1>
      </div>
      <div style="padding:30px;background:#fff">
        <h2 style="color:#1A1A1A">Commande confirmee !</h2>
        <p>Bonjour ${order.client?.prenom || ''} ${order.client?.nom || ''},</p>
        <p>Votre commande <strong>#${order._id.substring(0, 8)}</strong> a ete recue et est en cours de traitement.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produit</th><th style="padding:8px;text-align:left">Taille</th><th style="padding:8px;text-align:left">Couleur</th><th style="padding:8px;text-align:center">Qte</th><th style="padding:8px;text-align:right">Prix</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;margin-top:20px">
          <p>Sous-total: <strong>${(order.montantTotal - (order.fraisLivraison || 8)).toFixed(2)} DT</strong></p>
          <p>Frais de livraison: <strong>${(order.fraisLivraison || 8).toFixed(2)} DT</strong></p>
          <p style="font-size:18px;color:#C62828">Total: <strong>${order.montantTotal.toFixed(2)} DT</strong></p>
        </div>
        <p style="margin-top:20px;color:#666">Adresse de livraison:<br>${order.client?.adresse || ''}, ${order.client?.ville || ''} ${order.client?.codePostal || ''}</p>
      </div>
      <div style="background:#f5f5f5;padding:15px;text-align:center;color:#666;font-size:12px">
        <p>Point Vetements - Votre destination mode en ligne</p>
      </div>
    </div>`;

  try {
    await transport.sendMail({
      from: `"Point Vetements" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Confirmation de commande #${order._id.substring(0, 8)}`,
      html
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

async function sendStatusUpdate(order, oldStatus, newStatus) {
  const transport = getTransporter();
  if (!transport) return;

  const email = order.client?.email || process.env.EMAIL_TO;
  if (!email) return;

  const statusLabels = {
    'en_preparation': 'Votre commande est en preparation',
    'expedie': 'Votre commande a ete expediee',
    'livre': 'Votre commande a ete livree',
    'annule': 'Votre commande a ete annulee'
  };

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1A1A1A;color:#FFFEF9;padding:20px;text-align:center">
        <h1 style="margin:0;font-size:24px;letter-spacing:4px">POINT VETEMENTS</h1>
      </div>
      <div style="padding:30px;background:#fff">
        <h2 style="color:#1A1A1A">Mise a jour de votre commande</h2>
        <p>Bonjour ${order.client?.prenom || ''} ${order.client?.nom || ''},</p>
        <p>La statut de votre commande <strong>#${order._id.substring(0, 8)}</strong> a ete mis a jour.</p>
        <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;text-align:center">
          <p style="font-size:16px;margin:0;color:#1A1A1A"><strong>${statusLabels[newStatus] || newStatus}</strong></p>
        </div>
        ${order.tracking_numero ? `<p>Numero de suivi: <strong>${order.tracking_numero}</strong></p>` : ''}
      </div>
      <div style="background:#f5f5f5;padding:15px;text-align:center;color:#666;font-size:12px">
        <p>Point Vetements - Votre destination mode en ligne</p>
      </div>
    </div>`;

  try {
    await transport.sendMail({
      from: `"Point Vetements" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Commande #${order._id.substring(0, 8)} - ${statusLabels[newStatus] || newStatus}`,
      html
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
