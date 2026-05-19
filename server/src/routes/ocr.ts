import { Router, Request, Response } from 'express';
import { extractPaymentsFromImage } from '../services/claudeVision';

const router = Router();

interface OcrRequestBody {
  image: string; // base64-encoded image
  mimeType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

/**
 * POST /api/ocr/extract
 * Body: { image: string (base64), mimeType?: string }
 * Returns extracted payment data from the provided image.
 */
router.post('/extract', async (req: Request, res: Response): Promise<void> => {
  try {
    const { image, mimeType } = req.body as OcrRequestBody;

    if (!image || typeof image !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid "image" field. Provide a base64-encoded image string.',
      });
      return;
    }

    // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    if (!base64Data || base64Data.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Image data is empty after stripping data URI prefix.',
      });
      return;
    }

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const resolvedMimeType =
      mimeType && validMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';

    console.log(`[OCR] Processing image extraction (mime: ${resolvedMimeType}, size: ~${Math.round(base64Data.length * 0.75 / 1024)}KB)`);

    const extractedData = await extractPaymentsFromImage(
      base64Data,
      resolvedMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    );

    console.log(
      `[OCR] Extraction complete — cash: $${extractedData.cashTotal}, card: $${extractedData.cardTotal}, confidence: ${extractedData.confidence}`
    );

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[OCR] Extraction error:', error.message);

    if (error.message.includes('parse')) {
      res.status(422).json({
        success: false,
        error: 'Failed to parse structured data from image. The AI response was malformed.',
        details: error.message,
      });
      return;
    }

    if (error.message.includes('API')) {
      res.status(502).json({
        success: false,
        error: 'Claude Vision API request failed. Check your ANTHROPIC_API_KEY.',
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during image extraction.',
      details: error.message,
    });
  }
});

export default router;
