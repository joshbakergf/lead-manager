// API endpoint to fetch configuration from Edge Config
import { get, getAll } from '@vercel/edge-config';

export default async function handler(request, response) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific configuration
      const value = await get(key);
      if (value === undefined) {
        return response.status(404).json({ error: 'Configuration not found' });
      }
      return response.status(200).json({ [key]: value });
    } else {
      // Get all configuration
      const allConfig = await getAll();
      return response.status(200).json(allConfig);
    }
  } catch (error) {
    console.error('Edge Config API error:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch configuration',
      message: error.message 
    });
  }
}