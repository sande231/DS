export interface PaymentEntry {
  description: string;
  amount: number;
}

export interface ExtractedPaymentData {
  cashPayments: PaymentEntry[];
  cardPayments: PaymentEntry[];
  cashTotal: number;
  cardTotal: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface RawClaudeResponse {
  cashPayments: Array<{ description: string; amount: number }>;
  cardPayments: Array<{ description: string; amount: number }>;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Parses the raw JSON response from Claude Vision API and calculates totals.
 */
export function parseClaudeResponse(rawJson: string): ExtractedPaymentData {
  let parsed: RawClaudeResponse;

  // Attempt to extract JSON from a fenced code block if present
  const fenceMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonString = fenceMatch ? fenceMatch[1].trim() : rawJson.trim();

  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`Failed to parse Claude response as JSON: ${(err as Error).message}`);
  }

  // Validate and sanitize cash payments
  const cashPayments: PaymentEntry[] = Array.isArray(parsed.cashPayments)
    ? parsed.cashPayments.map(sanitizeEntry)
    : [];

  // Validate and sanitize card payments
  const cardPayments: PaymentEntry[] = Array.isArray(parsed.cardPayments)
    ? parsed.cardPayments.map(sanitizeEntry)
    : [];

  // Calculate totals
  const cashTotal = sumPayments(cashPayments);
  const cardTotal = sumPayments(cardPayments);

  // Validate confidence level
  const validConfidences: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  const confidence: 'high' | 'medium' | 'low' = validConfidences.includes(
    parsed.confidence as 'high' | 'medium' | 'low'
  )
    ? parsed.confidence
    : 'low';

  return {
    cashPayments,
    cardPayments,
    cashTotal,
    cardTotal,
    confidence,
    notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
  };
}

/**
 * Sanitizes a single payment entry, ensuring description is a string and amount is a finite number.
 */
function sanitizeEntry(entry: { description?: unknown; amount?: unknown }): PaymentEntry {
  const description =
    typeof entry.description === 'string' && entry.description.trim().length > 0
      ? entry.description.trim()
      : 'Unknown';

  const raw = typeof entry.amount === 'number' ? entry.amount : parseFloat(String(entry.amount));
  const amount = isFinite(raw) ? Math.round(raw * 100) / 100 : 0;

  return { description, amount };
}

/**
 * Sums the amounts of an array of PaymentEntry objects, rounded to 2 decimal places.
 */
export function sumPayments(payments: PaymentEntry[]): number {
  const total = payments.reduce((acc, entry) => acc + entry.amount, 0);
  return Math.round(total * 100) / 100;
}
