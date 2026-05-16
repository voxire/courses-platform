// ============================================================
// Voxire Course Platform Proposal: Form Submission Handler
// Vercel Serverless Function (Node.js runtime)
// ============================================================
//
// Receives form responses from courses-platform-proposal.html
// Emails the response to amounehabed@gmail.com via Resend.
//
// Required environment variables (set in Vercel project settings):
//   RESEND_API_KEY   - get from https://resend.com/api-keys
//   FROM_EMAIL       - sender address. Use onboarding@resend.dev
//                      until voxire.com is verified in Resend,
//                      then switch to proposals@voxire.com.
//   NOTIFY_EMAIL     - where to send the response. Defaults to
//                      amounehabed@gmail.com if not set.
// ============================================================

import { Resend } from 'resend';

const TO_EMAIL = process.env.NOTIFY_EMAIL || 'amounehabed@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Confirm API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable.');
    return res.status(500).json({ error: 'Server is not configured to send email. Contact Voxire directly.' });
  }

  try {
    const data = req.body || {};

    // Basic validation
    const required = ['name', 'email', 'company', 'niche'];
    const missing = required.filter(function (k) {
      return !data[k] || String(data[k]).trim() === '';
    });
    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields: ' + missing.join(', ') });
    }

    // Email format sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Build email content
    const html = buildEmailHtml(data);
    const text = buildEmailText(data);
    const safeName = escapeHtml(String(data.name).slice(0, 80));

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'Voxire Proposal Form <' + FROM_EMAIL + '>',
      to: TO_EMAIL,
      reply_to: String(data.email).trim(),
      subject: 'New course platform inquiry: ' + safeName,
      html: html,
      text: text
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(502).json({ error: 'Could not deliver email. Please contact Voxire directly.' });
    }

    return res.status(200).json({ success: true, id: result.data ? result.data.id : null });
  } catch (err) {
    console.error('Submit handler error:', err);
    return res.status(500).json({ error: 'Unexpected error. Please contact Voxire directly.' });
  }
}

// ----- Helpers --------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label, value) {
  if (value === undefined || value === null || value === '') return '';
  const v = Array.isArray(value) ? value.join(', ') : String(value);
  return '<tr><td style="padding:10px 14px;border-bottom:1px solid #232730;color:#8B8F9B;width:38%;vertical-align:top;font-size:13px;">' +
    escapeHtml(label) +
    '</td><td style="padding:10px 14px;border-bottom:1px solid #232730;color:#ECEDF1;font-size:14px;">' +
    escapeHtml(v).replace(/\n/g, '<br>') +
    '</td></tr>';
}

function buildEmailHtml(d) {
  const submittedAt = new Date().toISOString();
  const totalBlock = d.estimated_total
    ? '<div style="margin:0 0 24px;padding:18px 20px;background:linear-gradient(135deg,rgba(99,198,189,0.10),rgba(81,154,209,0.06) 55%,rgba(90,67,152,0.08));border:1px solid #63C6BD;border-radius:12px;text-align:center;">' +
        '<div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#63C6BD;font-weight:700;margin-bottom:6px;">Estimated Project Total</div>' +
        '<div style="font-size:28px;font-weight:700;color:#63C6BD;letter-spacing:-0.02em;line-height:1;margin-bottom:6px;">' + escapeHtml(d.estimated_total) + '</div>' +
        (d.estimated_breakdown ? '<div style="font-size:12px;color:#8B8F9B;">' + escapeHtml(d.estimated_breakdown) + '</div>' : '') +
      '</div>'
    : '';
  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:0;background:#0C0D11;font-family:Inter,Arial,sans-serif;">',
    '<div style="max-width:680px;margin:0 auto;padding:32px 20px;">',
      '<div style="background:#111118;border:1px solid #232730;border-radius:14px;padding:28px;">',
        '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#63C6BD;font-weight:600;margin-bottom:6px;">New Proposal Inquiry</div>',
        '<h1 style="margin:0 0 4px;font-size:22px;color:#ECEDF1;letter-spacing:-0.02em;">' + escapeHtml(d.name || '') + '</h1>',
        '<div style="color:#8B8F9B;font-size:14px;margin-bottom:24px;">' + escapeHtml(d.company || '') + ' &middot; ' + escapeHtml(d.email || '') + (d.phone ? ' &middot; ' + escapeHtml(d.phone) : '') + '</div>',
        totalBlock,
        '<table style="width:100%;border-collapse:collapse;">',
          row('Tier interest', d.tier),
          row('Add-ons selected', d.addons),
          row('Subject / niche', d.niche),
          row('Business stage', d.business_stage),
          row('Target learner', d.target_learner),
          row('Course count at launch', d.course_count),
          row('Content type', d.content_type),
          row('Instructor count', d.instructor_count),
          row('Total video hours', d.video_hours),
          row('Sales model', d.sales_model),
          row('Price range per course', d.price_range),
          row('Existing audience', d.audience),
          row('Payment gateway', d.payment_gateway),
          row('Domain', d.domain),
          row('Language(s)', d.language),
          row('Branding', d.branding),
          row('Launch target', d.launch_target),
          row('Budget range', d.budget),
          row('Notes', d.notes),
        '</table>',
        '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #232730;color:#5C6068;font-size:12px;">',
          'Submitted ' + submittedAt + ' via the Voxire course platform proposal form.',
        '</div>',
      '</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

function buildEmailText(d) {
  function line(label, value) {
    if (value === undefined || value === null || value === '') return null;
    const v = Array.isArray(value) ? value.join(', ') : String(value);
    return label + ': ' + v;
  }
  const lines = [
    'NEW PROPOSAL INQUIRY',
    '',
    line('Name', d.name),
    line('Email', d.email),
    line('Company', d.company),
    line('Phone', d.phone),
    '',
    line('ESTIMATED PROJECT TOTAL', d.estimated_total),
    line('Breakdown', d.estimated_breakdown),
    '',
    line('Tier interest', d.tier),
    line('Add-ons', d.addons),
    '',
    '--- Business ---',
    line('Subject / niche', d.niche),
    line('Business stage', d.business_stage),
    line('Target learner', d.target_learner),
    '',
    '--- Content ---',
    line('Course count', d.course_count),
    line('Content type', d.content_type),
    line('Instructor count', d.instructor_count),
    line('Total video hours', d.video_hours),
    '',
    '--- Business model ---',
    line('Sales model', d.sales_model),
    line('Price range per course', d.price_range),
    line('Existing audience', d.audience),
    '',
    '--- Technical ---',
    line('Payment gateway', d.payment_gateway),
    line('Domain', d.domain),
    line('Language(s)', d.language),
    line('Branding', d.branding),
    '',
    '--- Timeline & budget ---',
    line('Launch target', d.launch_target),
    line('Budget', d.budget),
    '',
    line('Notes', d.notes),
    '',
    'Submitted ' + new Date().toISOString()
  ];
  return lines.filter(function (l) { return l !== null; }).join('\n');
}
