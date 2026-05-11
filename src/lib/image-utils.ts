import { existsSync, readFileSync } from 'fs';

/**
 * Compresses an image file using the Canvas API.
 * 
 * @param file The image file to compress
 * @param maxSizeBytes The target maximum size in bytes (default 100KB)
 * @param maxDimension The maximum width or height in pixels (default 1200px)
 * @returns A promise that resolves to a base64 encoded string of the compressed image
 */
export async function compressImage(
  file: File, 
  maxSizeBytes: number = 100 * 1024,
  maxDimension: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (typeof window === 'undefined') {
      reject(new Error('compressImage is a client-side only utility'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively find the best quality to fit under maxSizeBytes
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Base64 is ~33% larger than binary, so we adjust the check
        // dataUrl.length * 0.75 is a good approximation of binary size
        while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

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
