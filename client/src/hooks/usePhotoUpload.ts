import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadedImage {
  id: string;
  filename: string;
  url: string;
  thumbnail?: string;
  size: number;
  originalSize: number;
  uploading?: boolean;
  progress?: number;
  order?: number;
}

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function usePhotoUpload(currentClassifiedId?: number) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const validateFiles = useCallback((files: FileList | null) => {
    if (!files) return [];
    
    return Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Hata",
          description: "Lütfen sadece resim dosyaları seçin",
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Hata", 
          description: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB olmalı`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
  }, [toast]);

  const uploadSingleImage = useCallback(async (file: File, uploadingId: string) => {
    const formData = new FormData();
    formData.append('photos', file);
    if (currentClassifiedId) {
      formData.append('classifiedId', currentClassifiedId.toString());
    }

    try {
      const response = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.images && result.images.length > 0) {
        const newImage = result.images[0];
        
        setImages(prev => prev.map(img => 
          img.id === uploadingId 
            ? { ...newImage, order: img.order }
            : img
        ));
        
        return newImage;
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setImages(prev => prev.filter(img => img.id !== uploadingId));
      
      toast({
        title: "Yükleme Hatası",
        description: "Fotoğraf yüklenemedi. Tekrar deneyin.",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [currentClassifiedId, toast]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    if (images.length + validFiles.length > MAX_IMAGES) {
      toast({
        title: "Çok fazla fotoğraf",
        description: `Maksimum ${MAX_IMAGES} fotoğraf yükleyebilirsiniz`,
        variant: "destructive",
      });
      return;
    }

    const newImages: UploadedImage[] = validFiles.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      filename: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      originalSize: file.size,
      uploading: true,
      progress: 0,
      order: images.length + index + 1
    }));

    setImages(prev => [...prev, ...newImages]);

    // Upload images in parallel with progress simulation
    newImages.forEach(async (uploadingImage, index) => {
      const file = validFiles[index];
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImages(prev => prev.map(img => 
          img.id === uploadingImage.id && img.uploading
            ? { ...img, progress: Math.min((img.progress || 0) + Math.random() * 30, 90) }
            : img
        ));
      }, 200);

      try {
        await uploadSingleImage(file, uploadingImage.id);
        
        // Complete progress
        setImages(prev => prev.map(img => 
          img.id === uploadingImage.id
            ? { ...img, uploading: false, progress: 100 }
            : img
        ));
      } catch (error) {
        // Error handling is done in uploadSingleImage
      } finally {
        clearInterval(progressInterval);
        
        // Clean up progress after delay
        setTimeout(() => {
          setImages(prev => prev.map(img => 
            img.id === uploadingImage.id
              ? { ...img, progress: undefined }
              : img
          ));
        }, 1000);
      }
    });
  }, [images, validateFiles, uploadSingleImage, toast]);

  const deleteImage = useCallback(async (imageId: string) => {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const imageToDelete = images.find(img => img.id === imageId);
      if (!imageToDelete) return;

      const response = await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: imageToDelete.filename,
          classifiedId: currentClassifiedId 
        }),
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        
        toast({
          title: "Başarılı",
          description: "Fotoğraf silindi",
        });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf silinemedi",
        variant: "destructive",
      });
    }
  }, [images, currentClassifiedId, toast]);

  const rotateImage = useCallback(async (imageId: string) => {
    try {
      const imageToRotate = images.find(img => img.id === imageId);
      if (!imageToRotate) return;

      const response = await fetch('/api/rotate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: imageToRotate.filename,
          classifiedId: currentClassifiedId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, url: result.url + '?t=' + Date.now(), thumbnail: result.thumbnail + '?t=' + Date.now() }
            : img
        ));
        
        // Save updated images to draft after rotation
        if (currentClassifiedId) {
          const xhr = new XMLHttpRequest();
          xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              console.log('✅ Photo rotation saved to draft');
            }
          };
          
          // Get updated images with rotation applied
          const updatedImages = images.map(img => 
            img.id === imageId 
              ? { ...img, url: result.url + '?t=' + Date.now(), thumbnail: result.thumbnail + '?t=' + Date.now() }
              : img
          );
          
          xhr.send(JSON.stringify({
            photos: JSON.stringify(updatedImages.map(img => ({
              id: img.id,
              filename: img.filename,
              url: img.url,
              thumbnail: img.thumbnail,
              size: img.size,
              originalSize: img.originalSize,
              order: img.order
            })))
          }));
        }
        
        toast({
          title: "Başarılı",
          description: "Fotoğraf döndürüldü",
        });
      } else {
        throw new Error('Rotation failed');
      }
    } catch (error) {
      toast({
        title: "Hata", 
        description: "Fotoğraf döndürülemedi",
        variant: "destructive",
      });
    }
  }, [images, currentClassifiedId, toast]);

  const saveToDraft = useCallback(async () => {
    if (!currentClassifiedId) return;
    
    try {
      const response = await fetch(`/api/draft-listings/${currentClassifiedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: JSON.stringify(images.map(img => ({
            id: img.id,
            filename: img.filename,
            url: img.url,
            thumbnail: img.thumbnail,
            size: img.size,
            originalSize: img.originalSize,
            order: img.order
          })))
        })
      });
      
      if (response.ok) {
        console.log('✅ Photos saved to draft');
      }
    } catch (error) {
      console.error('❌ Failed to save photos to draft:', error);
    }
  }, [images, currentClassifiedId]);

  return {
    images,
    setImages,
    handleFileSelect,
    deleteImage,
    rotateImage,
    saveToDraft
  };
}