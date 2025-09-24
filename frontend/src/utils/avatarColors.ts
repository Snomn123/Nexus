// Shared utility for generating consistent avatar colors across components
// This ensures all components use the same color generation logic

// Cache for expensive color calculations
const avatarColorCache = new Map<string, string>();

/**
 * Generates a consistent HSL color based on username hash
 * @param username - The username to generate a color for
 * @returns HSL color string
 */
export const getAvatarColor = (username: string): string => {
  if (avatarColorCache.has(username)) {
    return avatarColorCache.get(username)!;
  }
  
  if (!username) {
    avatarColorCache.set(username, '#6366f1'); // Default to Nexus primary color
    return '#6366f1';
  }
  
  // Generate hash from username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Convert hash to hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Use consistent saturation and lightness for better visual consistency
  const color = `hsl(${hue}, 65%, 50%)`;
  
  avatarColorCache.set(username, color);
  return color;
};

/**
 * Generates a slightly different color for user display names
 * Uses higher lightness for better readability
 * @param username - The username to generate a color for
 * @returns HSL color string for username display
 */
export const getUsernameColor = (username: string): string => {
  const cacheKey = `username_${username}`;
  
  if (avatarColorCache.has(cacheKey)) {
    return avatarColorCache.get(cacheKey)!;
  }
  
  if (!username) {
    avatarColorCache.set(cacheKey, '#ffffff');
    return '#ffffff';
  }
  
  // Generate hash from username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Convert hash to hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Higher lightness for better text readability
  const color = `hsl(${hue}, 65%, 65%)`;
  
  avatarColorCache.set(cacheKey, color);
  return color;
};

/**
 * Clears the avatar color cache (useful for testing or memory management)
 */
export const clearAvatarColorCache = (): void => {
  avatarColorCache.clear();
};

/**
 * Gets the current cache size (useful for debugging)
 */
export const getAvatarColorCacheSize = (): number => {
  return avatarColorCache.size;
};