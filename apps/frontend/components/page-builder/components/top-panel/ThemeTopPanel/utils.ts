// Helper function to extract numeric value from size variables
export const extractNumericValue = (value: string): number => {
  if (!value) return 0;
  const match = value.match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};

// Convert HSL to Hex
export const hslToHex = (hslString: string): string => {
  if (!hslString || typeof hslString !== 'string') return '#000000';
  
  // If the value is already hex, return it
  if (hslString.startsWith('#')) {
    return hslString;
  }
  
  try {
    const parts = hslString.trim().split(' ');
    if (parts.length !== 3) return '#000000';
    
    const h = parseInt(parts[0]);
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    const toHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (error) {
    console.error('Error converting HSL to hex:', error);
    return '#000000';
  }
};

// Convert Hex to HSL
export const hexToHsl = (hex: string): string => {
  // If the hex value is already stored, return it
  if (hex.startsWith('#')) {
    return hex;
  }
  
  try {
    hex = hex.replace(/^#/, '');
    
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
      
      h *= 60;
    }
    
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch (error) {
    console.error('Error converting hex to HSL:', error);
    return '0 0% 0%';
  }
};
