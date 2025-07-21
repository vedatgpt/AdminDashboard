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
      
      // Get metadata first
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      
      // Process image with Sharp
      let sharpInstance = sharp(inputBuffer);
      
      // Resize if needed
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
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
    const thumbnailWidth = 150;
    const thumbnailHeight = 112;
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    const thumbnailPath = path.join(dir, `${basename}_thumb.jpg`);
    
    try {
      await sharp(inputBuffer)
        .resize(thumbnailWidth, thumbnailHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 80 })
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