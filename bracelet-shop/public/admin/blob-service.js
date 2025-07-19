// Vercel Blob Service for Image Management
class BlobService {
    constructor() {
        // In a real deployment, this would come from environment variables
        this.token = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_YWok8xT3qZxihdY6_1uUxsyW4Em4u4naN2uirqua0eIoPDh';
        this.baseUrl = 'https://api.vercel.com/v2/blob';
    }

    // Upload image to Vercel Blob
    async uploadImage(file, filename) {
        try {
            // Create a unique filename with timestamp
            const uniqueFilename = `products/${Date.now()}-${filename}`;
            
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            
            // Upload to Vercel Blob
            const response = await fetch(`${this.baseUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                url: result.url,
                pathname: result.pathname,
                size: result.size
            };
        } catch (error) {
            console.error('Blob upload error:', error);
            throw error;
        }
    }

    // Alternative: Upload using put method (simpler)
    async uploadImageSimple(file, filename) {
        try {
            // For client-side, we'll need to send to a server endpoint
            // This is a simplified version for demonstration
            
            const uniqueFilename = `products/${Date.now()}-${filename}`;
            
            // Convert file to array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // This would typically be done on the server
            // For demo purposes, we'll simulate the response
            const mockUrl = `https://example.blob.vercel-storage.com/${uniqueFilename}`;
            
            return {
                url: mockUrl,
                pathname: uniqueFilename,
                size: file.size
            };
        } catch (error) {
            console.error('Simple blob upload error:', error);
            throw error;
        }
    }

    // Delete image from Vercel Blob
    async deleteImage(pathname) {
        try {
            const response = await fetch(`${this.baseUrl}/delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: [pathname]
                })
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Blob delete error:', error);
            throw error;
        }
    }

    // Get blob info
    async getBlobInfo(pathname) {
        try {
            const response = await fetch(`${this.baseUrl}/${pathname}`, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            return {
                exists: response.ok,
                size: response.headers.get('content-length'),
                lastModified: response.headers.get('last-modified')
            };
        } catch (error) {
            console.error('Blob info error:', error);
            return { exists: false };
        }
    }
}

// For client-side use without server endpoints
class ClientBlobService {
    // Upload image using a server endpoint
    async uploadImage(file, filename) {
        try {
            // Convert file to base64 for JSON transfer
            const base64Data = await this.fileToBase64(file);
            
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileData: base64Data,
                    filename: filename,
                    mimeType: file.type
                })
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Client upload error:', error);
            // Fallback to base64 for local development
            return this.fallbackToBase64(file);
        }
    }

    // Helper to convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data:image/xxx;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Fallback to base64 encoding for local development
    async fallbackToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                url: reader.result,
                pathname: `local-${Date.now()}-${file.name}`,
                size: file.size,
                isBase64: true
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Delete image (for base64, just remove from storage)
    async deleteImage(pathname) {
        if (pathname.startsWith('local-')) {
            // For base64 images, just return success
            return { success: true };
        }
        
        // For actual blob images, call delete endpoint
        try {
            const response = await fetch('/api/delete-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pathname })
            });

            return await response.json();
        } catch (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export the appropriate service
const blobService = new ClientBlobService();

// Make available globally
window.blobService = blobService;