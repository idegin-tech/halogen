/**
 * Generates a random ID string
 * @param length - Length of the ID to generate (default: 8)
 * @returns A random string ID
 */
export function generateId(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Create a Uint8Array with the required number of random bytes
  const randomBytes = new Uint8Array(length);
  
  // Fill the array with random values
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for non-browser environments
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Use the random bytes to select characters from our string
  for (let i = 0; i < length; i++) {
    // Ensure we always have a valid byte value
    const byteValue = randomBytes[i] || 0; // Use 0 as fallback if undefined
    result += characters.charAt(byteValue % characters.length);
  }
  
  return result;
}