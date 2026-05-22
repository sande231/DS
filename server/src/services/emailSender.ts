import { Resend } from 'resend';
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

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('SMTP configuration is incomplete. Please check RESEND_API_KEY environment variable.');
  }
  return new Resend(apiKey);
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
  const { date, senderName, cashPayments, cardPayments, cashTotal, cardTotal, notes, confidence } = payload;
  const now = new Date();
  const generatedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Daily Sales Summary</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:40px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Top bar -->
    <tr>
      <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:12px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="color:#94a3b8;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Sales Capture</td>
          <td align="right" style="color:#475569;font-size:11px;">Generated ${generatedTime}</td>
        </tr></table>
      </td>
    </tr>

    <!-- Hero Header -->
    <tr>
      <td style="background:linear-gradient(160deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%);padding:44px 40px 36px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;margin-bottom:16px;">📊</div>
        <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Daily Sales Summary</h1>
        <p style="margin:0;color:#93c5fd;font-size:15px;font-weight:500;">${escapeHtml(date)}</p>
        ${senderName ? `<p style="margin:8px 0 0;color:#bfdbfe;font-size:13px;">Prepared by <strong>${escapeHtml(senderName)}</strong></p>` : ''}
      </td>
    </tr>

    <!-- KPI Cards -->
    <tr>
      <td style="background:#1e3a8a;padding:0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>

          <td width="33%" style="padding:4px;">
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:18px 12px;text-align:center;">
              <div style="color:#67e8f9;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">💵 Cash</div>
              <div style="color:#ffffff;font-size:22px;font-weight:700;">${formatCurrency(cashTotal)}</div>
            </div>
          </td>

          <td width="33%" style="padding:4px;">
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:18px 12px;text-align:center;">
              <div style="color:#a5b4fc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">💳 Card</div>
              <div style="color:#ffffff;font-size:22px;font-weight:700;">${formatCurrency(cardTotal)}</div>
            </div>
          </td>

          <td width="33%" style="padding:4px;">
            <div style="background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.2));border:1px solid rgba(251,191,36,0.4);border-radius:10px;padding:18px 12px;text-align:center;">
              <div style="color:#fcd34d;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">⭐ Total</div>
              <div style="color:#fef3c7;font-size:22px;font-weight:700;">${formatCurrency(grandTotal)}</div>
            </div>
          </td>

        </tr></table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="background:#ffffff;padding:36px 40px;">

        <!-- Confidence -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">AI Extraction Confidence</td>
            <td align="right">${confidenceBadge(confidence)}</td>
          </tr>
        </table>

        <!-- Divider -->
        <div style="height:1px;background:#f1f5f9;margin-bottom:28px;"></div>

        <!-- Cash Payments -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td colspan="2" style="padding-bottom:12px;">
              <span style="font-size:15px;font-weight:700;color:#0f172a;">💵 Cash Payments</span>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
                  <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                </tr>
                ${buildPaymentRows(cashPayments, '#059669')}
                <tr style="background:#f0fdf4;border-top:2px solid #86efac;">
                  <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#166534;">Cash Subtotal</td>
                  <td style="padding:13px 16px;text-align:right;font-size:16px;font-weight:700;color:#166534;">${formatCurrency(cashTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Card Payments -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td colspan="2" style="padding-bottom:12px;">
              <span style="font-size:15px;font-weight:700;color:#0f172a;">💳 Card Payments</span>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
                  <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                </tr>
                ${buildPaymentRows(cardPayments, '#1d4ed8')}
                <tr style="background:#eff6ff;border-top:2px solid #93c5fd;">
                  <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#1e3a8a;">Card Subtotal</td>
                  <td style="padding:13px 16px;text-align:right;font-size:16px;font-weight:700;color:#1e3a8a;">${formatCurrency(cardTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Grand Total Banner -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${notes ? '24px' : '0'};">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:10px;padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <div style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Grand Total</div>
                  <div style="color:#e2e8f0;font-size:13px;">${escapeHtml(date)}</div>
                </td>
                <td align="right">
                  <div style="color:#fbbf24;font-size:36px;font-weight:800;letter-spacing:-1px;">${formatCurrency(grandTotal)}</div>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>

        ${notes ? `
        <!-- Notes -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">
              <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">📝 Extraction Notes</div>
              <div style="font-size:13px;color:#78350f;line-height:1.6;">${escapeHtml(notes)}</div>
            </td>
          </tr>
        </table>` : ''}

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:500;">Generated by <strong style="color:#64748b;">Sales Capture App</strong> · ${escapeHtml(date)}</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">Please verify all amounts against your original records before processing.</p>
      </td>
    </tr>

  </table>
  </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Sends a daily sales summary email via nodemailer SMTP.
 */
export async function sendSummaryEmail(payload: EmailSummaryPayload): Promise<void> {
  const resend = createResendClient();

  const html = buildHtmlEmail(payload);
  const grandTotal = payload.cashTotal + payload.cardTotal;

  const { error } = await resend.emails.send({
    from: 'Sales Capture <onboarding@resend.dev>',
    to: payload.recipientEmail,
    subject: `Daily Sales Summary - ${payload.date} | Total: $${grandTotal.toFixed(2)}`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
