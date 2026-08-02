/**
 * Image Processing & WebP Compression Utility
 * Formats images to WebP standard with high compression for Google Merchant Center compliance
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  forceFormat?: "image/webp" | "image/jpeg" | "image/png";
}

/**
 * Compresses an image File or Blob and outputs a clean WebP data URL
 */
export async function compressAndConvertToWebP(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1000, maxHeight = 1000, quality = 0.82, forceFormat } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio bounds
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparency in WebP/JPEG conversion
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal size & Google Merchant Center speed compliance
        const targetFormat = forceFormat || "image/webp";
        let dataUrl = canvas.toDataURL(targetFormat, quality);

        // Browser fallback to JPEG if WebP is unsupported in canvas
        if (targetFormat === "image/webp" && !dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image element for compression."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("FileReader failed to read image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Batch processes an array of image Files and returns compressed WebP data URLs
 */
export async function batchCompressImages(
  files: (File | Blob)[],
  options: ImageCompressionOptions = {}
): Promise<string[]> {
  const results: string[] = [];
  for (const file of files) {
    try {
      const compressed = await compressAndConvertToWebP(file, options);
      results.push(compressed);
    } catch (err) {
      console.warn("Failed compressing image item in batch:", err);
    }
  }
  return results;
}
