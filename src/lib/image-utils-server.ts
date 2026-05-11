import { existsSync, readFileSync } from 'fs';

/**
 * Extracts dimensions and aspect ratio from an SVG file.
 * Only works server-side.
 */
export function getSvgDimensions(filePath: string): { width?: number; height?: number; aspectRatio?: number } | null {
  try {
    if (!existsSync(filePath)) return null;
    
    const content = readFileSync(filePath, 'utf8');
    
    // Extract width, height and viewBox using regex to avoid heavy XML parsers
    const widthMatch = content.match(/<svg[^>]*\swidth=["']([^"']+)["']/);
    const heightMatch = content.match(/<svg[^>]*\sheight=["']([^"']+)["']/);
    const viewBoxMatch = content.match(/<svg[^>]*\sviewBox=["']([^"']+)["']/);
    
    let width: number | undefined;
    let height: number | undefined;
    
    if (widthMatch) {
        const val = widthMatch[1];
        if (!val.endsWith('%')) width = parseFloat(val);
    }
    if (heightMatch) {
        const val = heightMatch[1];
        if (!val.endsWith('%')) height = parseFloat(val);
    }
    
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/[,\s]+/).map(parseFloat);
      if (parts.length === 4) {
        const vbWidth = parts[2];
        const vbHeight = parts[3];
        if (!width) width = vbWidth;
        if (!height) height = vbHeight;
      }
    }
    
    if (width && height) {
      return { width, height, aspectRatio: width / height };
    }
    
    return null;
  } catch (error) {
    console.error('Error reading SVG dimensions:', error);
    return null;
  }
}
