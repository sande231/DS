import nodemailer from 'nodemailer';
import { PaymentEntry } from '../utils/extractPayments';

export interface EmailSummaryPayload {
  date: string;
  recipientEmail: string;
  senderName: string;
  cashPayments: PaymentEntry[];
  cardPayments: PaymentEntry[];
  cashTotal: number;
  cardTotal: number;
  notes?: string;
  confidence: 'high' | 'medium' | 'low';
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function buildPaymentRows(payments: PaymentEntry[], color: string): string {
  if (payments.length === 0) {
    return `<tr><td colspan="2" style="padding:10px 16px; color:#9ca3af; font-style:italic;">No entries recorded</td></tr>`;
  }
  return payments
    .map(
      (p) => `
    <tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:10px 16px; color:#374151; font-size:14px;">${escapeHtml(p.description)}</td>
      <td style="padding:10px 16px; text-align:right; color:${color}; font-weight:600; font-size:14px; white-space:nowrap;">${formatCurrency(p.amount)}</td>
    </tr>`
    )
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function confidenceBadge(confidence: 'high' | 'medium' | 'low'): string {
  const styles: Record<string, string> = {
    high: 'background:#d1fae5; color:#065f46; border:1px solid #6ee7b7;',
    medium: 'background:#fef3c7; color:#92400e; border:1px solid #fcd34d;',
    low: 'background:#fee2e2; color:#991b1b; border:1px solid #fca5a5;',
  };
  const labels: Record<string, string> = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence — Please Verify',
  };
  return `<span style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; ${styles[confidence]}">${labels[confidence]}</span>`;
}

function buildHtmlEmail(payload: EmailSummaryPayload): string {
  const grandTotal = payload.cashTotal + payload.cardTotal;
  const {
    date,
    senderName,
    cashPayments,
    cardPayments,
    cashTotal,
    cardTotal,
    notes,
    confidence,
  } = payload;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Sales Summary</title>
</head>
<body style="margin:0; padding:0; background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6); border-radius:12px 12px 0 0; padding:32px; text-align:center;">
              <div style="font-size:28px; margin-bottom:8px;">💰</div>
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">Daily Sales Summary</h1>
              <p style="margin:8px 0 0; color:#bfdbfe; font-size:15px;">${escapeHtml(date)}</p>
              ${senderName ? `<p style="margin:4px 0 0; color:#93c5fd; font-size:13px;">Prepared by ${escapeHtml(senderName)}</p>` : ''}
            </td>
          </tr>

          <!-- Totals Banner -->
          <tr>
            <td style="background:#1e40af; padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center; border-right:1px solid #3b82f6; padding-right:16px;">
                    <div style="color:#93c5fd; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Cash Total</div>
                    <div style="color:#ffffff; font-size:26px; font-weight:700;">${formatCurrency(cashTotal)}</div>
                  </td>
                  <td style="text-align:center; border-right:1px solid #3b82f6; padding:0 16px;">
                    <div style="color:#93c5fd; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Card Total</div>
                    <div style="color:#ffffff; font-size:26px; font-weight:700;">${formatCurrency(cardTotal)}</div>
                  </td>
                  <td style="text-align:center; padding-left:16px;">
                    <div style="color:#fbbf24; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Grand Total</div>
                    <div style="color:#fef3c7; font-size:26px; font-weight:700;">${formatCurrency(grandTotal)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background:#ffffff; padding:32px; border-radius:0 0 12px 12px; box-shadow:0 4px 6px rgba(0,0,0,0.07);">

              <!-- Confidence Badge -->
              <div style="margin-bottom:24px; display:flex; align-items:center;">
                <span style="font-size:13px; color:#6b7280; margin-right:8px;">Extraction confidence:</span>
                ${confidenceBadge(confidence)}
              </div>

              <!-- Cash Payments Section -->
              <h2 style="margin:0 0 12px; font-size:16px; font-weight:700; color:#1f2937; display:flex; align-items:center; gap:8px;">
                💵 Cash Payments
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px; text-align:left; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Description</th>
                    <th style="padding:10px 16px; text-align:right; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildPaymentRows(cashPayments, '#059669')}
                </tbody>
                <tfoot>
                  <tr style="background:#ecfdf5; border-top:2px solid #6ee7b7;">
                    <td style="padding:12px 16px; font-weight:700; color:#065f46; font-size:14px;">Cash Subtotal</td>
                    <td style="padding:12px 16px; text-align:right; font-weight:700; color:#065f46; font-size:16px;">${formatCurrency(cashTotal)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="height:24px;"></div>

              <!-- Card Payments Section -->
              <h2 style="margin:0 0 12px; font-size:16px; font-weight:700; color:#1f2937;">
                💳 Card Payments
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px; text-align:left; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Description</th>
                    <th style="padding:10px 16px; text-align:right; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildPaymentRows(cardPayments, '#2563eb')}
                </tbody>
                <tfoot>
                  <tr style="background:#eff6ff; border-top:2px solid #93c5fd;">
                    <td style="padding:12px 16px; font-weight:700; color:#1e40af; font-size:14px;">Card Subtotal</td>
                    <td style="padding:12px 16px; text-align:right; font-weight:700; color:#1e40af; font-size:16px;">${formatCurrency(cardTotal)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="height:24px;"></div>

              <!-- Grand Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6); border-radius:10px; overflow:hidden;">
                <tr>
                  <td style="padding:18px 20px; color:#bfdbfe; font-weight:700; font-size:15px; text-transform:uppercase; letter-spacing:0.5px;">Grand Total</td>
                  <td style="padding:18px 20px; text-align:right; color:#ffffff; font-weight:800; font-size:24px;">${formatCurrency(grandTotal)}</td>
                </tr>
              </table>

              ${
                notes
                  ? `<div style="margin-top:24px; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:14px 16px;">
                <p style="margin:0; font-size:13px; font-weight:600; color:#92400e; margin-bottom:4px;">📝 Notes</p>
                <p style="margin:0; font-size:13px; color:#78350f;">${escapeHtml(notes)}</p>
              </div>`
                  : ''
              }

              <!-- Footer -->
              <div style="margin-top:32px; padding-top:20px; border-top:1px solid #f3f4f6; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">Generated by Sales Capture App · ${escapeHtml(date)}</p>
                <p style="margin:4px 0 0; font-size:11px; color:#d1d5db;">This is an automated summary. Please verify amounts against original records.</p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a daily sales summary email via nodemailer SMTP.
 */
export async function sendSummaryEmail(payload: EmailSummaryPayload): Promise<void> {
  const transporter = createTransporter();

  const html = buildHtmlEmail(payload);
  const grandTotal = payload.cashTotal + payload.cardTotal;

  const mailOptions = {
    from: `"${payload.senderName || 'Sales Capture'}" <${process.env.SMTP_USER}>`,
    to: payload.recipientEmail,
    subject: `Daily Sales Summary - ${payload.date} | Total: $${grandTotal.toFixed(2)}`,
    html,
    text: [
      `Daily Sales Summary - ${payload.date}`,
      '',
      `Cash Total:  $${payload.cashTotal.toFixed(2)}`,
      `Card Total:  $${payload.cardTotal.toFixed(2)}`,
      `Grand Total: $${grandTotal.toFixed(2)}`,
      '',
      'Cash Payments:',
      ...payload.cashPayments.map((p) => `  ${p.description}: $${p.amount.toFixed(2)}`),
      '',
      'Card Payments:',
      ...payload.cardPayments.map((p) => `  ${p.description}: $${p.amount.toFixed(2)}`),
      '',
      payload.notes ? `Notes: ${payload.notes}` : '',
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
  };

  await transporter.sendMail(mailOptions);
}
