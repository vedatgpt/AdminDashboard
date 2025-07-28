import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// SECURITY: File validation constants
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSIONS = { width: 4000, height: 4000 };

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  watermark?: boolean;
  generateThumbnail?: boolean;
}

export interface ProcessedImage {
  filename: string;
  originalSize: number;
  processedSize: number;
  thumbnailPath?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  dimensions?: { width: number; height: number };
}

export class ImageProcessor {
  private watermarkPath: string;
  
  constructor() {
    this.watermarkPath = path.join(process.cwd(), 'assets', 'watermark.png');
  }

  // SECURITY: Validate uploaded file
  async validateFile(file: Express.Multer.File): Promise<FileValidationResult> {
    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB olmalıdır.`
        };
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return {
          isValid: false,
          error: `Desteklenmeyen dosya türü. Sadece JPG, PNG ve WebP dosyaları kabul edilir.`
        };
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return {
          isValid: false,
          error: `Desteklenmeyen dosya türü. Sadece resim dosyaları kabul edilir.`
        };
      }

      // SECURITY: Validate image content using Sharp
      try {
        const metadata = await sharp(file.buffer).metadata();
        
        // Check if it's actually an image
        if (!metadata.width || !metadata.height) {
          return {
            isValid: false,
            error: `Geçersiz resim dosyası.`
          };
        }

        // Check dimensions
        if (metadata.width > MAX_DIMENSIONS.width || metadata.height > MAX_DIMENSIONS.height) {
          return {
            isValid: false,
            error: `Resim boyutları çok büyük. Maksimum ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} piksel olmalıdır.`
          };
        }

        return {
          isValid: true,
          mimeType: file.mimetype,
          dimensions: { width: metadata.width, height: metadata.height }
        };
      } catch (error) {
        return {
          isValid: false,
          error: `Resim dosyası işlenemedi. Dosya bozuk olabilir.`
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Dosya doğrulama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  // SECURITY: Sanitize filename
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase();
  }

  async processImage(
    inputBuffer: Buffer, 
    outputPath: string, 
    options: ProcessImageOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      watermark = false,
      generateThumbnail = true
    } = options;

    const originalSize = inputBuffer.length;
    
    try {
      // SECURITY: Validate input buffer
      if (!inputBuffer || inputBuffer.length === 0) {
        throw new Error('Geçersiz dosya verisi');
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Get metadata first
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      
      // SECURITY: Additional validation
      if (originalWidth === 0 || originalHeight === 0) {
        throw new Error('Geçersiz resim boyutları');
      }
      
      // Process image with Sharp
      let sharpInstance = sharp(inputBuffer);
      
      // Resize if needed while preserving orientation
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Auto-rotate based on EXIF data to prevent orientation issues
      sharpInstance = sharpInstance.rotate();
      
      // Set quality and format
      sharpInstance = sharpInstance.jpeg({ quality });
      
      // Save processed image
      await sharpInstance.toFile(outputPath);
      
      // Get processed file size
      const stats = await fs.stat(outputPath);
      const processedSize = stats.size;
      
      const result: ProcessedImage = {
        filename: path.basename(outputPath),
        originalSize,
        processedSize
      };
      
      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailPath = await this.generateThumbnail(inputBuffer, outputPath);
        result.thumbnailPath = thumbnailPath;
      }
      
      return result;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Watermark disabled for now due to API complexity
  
  private async generateThumbnail(inputBuffer: Buffer, originalPath: string): Promise<string> {
    const thumbnailWidth = 200;
    const thumbnailHeight = 150;
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    const thumbnailPath = path.join(dir, `${basename}_thumb.jpg`);
    
    try {
      await sharp(inputBuffer)
        .rotate() // Auto-rotate based on EXIF data
        .resize(thumbnailWidth, thumbnailHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 90 })
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      // Return original path if thumbnail fails
      return originalPath;
    }
  }
  
  async deleteImage(imagePath: string): Promise<void> {
    try {
      // SECURITY: Validate path to prevent directory traversal
      const normalizedPath = path.normalize(imagePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Geçersiz dosya yolu');
      }

      await fs.unlink(imagePath);
      
      // Also delete thumbnail if exists
      const ext = path.extname(imagePath);
      const basename = path.basename(imagePath, ext);
      const dir = path.dirname(imagePath);
      const thumbnailPath = path.join(dir, `${basename}_thumb${ext}`);
      
      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
  
  async getImageInfo(imagePath: string): Promise<{ width: number; height: number; size: number }> {
    try {
      // SECURITY: Validate path
      const normalizedPath = path.normalize(imagePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Geçersiz dosya yolu');
      }

      const metadata = await sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: stats.size
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const imageProcessor = new ImageProcessor();