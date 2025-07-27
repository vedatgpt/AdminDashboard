import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

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

export class ImageProcessor {
  private watermarkPath: string;
  
  constructor() {
    this.watermarkPath = path.join(process.cwd(), 'assets', 'watermark.png');
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
      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Get metadata first - with HEIF error handling
      let metadata;
      try {
        metadata = await sharp(inputBuffer).metadata();
      } catch (metadataError) {
        // If metadata extraction fails (common with unsupported HEIC variants)
        console.warn('Metadata extraction failed, using defaults:', metadataError);
        metadata = { width: 1920, height: 1080 }; // Default dimensions
      }
      
      const originalWidth = metadata.width || 1920;
      const originalHeight = metadata.height || 1080;
      
      // Process image with Sharp - enhanced HEIF error handling
      let sharpInstance = sharp(inputBuffer);
      
      // Resize if needed while preserving orientation
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Auto-rotate based on EXIF data to prevent orientation issues
      try {
        sharpInstance = sharpInstance.rotate();
      } catch (rotateError) {
        console.warn('Auto-rotation failed, skipping:', rotateError);
        // Continue without rotation if it fails
      }
      
      // Set quality and format
      sharpInstance = sharpInstance.jpeg({ quality });
      
      // Save processed image with enhanced error handling
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
      
      // Check if this is a HEIC compression error
      if (error instanceof Error && error.message.includes('compression format has not been built in')) {
        throw new Error('Bu HEIC dosya formatı desteklenmiyor. Lütfen JPG, PNG veya WebP formatında fotoğraf yükleyiniz.');
      }
      
      // Check if this is a HEIF/HEIC related error
      if (error instanceof Error && (error.message.includes('heif') || error.message.includes('heic'))) {
        throw new Error('HEIC/HEIF dosya işlenemedi. Lütfen fotoğrafı JPG veya PNG formatında kaydedin ve tekrar yükleyin.');
      }
      
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