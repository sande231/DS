import { Router, Request, Response } from 'express';
import { sendSummaryEmail, EmailSummaryPayload } from '../services/emailSender';

const router = Router();

/**
 * POST /api/email/send-summary
 * Body: EmailSummaryPayload
 * Sends a daily sales summary email via SMTP.
 */
router.post('/send-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as EmailSummaryPayload;

    // Validate required fields
    if (!payload.recipientEmail || typeof payload.recipientEmail !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid "recipientEmail" field.',
      });
      return;
    }

    if (!payload.date || typeof payload.date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid "date" field.',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.recipientEmail)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email address format for "recipientEmail".',
      });
      return;
    }

    // Ensure payment arrays exist (default to empty arrays)
    const normalizedPayload: EmailSummaryPayload = {
      ...payload,
      cashPayments: Array.isArray(payload.cashPayments) ? payload.cashPayments : [],
      cardPayments: Array.isArray(payload.cardPayments) ? payload.cardPayments : [],
      cashTotal: typeof payload.cashTotal === 'number' ? payload.cashTotal : 0,
      cardTotal: typeof payload.cardTotal === 'number' ? payload.cardTotal : 0,
      confidence: payload.confidence || 'low',
      senderName: payload.senderName || 'Sales Capture',
    };

    console.log(
      `[Email] Sending summary to ${normalizedPayload.recipientEmail} for date: ${normalizedPayload.date}`
    );

    await sendSummaryEmail(normalizedPayload);

    console.log(`[Email] Summary email sent successfully to ${normalizedPayload.recipientEmail}`);

    res.json({
      success: true,
      message: `Daily sales summary sent to ${normalizedPayload.recipientEmail}`,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Email] Send error:', error.message);

    if (error.message.includes('SMTP configuration')) {
      res.status(503).json({
        success: false,
        error: 'Email service is not configured. Please check SMTP environment variables.',
        details: error.message,
      });
      return;
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      res.status(503).json({
        success: false,
        error: 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT settings.',
        details: error.message,
      });
      return;
    }

    if (error.message.includes('Invalid login') || error.message.includes('Authentication')) {
      res.status(401).json({
        success: false,
        error: 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS credentials.',
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again.',
      details: error.message,
    });
  }
});

export default router;
