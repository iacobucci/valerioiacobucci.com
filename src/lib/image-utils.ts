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
