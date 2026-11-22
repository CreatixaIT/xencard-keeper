/**
 * Google Cloud Vision OCR Endpoint
 * 
 * POST /api/ocr/business-card
 * 
 * Request:
 * {
 *   imageBase64: string, // or image: string
 *   mimeType?: "image/jpeg"
 * }
 * 
 * Response:
 * {
 *   engine: "google-cloud-vision",
 *   document: {
 *     width,
 *     height,
 *     blocks: [],
 *     lines: [],
 *     words: [],
 *     rawText: string
 *   }
 * }
 */

interface OCRRequest {
  imageBase64?: string;
  image?: string;
  mimeType?: string;
}

interface OCRResponse {
  engine: string;
  document: {
    width: number;
    height: number;
    blocks: any[];
    lines: any[];
    words: any[];
    rawText?: string;
  };
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body: OCRRequest = await request.json();
    const imageBase64 = body.imageBase64 || body.image;

    if (!imageBase64) {
      return Response.json(
        { error: 'Missing imageBase64 or image' },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB base64 ≈ 7.5MB binary)
    if (imageBase64.length > 10_000_000) {
      return Response.json(
        { error: 'Image too large (max 10MB base64)' },
        { status: 400 }
      );
    }

    // Get Google Cloud Vision credentials from environment
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_CLOUD_VISION_API_KEY not configured');
      return Response.json(
        { error: 'OCR service not configured - Google Cloud Vision credentials required' },
        { status: 503 }
      );
    }

    // Call Google Cloud Vision API
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 50,
            },
          ],
        },
      ],
    };

    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', response.status, errorText);

      if (response.status === 403) {
        return Response.json(
          { error: 'OCR service authentication failed - invalid credentials' },
          { status: 503 }
        );
      }

      if (response.status === 429) {
        return Response.json(
          { error: 'OCR service rate limit exceeded' },
          { status: 429 }
        );
      }

      return Response.json(
        { error: 'OCR service unavailable' },
        { status: 503 }
      );
    }

    const visionResponse = await response.json();

    if (visionResponse.error) {
      console.error('Google Vision API returned error:', visionResponse.error);
      return Response.json(
        { error: 'OCR processing failed' },
        { status: 500 }
      );
    }

    const fullTextAnnotation = visionResponse.responses?.[0]?.fullTextAnnotation;

    if (!fullTextAnnotation) {
      return Response.json(
        { error: 'No text detected in image' },
        { status: 400 }
      );
    }

    const document = parseVisionResponse(fullTextAnnotation);

    const ocrResponse: OCRResponse = {
      engine: 'google-cloud-vision',
      document,
    };

    return Response.json(ocrResponse);
  } catch (error) {
    console.error('OCR endpoint error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Parse Google Cloud Vision response into OcrDocument format
 */
function parseVisionResponse(fullTextAnnotation: any) {
  const pages = fullTextAnnotation.pages || [];
  if (pages.length === 0) {
    return {
      width: 0,
      height: 0,
      blocks: [],
      lines: [],
      words: [],
      rawText: fullTextAnnotation.text || '',
    };
  }

  const page = pages[0];
  const width = page.width || 0;
  const height = page.height || 0;

  const blocks: any[] = [];
  const lines: any[] = [];
  const words: any[] = [];

  for (const block of page.blocks || []) {
    const blockConfidence = block.confidence ?? 0.9;
    const blockBoundingBox = normalizeBoundingBox(block.boundingBox?.vertices);
    const blockLines: any[] = [];

    for (const paragraph of block.paragraphs || []) {
      const paraConfidence = paragraph.confidence ?? blockConfidence;
      let currentLineWords: any[] = [];

      for (const word of paragraph.words || []) {
        const wordConfidence = word.confidence ?? paraConfidence;
        const wordBoundingBox = normalizeBoundingBox(word.boundingBox?.vertices);
        const wordPolygon = normalizePolygon(word.boundingBox?.vertices);

        // Assemble word text from symbols
        const symbols = word.symbols || [];
        const wordText = symbols.map((s: any) => s.text || '').join('');
        if (!wordText) continue;

        const wordObj = {
          text: wordText,
          confidence: wordConfidence,
          boundingBox: wordBoundingBox,
          polygon: wordPolygon,
        };

        currentLineWords.push(wordObj);
        words.push(wordObj);

        // Check if the last symbol indicates a line break
        const lastSymbol = symbols[symbols.length - 1];
        const breakType = lastSymbol?.property?.detectedBreak?.type;
        const isLineBreak =
          breakType === 'LINE_BREAK' ||
          breakType === 'EOL_SURE_SPACE' ||
          breakType === 'HYPHEN';

        if (isLineBreak && currentLineWords.length > 0) {
          const lineObj = createLineFromWords(currentLineWords);
          lines.push(lineObj);
          blockLines.push(lineObj);
          currentLineWords = [];
        }
      }

      // Finish any remaining words in the paragraph
      if (currentLineWords.length > 0) {
        const lineObj = createLineFromWords(currentLineWords);
        lines.push(lineObj);
        blockLines.push(lineObj);
        currentLineWords = [];
      }
    }

    const blockText = blockLines.map(l => l.text).join('\n');

    blocks.push({
      text: blockText,
      confidence: blockConfidence,
      boundingBox: blockBoundingBox,
      lines: blockLines,
    });
  }

  return {
    width,
    height,
    blocks,
    lines,
    words,
    rawText: fullTextAnnotation.text || lines.map(l => l.text).join('\n'),
  };
}

function createLineFromWords(lineWords: any[]) {
  const lineText = lineWords.map(w => w.text).join(' ');
  const lineConfidence = lineWords.reduce((sum, w) => sum + (w.confidence || 0.9), 0) / lineWords.length;

  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  for (const w of lineWords) {
    minX = Math.min(minX, w.boundingBox.x);
    minY = Math.min(minY, w.boundingBox.y);
    maxX = Math.max(maxX, w.boundingBox.x + w.boundingBox.width);
    maxY = Math.max(maxY, w.boundingBox.y + w.boundingBox.height);
  }

  return {
    text: lineText,
    words: lineWords,
    confidence: lineConfidence,
    boundingBox: {
      x: isFinite(minX) ? minX : 0,
      y: isFinite(minY) ? minY : 0,
      width: isFinite(maxX) && isFinite(minX) ? Math.max(maxX - minX, 0) : 0,
      height: isFinite(maxY) && isFinite(minY) ? Math.max(maxY - minY, 0) : 0,
    },
  };
}

function normalizeBoundingBox(vertices: any[] | undefined) {
  if (!vertices || vertices.length < 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = vertices.map((v: any) => v.x || 0);
  const ys = vertices.map((v: any) => v.y || 0);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 0),
    height: Math.max(maxY - minY, 0),
  };
}

function normalizePolygon(vertices: any[] | undefined) {
  if (!vertices || vertices.length < 4) {
    return [];
  }

  return vertices.map((v: any) => ({
    x: v.x || 0,
    y: v.y || 0,
  }));
}
