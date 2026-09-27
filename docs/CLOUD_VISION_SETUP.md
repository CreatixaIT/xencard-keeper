# Google Cloud Vision Setup

This document describes how to configure Google Cloud Vision for the Xencard Keeper OCR backend.

## Requirements

1. **Google Cloud Project**
   - Create a project at https://console.cloud.google.com/
   - Enable the Cloud Vision API for the project

2. **Google Cloud Vision API Key**
   - Create an API key at https://console.cloud.google.com/apis/credentials
   - Restrict the API key to:
     - **API:** Cloud Vision API
     - **Application referrer:** Your Vercel domain (e.g., `xeni.xentroinfotech.com`)
     - **IP addresses:** Vercel IP ranges (optional but recommended)

3. **Vercel Deployment**
   - Deploy the API to Vercel
   - Configure environment variables

## Environment Variables

Add the following environment variable to your Vercel project:

```
GOOGLE_CLOUD_VISION_API_KEY=your_actual_api_key_here
```

**IMPORTANT:** Never commit the actual API key to Git. Only use environment variables.

## Deployment Commands

### 1. Deploy to Vercel

```bash
vercel --prod
```

### 2. Set Environment Variable in Vercel

```bash
vercel env add GOOGLE_CLOUD_VISION_API_KEY production
```

When prompted, paste your actual Google Cloud Vision API key.

### 3. Verify Deployment

```bash
curl -X POST https://your-app.vercel.app/api/ocr/business-card \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image_data"}'
```

Expected response (with credentials):
```json
{
  "success": true,
  "engine": "google-cloud-vision",
  "document": {
    "width": 2000,
    "height": 1200,
    "lines": [...],
    "blocks": [...],
    "words": [...]
  }
}
```

Expected response (without credentials):
```json
{
  "success": false,
  "error": "Google Cloud Vision API key is not configured"
}
```

## Security Warnings

- **NEVER** commit the API key to Git
- **NEVER** include the API key in the mobile app code
- **NEVER** store the API key in `app.json` or `eas.json`
- **NEVER** log the API key in server logs
- **ALWAYS** restrict the API key to specific domains/IPs
- **ALWAYS** use environment variables for the API key
- **ALWAYS** rotate the API key if it's compromised

## API Key Best Practices

1. **Restrict by Application:** Only allow your Vercel domain
2. **Restrict by IP:** Only allow Vercel IP ranges
3. **Set Quotas:** Set reasonable daily quotas to prevent abuse
4. **Monitor Usage:** Monitor API usage in Google Cloud Console
5. **Rotate Regularly:** Rotate API keys periodically

## Testing

### Local Testing

To test the API locally without Vercel:

1. Set the environment variable locally:
```bash
export GOOGLE_CLOUD_VISION_API_KEY=your_actual_api_key_here
```

2. Run the local server:
```bash
npm run dev
```

3. Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/ocr/business-card \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image_data"}'
```

## Troubleshooting

### Error: "Google Cloud Vision API key is not configured"

**Cause:** The `GOOGLE_CLOUD_VISION_API_KEY` environment variable is not set.

**Solution:** Set the environment variable in Vercel or locally.

### Error: "API key not valid"

**Cause:** The API key is invalid or has the wrong restrictions.

**Solution:** Verify the API key in Google Cloud Console and check restrictions.

### Error: "Quota exceeded"

**Cause:** The API key has exceeded its daily quota.

**Solution:** Increase the quota in Google Cloud Console or wait for quota reset.

### Error: "Invalid image"

**Cause:** The image data is invalid or too large.

**Solution:** Ensure the image is valid base64 data and within size limits (max 10MB).

## Backend Implementation

The backend is implemented in `api/ocr/business-card.ts`:

- Accepts POST requests with base64 image data
- Calls Google Cloud Vision API with `DOCUMENT_TEXT_DETECTION`
- Returns structured OCR data in the `OcrDocument` format
- Handles errors gracefully
- Returns HTTP 503 when credentials are missing

## Support

For issues with Google Cloud Vision:
- Google Cloud Vision documentation: https://cloud.google.com/vision/docs
- Google Cloud Console: https://console.cloud.google.com/

For issues with the Xencard Keeper implementation:
- Check the backend logs in Vercel
- Verify the API key configuration
- Test with a simple image first
