// Vercel Serverless Function for Image Upload
// Using simplified approach due to Vercel Blob module issues

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, filename, mimeType } = request.body;

    if (!fileData) {
      return response.status(400).json({ error: 'No file data provided' });
    }

    // For now, we'll return the base64 data as-is
    // In production, you would use Vercel Blob API directly via REST
    
    // Simulate successful upload response
    const mockUrl = `data:${mimeType};base64,${fileData}`;
    
    return response.status(200).json({
      url: mockUrl,
      pathname: `local-${Date.now()}-${filename}`,
      size: fileData.length,
      uploadedAt: new Date().toISOString(),
      isBase64: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return response.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
}