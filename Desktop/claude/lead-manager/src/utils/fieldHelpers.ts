/**
 * Generate a unique field ID
 * @returns string - Unique field ID in format "field_TIMESTAMP_RANDOM"
 */
export function generateFieldId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `field_${timestamp}_${random}`;
}

/**
 * Generate API name from field label
 * Converts "Full Name" -> "full_name", "Phone Number" -> "phone_number", etc.
 * @param label - The field label
 * @returns string - Snake case API name
 */
export function generateApiName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Validate API name format
 * @param apiName - The API name to validate
 * @returns boolean - True if valid
 */
export function isValidApiName(apiName: string): boolean {
  // Must start with letter, contain only letters, numbers, and underscores
  return /^[a-z][a-z0-9_]*$/i.test(apiName);
}

/**
 * Sanitize API name to ensure it's valid
 * @param apiName - The API name to sanitize
 * @returns string - Valid API name
 */
export function sanitizeApiName(apiName: string): string {
  if (!apiName) return 'field';
  
  let sanitized = apiName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  // Ensure it starts with a letter
  if (!/^[a-z]/.test(sanitized)) {
    sanitized = 'field_' + sanitized;
  }

  return sanitized || 'field';
}

/**
 * Check if API name is unique within a list of fields
 * @param apiName - The API name to check
 * @param fields - Array of existing fields
 * @param excludeId - Field ID to exclude from check (for editing)
 * @returns boolean - True if unique
 */
export function isUniqueApiName(apiName: string, fields: any[], excludeId?: string): boolean {
  return !fields.some(field => field.apiName === apiName && field.id !== excludeId);
}

/**
 * Generate unique API name if conflicts exist
 * @param baseApiName - The base API name
 * @param fields - Array of existing fields
 * @param excludeId - Field ID to exclude from check
 * @returns string - Unique API name
 */
export function ensureUniqueApiName(baseApiName: string, fields: any[], excludeId?: string): string {
  let apiName = sanitizeApiName(baseApiName);
  let counter = 1;
  
  while (!isUniqueApiName(apiName, fields, excludeId)) {
    apiName = sanitizeApiName(baseApiName) + '_' + counter;
    counter++;
  }
  
  return apiName;
}