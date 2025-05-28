
export function generateId(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  const randomBytes = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    const byteValue = randomBytes[i] || 0; // Use 0 as fallback if undefined
    result += characters.charAt(byteValue % characters.length);
  }
  
  return result;
}