/**
 * Google Cloud Vision OCR Endpoint
 * 
 * POST /api/ocr/business-card
 * 
 * Request:
 * {
 *   imageBase64: string,
 *   mimeType: "image/jpeg"
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
 *     words: []
 *   }
 * }
 * 
 * Security:
 * - Google credentials in server-side environment variables only
 * - Dedicated service account with only Vision permissions
 * - Images processed and discarded (not permanently stored)
 * - No logging of image base64 or full card contents in production
 * 
 * Required Environment Variables:
 * - GOOGLE_CLOUD_VISION_API_KEY: Google Cloud Vision API key
 */

interface OCRRequest {
  imageBase64: string;
  mimeType: string;
}

interface OCRResponse {
  engine: string;
  document: {
    width: number;
    height: number;
    blocks: any[];
    lines: any[];
    words: any[];
  };
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body: OCRRequest = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return Response.json(
        { error: 'Missing imageBase64 or mimeType' },
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
    
    // Check for Vision API errors
    if (visionResponse.error) {
      console.error('Google Vision API returned error:', visionResponse.error);
      return Response.json(
        { error: 'OCR processing failed' },
        { status: 500 }
      );
    }
    
    // Parse Vision response into our OcrDocument format
    const fullTextAnnotation = visionResponse.responses[0]?.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      return Response.json(
        { error: 'No text detected in image' },
        { status: 400 }
      );
    }

    // Convert Vision format to our OcrDocument format
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
    return { width: 0, height: 0, blocks: [], lines: [], words: [] };
  }

  const page = pages[0];
  const width = page.width || 0;
  const height = page.height || 0;

  const blocks: any[] = [];
  const lines: any[] = [];
  const words: any[] = [];

  // Process blocks (pages[0].blocks)
  for (const block of page.blocks || []) {
    const blockText = block.block?.text || '';
    const blockConfidence = block.block?.confidence || 0;
    
    const blockBoundingBox = normalizeBoundingBox(block.block?.boundingBox?.vertices);
    
    const blockLines: any[] = [];
    
    // Process paragraphs within block
    for (const paragraph of block.paragraphs || []) {
      for (const paragraphLine of paragraph.words || []) {
        const lineText = paragraphLine.words
          ?.map((w: any) => w.symbols?.map((s: any) => s.text).join('') || '')
          .join(' ') || '';
        
        const lineConfidence = paragraphLine.confidence || 0;
        const lineBoundingBox = normalizeBoundingBox(paragraphLine.boundingBox?.vertices);
        
        const lineWords: any[] = [];
        
        // Process words within line
        for (const word of paragraphLine.words || []) {
          const wordText = word.symbols?.map((s: any) => s.text).join('') || '';
          const wordConfidence = word.confidence || 0;
          const wordBoundingBox = normalizeBoundingBox(word.boundingBox?.vertices);
          const wordPolygon = normalizePolygon(word.boundingBox?.vertices);
          
          lineWords.push({
            text: wordText,
            confidence: wordConfidence,
            boundingBox: wordBoundingBox,
            polygon: wordPolygon,
          });
          
          words.push({
            text: wordText,
            confidence: wordConfidence,
            boundingBox: wordBoundingBox,
            polygon: wordPolygon,
          });
        }
        
        const line: any = {
          text: lineText,
          words: lineWords,
          confidence: lineConfidence,
          boundingBox: lineBoundingBox,
        };
        
        lines.push(line);
        blockLines.push(line);
      }
    }
    
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
  };
}

/**
 * Normalize Vision vertices to our bounding box format
 */
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
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Normalize vertices to polygon format
 */
function normalizePolygon(vertices: any[] | undefined) {
  if (!vertices || vertices.length < 4) {
    return [];
  }

  return vertices.map((v: any) => ({
    x: v.x || 0,
    y: v.y || 0,
  }));
}
