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
      watermark = true,
      generateThumbnail = true
    } = options;

    const originalSize = inputBuffer.length;
    
    // Load image
    const image = await Jimp.read(inputBuffer);
    
    // Resize while maintaining aspect ratio
    image.scaleToFit(maxWidth, maxHeight);
    
    // Apply watermark if enabled
    if (watermark) {
      await this.applyWatermark(image);
    }
    
    // Set quality and save
    image.quality(quality);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Save processed image
    await image.writeAsync(outputPath);
    
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
  }
  
  private async applyWatermark(image: Jimp): Promise<void> {
    try {
      // Create a simple text watermark if watermark image doesn't exist
      const watermarkText = "YourSite.com";
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      
      // Get image dimensions
      const imageWidth = image.getWidth();
      const imageHeight = image.getHeight();
      
      // Calculate text dimensions (approximate)
      const textWidth = watermarkText.length * 20; // Rough estimate
      const textHeight = 32;
      
      // Position watermark at bottom right
      const x = imageWidth - textWidth - 20;
      const y = imageHeight - textHeight - 20;
      
      // Add semi-transparent background for text
      image.scan(x - 10, y - 5, textWidth + 20, textHeight + 10, function (this: any, x: number, y: number, idx: number) {
        this.bitmap.data[idx + 3] = Math.min(this.bitmap.data[idx + 3], 180); // Reduce alpha
      });
      
      // Add watermark text
      image.print(font, x, y, watermarkText);
      
    } catch (error) {
      console.log('Watermark not applied:', error);
      // Continue without watermark if there's an issue
    }
  }
  
  private async generateThumbnail(image: Jimp, originalPath: string): Promise<string> {
    const thumbnailSize = 300;
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    const thumbnailPath = path.join(dir, `${basename}_thumb${ext}`);
    
    // Create thumbnail copy
    const thumbnail = image.clone();
    thumbnail.cover(thumbnailSize, thumbnailSize);
    
    await thumbnail.writeAsync(thumbnailPath);
    
    return thumbnailPath;
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
    const image = await Jimp.read(imagePath);
    const stats = await fs.stat(imagePath);
    
    return {
      width: image.getWidth(),
      height: image.getHeight(),
      size: stats.size
    };
  }
}

export const imageProcessor = new ImageProcessor();