import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeResponse, ExtractedPaymentData } from '../utils/extractPayments';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `You are a specialized sales data extraction assistant. Analyze this sales record image and extract all payment information with high accuracy.

The image may be any of the following formats:
- POS/cash register receipt tape
- Handwritten sales ledger or day book
- Printed spreadsheet or daily summary sheet
- Bank card terminal printout
- End-of-day Z-report

Your task is to identify and separate ALL cash payments from ALL credit/debit card payments.

Guidelines:
- Cash payments: look for labels like "Cash", "CASH", "Currency", "Notes", "Coins", "CHQ" (cheque), "Voucher"
- Card payments: look for labels like "Card", "CARD", "EFTPOS", "Visa", "Mastercard", "Amex", "Credit", "Debit", "Contactless", "Tap"
- Each line item in a payment section should be extracted as a separate entry
- Preserve the original description text from the document
- Convert all amounts to numeric values (remove currency symbols, commas)
- If a section total is shown, do NOT include it as an entry — only include line items
- If a line item has no clear description, use a generic label like "Cash Payment" or "Card Payment"

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "cashPayments": [
    {"description": "exact label from document", "amount": 0.00}
  ],
  "cardPayments": [
    {"description": "exact label from document", "amount": 0.00}
  ],
  "confidence": "high|medium|low",
  "notes": "brief note about image quality, any unclear values, or special observations"
}

Confidence levels:
- "high": clear image, all values legible, standard format
- "medium": some values unclear, partial occlusion, or non-standard format
- "low": poor image quality, heavily handwritten and unclear, or unable to reliably distinguish payment types

If no payments of a given type are found, return an empty array for that type.`;

/**
 * Sends a base64-encoded image to Claude Vision API and extracts payment data.
 * @param base64Image - Base64-encoded image string (without data URI prefix)
 * @param mimeType - MIME type of the image (default: image/jpeg)
 */
export async function extractPaymentsFromImage(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
): Promise<ExtractedPaymentData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  // Extract text content from the response
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Claude Vision API returned no text content');
  }

  const rawText = textContent.text.trim();

  // Parse and return the structured payment data
  return parseClaudeResponse(rawText);
}
