import { Jimp } from 'jimp';
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
      // Load image
      const image = await Jimp.read(inputBuffer);
      
      // Get original dimensions
      const originalWidth = image.getWidth();
      const originalHeight = image.getHeight();
      
      // Resize if needed
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = originalWidth / originalHeight;
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (originalWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspectRatio);
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspectRatio);
        }
        
        image.resize(newWidth, newHeight);
      }
      
      // Set quality
      image.quality(quality);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Save processed image
      await image.write(outputPath);
      
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
        const thumbnailPath = await this.generateThumbnail(image, outputPath);
        result.thumbnailPath = thumbnailPath;
      }
      
      return result;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Watermark disabled for now due to API complexity
  
  private async generateThumbnail(image: Jimp, originalPath: string): Promise<string> {
    const thumbnailSize = 300;
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    const thumbnailPath = path.join(dir, `${basename}_thumb${ext}`);
    
    try {
      // Create thumbnail copy
      const thumbnail = image.clone();
      
      // Resize to thumbnail size maintaining aspect ratio
      const width = thumbnail.getWidth();
      const height = thumbnail.getHeight();
      
      if (width > height) {
        thumbnail.resize(thumbnailSize, Jimp.AUTO);
      } else {
        thumbnail.resize(Jimp.AUTO, thumbnailSize);
      }
      
      await thumbnail.write(thumbnailPath);
      
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
      const image = await Jimp.read(imagePath);
      const stats = await fs.stat(imagePath);
      
      return {
        width: image.getWidth(),
        height: image.getHeight(),
        size: stats.size
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const imageProcessor = new ImageProcessor();