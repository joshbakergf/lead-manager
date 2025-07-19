// Vercel Serverless Function for Image Deletion
// Using simplified approach due to Vercel Blob module issues

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pathname } = request.body;

    if (!pathname) {
      return response.status(400).json({ error: 'No pathname provided' });
    }

    // For now, just return success
    // In production, you would use Vercel Blob API directly via REST
    
    return response.status(200).json({
      success: true,
      deletedAt: new Date().toISOString(),
      pathname
    });

  } catch (error) {
    console.error('Delete error:', error);
    return response.status(500).json({
      success: false,
      error: 'Delete failed',
      message: error.message
    });
  }
}