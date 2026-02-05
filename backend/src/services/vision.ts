import fs from 'fs';

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    error?: {
      message: string;
    };
  }>;
}

interface ExtractedData {
  date: string | null;
  description: string | null;
  amount: number | null;
  rawText: string;
}

export async function extractTextFromImage(imagePath: string): Promise<ExtractedData> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Vision API key not configured');
  }

  // Read image file and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Call Google Vision API
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.statusText}`);
  }

  const data = await response.json() as VisionResponse;

  if (data.responses[0].error) {
    throw new Error(`Vision API error: ${data.responses[0].error.message}`);
  }

  const textAnnotations = data.responses[0].textAnnotations;
  const rawText = textAnnotations?.[0]?.description || '';

  // Extract structured data from raw text
  const extractedData = parseReceiptText(rawText);

  return {
    ...extractedData,
    rawText,
  };
}

function parseReceiptText(text: string): Omit<ExtractedData, 'rawText'> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // Extract date (various formats)
  const datePatterns = [
    /(\d{4}[-./]\d{1,2}[-./]\d{1,2})/, // 2024-01-15, 2024/01/15
    /(\d{1,2}[-./]\d{1,2}[-./]\d{4})/, // 15-01-2024, 15/01/2024
    /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/, // 2024년 1월 15일
  ];

  let date: string | null = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = normalizeDate(match[1]);
      break;
    }
  }

  // Extract amount (Korean won format)
  const amountPatterns = [
    /합\s*계[:\s]*([0-9,]+)\s*원?/i,
    /총\s*액[:\s]*([0-9,]+)\s*원?/i,
    /결\s*제[:\s]*([0-9,]+)\s*원?/i,
    /TOTAL[:\s]*([0-9,]+)/i,
    /([0-9,]+)\s*원/,
  ];

  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseInt(match[1].replace(/,/g, ''), 10);
      break;
    }
  }

  // Extract store name (usually first few lines)
  let description: string | null = null;
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like dates, amounts, or common headers
    if (
      !line.match(/\d{4}[-./]\d/) &&
      !line.match(/합계|총액|결제|TOTAL/i) &&
      !line.match(/^\d+$/) &&
      line.length > 1 &&
      line.length < 50
    ) {
      description = line;
      break;
    }
  }

  return { date, description, amount };
}

function normalizeDate(dateStr: string): string {
  // Convert various date formats to YYYY-MM-DD
  let normalized = dateStr
    .replace(/년\s*/g, '-')
    .replace(/월\s*/g, '-')
    .replace(/일/g, '')
    .replace(/\//g, '-')
    .replace(/\./g, '-')
    .trim();

  // Handle DD-MM-YYYY format
  const parts = normalized.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      normalized = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD (normalize padding)
      normalized = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  return normalized;
}
