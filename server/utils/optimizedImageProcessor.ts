import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface OptimizedProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

interface ProcessedImageResult {
  filename: string;
  originalSize: number;
  processedSize: number;
  thumbnailPath: string;
  width: number;
  height: number;
}

export class OptimizedImageProcessor {
  // Pre-configure Sharp for better performance
  private static configureSharp() {
    // Optimize Sharp for better memory usage and speed
    sharp.cache({ items: 50, memory: 100 * 1024 * 1024 }); // 100MB cache
    sharp.concurrency(2); // Limit concurrent processing to prevent memory spikes
  }

  constructor() {
    OptimizedImageProcessor.configureSharp();
  }

  async processImageOptimized(
    inputBuffer: Buffer,
    outputDir: string,
    filename: string,
    options: OptimizedProcessOptions = {}
  ): Promise<ProcessedImageResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      thumbnailWidth = 200,
      thumbnailHeight = 150
    } = options;

    const originalSize = inputBuffer.length;
    const outputPath = path.join(outputDir, filename);
    
    try {
      // Ensure directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // OPTIMIZATION: Process main image and thumbnail in parallel
      const [mainImageResult, thumbnailResult] = await Promise.all([
        this.processMainImage(inputBuffer, outputPath, maxWidth, maxHeight, quality),
        this.processThumbnail(inputBuffer, outputDir, filename, thumbnailWidth, thumbnailHeight)
      ]);

      return {
        filename: path.basename(outputPath),
        originalSize,
        processedSize: mainImageResult.size,
        thumbnailPath: thumbnailResult.path,
        width: mainImageResult.width,
        height: mainImageResult.height
      };
    } catch (error) {
      console.error('Optimized image processing error:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processMainImage(
    inputBuffer: Buffer,
    outputPath: string,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<{ size: number; width: number; height: number }> {
    // OPTIMIZATION: Single Sharp pipeline for main image
    const sharpInstance = sharp(inputBuffer, {
      // Performance optimizations
      failOnError: false,
      limitInputPixels: 268402689 // ~16K x 16K max
    })
    .rotate() // Auto-rotate based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3 // High quality, fast resizing
    })
    .jpeg({ 
      quality,
      progressive: true, // Better loading experience
      mozjpeg: true // Better compression
    });

    // Process and get metadata in one go
    const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });
    
    // Write to file
    await fs.writeFile(outputPath, data);
    
    return {
      size: data.length,
      width: info.width,
      height: info.height
    };
  }

  private async processThumbnail(
    inputBuffer: Buffer,
    outputDir: string,
    originalFilename: string,
    width: number,
    height: number
  ): Promise<{ path: string }> {
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const thumbnailFilename = `${basename}_thumb.jpg`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);

    // OPTIMIZATION: Optimized thumbnail generation
    await sharp(inputBuffer, { failOnError: false })
      .rotate() // Auto-rotate based on EXIF
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos2 // Faster kernel for thumbnails
      })
      .jpeg({ 
        quality: 90,
        progressive: false, // No need for progressive thumbnails
        mozjpeg: true
      })
      .toFile(thumbnailPath);

    return { path: thumbnailPath };
  }

  async deleteImages(imagePath: string): Promise<void> {
    try {
      // Delete main image and thumbnail in parallel
      const ext = path.extname(imagePath);
      const basename = path.basename(imagePath, ext);
      const dir = path.dirname(imagePath);
      const thumbnailPath = path.join(dir, `${basename}_thumb.jpg`);

      await Promise.allSettled([
        fs.unlink(imagePath),
        fs.unlink(thumbnailPath)
      ]);
    } catch (error) {
      console.error('Error deleting images:', error);
    }
  }

  // Batch processing for multiple images
  async processBatch(
    images: Array<{ buffer: Buffer; filename: string }>,
    outputDir: string,
    options: OptimizedProcessOptions = {}
  ): Promise<ProcessedImageResult[]> {
    // OPTIMIZATION: Process images in batches to prevent memory overflow
    const batchSize = 3; // Process 3 images at once
    const results: ProcessedImageResult[] = [];

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(img => 
          this.processImageOptimized(img.buffer, outputDir, img.filename, options)
        )
      );
      
      results.push(...batchResults);
    }

    return results;
  }
}

export const optimizedImageProcessor = new OptimizedImageProcessor();