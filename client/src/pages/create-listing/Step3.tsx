import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, GripVertical, RotateCw } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useStep4Prefetch } from '@/hooks/useStep4Prefetch';
import Sortable from "sortablejs";

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
  rotating?: boolean; // ROTATION FIX: Add rotation state
}

// Import constants from config
const MAX_IMAGES = 20; // TODO: Import from shared config
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB // TODO: Import from shared config

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { smartPrefetchStep4 } = useStep4Prefetch();
  const { toast } = useToast();
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateDraftMutation = useUpdateDraftListing();

  // URL parameter support - SABIT DEĞİŞKEN
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = classifiedIdParam ? parseInt(classifiedIdParam) : undefined;

  console.log('Step3 yüklendi - currentClassifiedId:', currentClassifiedId);

  // Memoized filtered images for Sortable.js
  const nonUploadingImages = useMemo(() => 
    images.filter(img => !img.uploading), 
    [images]
  );

  // Memoized file size formatter
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  // Load existing photos from draft when component mounts
  const { data: draftData } = useDraftListing(currentClassifiedId);

  // Load photos from draft data when available (only once when component mounts)
  useEffect(() => {
    if (draftData && typeof draftData === 'object' && draftData !== null && 'photos' in draftData && draftData.photos) {
      try {
        const existingPhotos = JSON.parse(draftData.photos as string);

        if (Array.isArray(existingPhotos) && existingPhotos.length > 0) {
          // Only set if images array is empty to avoid overriding current state
          setImages(prev => {
            return prev.length === 0 ? existingPhotos : prev;
          });
        }
      } catch (error) {
        // Handle parsing error silently
      }
    }
  }, [draftData]);

  // Debounced save function
  const debouncedSave = useCallback((updatedImages: UploadedImage[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (currentClassifiedId) {
        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
          if (xhr.status === 200) {
            console.log('✅ ASYNC: Fotoğraf sıralaması kaydedildi');
            
            // Sıralama kaydedildikten sonra Step4 prefetch tetikle (debounced)
            if (user?.id) {
              smartPrefetchStep4(currentClassifiedId, user.id, 'Fotoğraf sıralama');
            }
          } else {
            console.error('❌ ASYNC: Kaydetme başarısız', xhr.status);
          }
        };

        xhr.onerror = function() {
          console.error('❌ ASYNC: API hatası');
        };

        xhr.send(JSON.stringify({
          photos: JSON.stringify(updatedImages)
        }));
      }
    }, 500); // 500ms debounce
  }, [currentClassifiedId]);

  const uploadSingleImage = async (file: File, uploadingId: string) => {
    const formData = new FormData();
    formData.append('images', file);

    try {
      // Create XMLHttpRequest for real progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setImages(prev => {
              const uploadingIndex = prev.findIndex(img => img.id === uploadingId && img.uploading);
              if (uploadingIndex !== -1) {
                const newImages = [...prev];
                newImages[uploadingIndex] = { ...newImages[uploadingIndex], progress: percentComplete };
                return newImages;
              }
              return prev;
            });
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            // Replace uploading image with actual uploaded one
            setImages(prev => {
              const newImages = [...prev];
              const uploadingIndex = newImages.findIndex(img => img.id === uploadingId);
              if (uploadingIndex !== -1 && data.images[0]) {
                // Clean up blob URL
                if (newImages[uploadingIndex].url.startsWith('blob:')) {
                  URL.revokeObjectURL(newImages[uploadingIndex].url);
                  blobUrlsRef.current.delete(newImages[uploadingIndex].url);
                }
                // Replace with uploaded image
                newImages[uploadingIndex] = { ...data.images[0], uploading: false };
              }
              return newImages;
            });
            
            // Fotoğraf upload tamamlandıktan sonra Step4 prefetch tetikle
            if (currentClassifiedId && user?.id) {
              smartPrefetchStep4(currentClassifiedId, user.id, 'Fotoğraf yükleme');
            }
            
            resolve(data);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.open('POST', '/api/upload/images');
        xhr.send(formData);
      });

    } catch (error) {
      // Remove failed upload
      setImages(prev => {
        const newImages = prev.filter(img => img.id !== uploadingId);
        // Clean up blob URL
        const failedImage = prev.find(img => img.id === uploadingId);
        if (failedImage?.url.startsWith('blob:')) {
          URL.revokeObjectURL(failedImage.url);
          blobUrlsRef.current.delete(failedImage.url);
        }
        return newImages;
      });
      toast({
        title: "Yükleme Hatası",
        description: error instanceof Error ? error.message : 'Bilinmeyen hata',
        variant: "destructive"
      });
    }
  };

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/upload/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: (_, imageId) => {
      setImages(prev => {
        const imageToDelete = prev.find(img => img.id === imageId);
        if (imageToDelete?.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageToDelete.url);
          blobUrlsRef.current.delete(imageToDelete.url);
        }
        return prev.filter(img => img.id !== imageId);
      });
      
      // Fotoğraf silindikten sonra Step4 prefetch tetikle
      if (currentClassifiedId && user?.id) {
        smartPrefetchStep4(currentClassifiedId, user.id, 'Fotoğraf silme');
      }
    },
    onError: (error) => {
      toast({
        title: "Silme Hatası",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // ROTATION FIX v2: Server-side rotation endpoint kullanımı
  const rotateImage = useCallback(async (imageId: string) => {
    console.log('🔄 ROTATION FIX v2: Server-side rotation başlatılıyor:', imageId);
    
    try {
      // Find the image to rotate
      const imageToRotate = images.find(img => img.id === imageId);
      if (!imageToRotate) {
        console.error('❌ ROTATION ERROR: Image not found:', imageId);
        return;
      }

      // Show loading state immediately
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, rotating: true }
          : img
      ));

      console.log('📡 ROTATION FIX v2: Calling server rotation endpoint...');
      
      // Call server-side rotation endpoint
      const response = await fetch(`/api/upload/images/${imageId}/rotate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server rotation failed');
      }

      const result = await response.json();
      console.log('✅ ROTATION FIX v2: Server rotation successful:', result);

      // BLOB URL FIX: Clean up old blob URL before setting new server URL
      const imageToUpdate = images.find(img => img.id === imageId);
      if (imageToUpdate?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToUpdate.url);
        blobUrlsRef.current.delete(imageToUpdate.url);
        console.log('🗑️ ROTATION FIX: Old blob URL cleaned up');
      }

      // Update image URLs with rotated versions - SERVER URLS NO BLOB
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              url: result.url,  // Server URL with timestamp
              thumbnail: result.thumbnail, // Server URL with timestamp
              rotating: false 
            }
          : img
      ));

      console.log('✅ ROTATION SUCCESS v2: Image rotated via server');
      
      // Trigger Step4 prefetch after rotation
      if (currentClassifiedId && user?.id) {
        smartPrefetchStep4(currentClassifiedId, user.id, 'Fotoğraf döndürme (server)');
      }

    } catch (error) {
      console.error('❌ ROTATION ERROR v2: Server rotation failed:', error);
      
      // Remove loading state on error
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, rotating: false }
          : img
      ));
      
      // Show error message instead of fallback (server rotation should work)
      toast({
        title: "Döndürme Hatası",
        description: "Server rotation failed: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      });
    }
  }, [images, currentClassifiedId, user?.id, smartPrefetchStep4]);

  // CLIENT-SIDE ROTATION FALLBACK: Enhanced blob URL handling
  const clientSideRotateImage = useCallback(async (imageId: string) => {
    console.log('🔄 CLIENT ROTATION: Fotoğraf döndürme başlatılıyor:', imageId);
    
    try {
      // Find the image to rotate
      const imageToRotate = images.find(img => img.id === imageId);
      if (!imageToRotate) {
        console.error('❌ CLIENT ROTATION ERROR: Image not found:', imageId);
        return;
      }

      // Create canvas for rotation with proper error handling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context oluşturulamadı');
      }

      // Load image and perform rotation - ENHANCED BLOB URL HANDLING
      const imageElement = new Image();
      
      const rotationPromise = new Promise<string>((resolve, reject) => {
        // Enhanced error handling with timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Resim yükleme zaman aşımı (5 saniye)'));
        }, 5000);

        imageElement.onload = () => {
          clearTimeout(timeoutId);
          try {
            console.log('🖼️ ROTATION FIX: Image loaded successfully, dimensions:', imageElement.width, 'x', imageElement.height);
            
            // Validate image dimensions
            if (imageElement.width === 0 || imageElement.height === 0) {
              throw new Error('Geçersiz resim boyutları');
            }
            
            // Set canvas dimensions for 90-degree rotation
            canvas.width = imageElement.height;
            canvas.height = imageElement.width;

            // Clear canvas to prevent artifacts
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply rotation transformation
            ctx.save(); // Save context state
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
            ctx.restore(); // Restore context state

            console.log('🔄 ROTATION FIX: Canvas drawing completed, creating blob...');

            // Convert to high-quality blob
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('✅ ROTATION FIX: Blob created successfully, size:', blob.size);
                
                // Clean up old blob URL if it exists
                if (imageToRotate.url.startsWith('blob:')) {
                  URL.revokeObjectURL(imageToRotate.url);
                  blobUrlsRef.current.delete(imageToRotate.url);
                }
                
                const newUrl = URL.createObjectURL(blob);
                blobUrlsRef.current.add(newUrl);
                resolve(newUrl);
              } else {
                reject(new Error('Blob oluşturulamadı - canvas.toBlob() başarısız'));
              }
            }, 'image/jpeg', 0.95); // Higher quality for better visual result
            
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ ROTATION ERROR: Canvas operation failed:', error);
            reject(error instanceof Error ? error : new Error('Canvas işlemi başarısız'));
          }
        };

        imageElement.onerror = (event) => {
          clearTimeout(timeoutId);
          console.error('❌ ROTATION ERROR: Image load failed:', event);
          console.error('Failed URL:', imageToRotate.url);
          reject(new Error('Resim dosyası yüklenemedi - corrupt veya invalid format'));
        };

        // Enhanced image loading for blob URLs
        try {
          console.log('🔄 ROTATION FIX: Starting image load:', imageToRotate.url.substring(0, 50) + '...');
          
          // For blob URLs, don't set crossOrigin (causes issues)
          if (imageToRotate.url.startsWith('blob:')) {
            imageElement.src = imageToRotate.url;
          } else {
            // For regular URLs, use crossOrigin
            imageElement.crossOrigin = 'anonymous';
            imageElement.src = imageToRotate.url;
          }
        } catch (error) {
          clearTimeout(timeoutId);
          reject(new Error('Resim URL\'si set edilemedi'));
        }
      });

      // Wait for image processing
      console.log('⏳ ROTATION FIX: Waiting for rotation to complete...');
      const newUrl = await rotationPromise;
      console.log('✅ ROTATION FIX: Rotation completed, new URL:', newUrl.substring(0, 50) + '...');

      // Update state with new rotated image
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              url: newUrl, 
              thumbnail: newUrl,
              rotating: false 
            }
          : img
      ));

      console.log('✅ ROTATION SUCCESS: Image rotated successfully');
      
      // Trigger Step4 prefetch after rotation
      if (currentClassifiedId && user?.id) {
        smartPrefetchStep4(currentClassifiedId, user.id, 'Fotoğraf döndürme');
      }

    } catch (error) {
      console.error('❌ ROTATION ERROR: Rotation failed:', error);
      
      // Remove loading state on error
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, rotating: false }
          : img
      ));
      
      toast({
        title: "Döndürme Hatası",
        description: error instanceof Error ? error.message : 'Fotoğraf döndürülemedi',
        variant: "destructive"
      });
    }
  }, [images, currentClassifiedId, user?.id, smartPrefetchStep4, toast]);

  // Initialize Sortable.js for uploaded images with proper cleanup
  useEffect(() => {
    let sortable: Sortable | null = null;

    if (sortableRef.current && nonUploadingImages.length > 0) {
      try {
                sortable = Sortable.create(sortableRef.current, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'opacity-50',
          chosenClass: 'border-orange-500',
          filter: '.uploading-item', // Exclude uploading items from sorting
          preventOnFilter: false,
          onEnd: (evt) => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
              // Prevent page refresh by using React state management
              evt.preventDefault?.();
              setImages(prevImages => {
                const newImages = [...prevImages];
                const [removed] = newImages.splice(evt.oldIndex!, 1);
                newImages.splice(evt.newIndex!, 0, removed);

                // Update order numbers and save to draft
                const updatedImages = newImages.map((img, index) => ({
                  ...img,
                  order: index + 1
                }));

                // Debounced save
                debouncedSave(updatedImages);

                return updatedImages;
              });
            }
          }
        });
      } catch (error) {
        console.error('Sortable.js initialization error:', error);
      }
    }

    return () => {
      if (sortable && sortable.el) {
        try {
          sortable.destroy();
        } catch (error) {
          // Sortable already destroyed, ignore error
        }
      }
    };
  }, [nonUploadingImages.length, debouncedSave]); // Only reinitialize when non-uploading images change

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Geçersiz Dosya",
          description: 'Sadece resim dosyaları yüklenebilir',
          variant: "destructive"
        });
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Dosya Çok Büyük",
          description: `Dosya boyutu ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB'dan küçük olmalıdır`,
          variant: "destructive"
        });
        return false;
      }

      // Remove duplicate check - allow same images to be uploaded
      return true;
    });

    if (images.length + validFiles.length > MAX_IMAGES) {
      toast({
        title: "Çok Fazla Fotoğraf",
        description: `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz`,
        variant: "destructive"
      });
      return;
    }

    // Add files to images array with uploading state
    const newUploadingImages = validFiles.map(file => {
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);
      return {
        id: `uploading-${Date.now()}-${Math.random()}`,
        filename: file.name,
        url: blobUrl,
        size: file.size,
        originalSize: file.size,
        uploading: true,
        progress: 0,
        order: images.length + 1
      } as UploadedImage;
    });

    setImages(prev => [...prev, ...newUploadingImages]);

    // Upload files sequentially
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadingId = newUploadingImages[i].id;
      await uploadSingleImage(file, uploadingId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleNextStep = async () => {
    // Clear any pending save timeout and execute immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;

      // Immediately save any pending changes
      if (currentClassifiedId && images.length > 0) {
        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, false); // Synchronous for immediate save
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
          photos: JSON.stringify(images)
        }));
      }
    }

    if (!currentClassifiedId) {
      toast({
        title: "Hata",
        description: "İlan ID bulunamadı. Lütfen sayfayı yenileyin.",
        variant: "destructive"
      });
      return;
    }

    if (images.length > 0) {
      // Show loading state
      toast({
        title: "Kaydediliyor...",
        description: "Fotoğraflar kaydediliyor, lütfen bekleyin.",
        variant: "default"
      });

      try {
        // Wait for the save to complete
        await new Promise((resolve, reject) => {
          updateDraftMutation.mutate({
            id: currentClassifiedId,
            data: {
              photos: JSON.stringify(images)
            }
          }, {
            onSuccess: () => {
              resolve(true);
            },
            onError: (error) => {
              reject(error);
            }
          });
        });

        // Wait a bit more to ensure server has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));

        // Son prefetch - Step4'e gitmeden önce
        if (user?.id) {
          smartPrefetchStep4(currentClassifiedId, user.id, 'Step4 navigation');
        }
        
        // Navigate to Step-4
        navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}&t=${Date.now()}`);
      } catch (error) {
        toast({
          title: "Kaydetme Hatası",
          description: "Fotoğraflar kaydedilemedi. Lütfen tekrar deneyin.",
          variant: "destructive"
        });
      }
    } else {
      navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}&t=${Date.now()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Fotoğraf Yükleme Kutusu */}
      <div className="mb-6 lg:mt-0 mt-3">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-full">
            <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
              Fotoğraf
            </h3>

            <div className="cursor-pointer p-12 flex justify-center bg-white border border-dashed border-gray-300 rounded-xl hover:border-orange-400 transition-colors"
             onClick={() => fileInputRef.current?.click()}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}>
              <div className="text-center">
                <span className="inline-flex justify-center items-center size-16">
                  <svg className="shrink-0 w-16 h-auto text-orange-500" width="71" height="51" viewBox="0 0 71 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.55172 8.74547L17.7131 6.88524V40.7377L12.8018 41.7717C9.51306 42.464 6.29705 40.3203 5.67081 37.0184L1.64319 15.7818C1.01599 12.4748 3.23148 9.29884 6.55172 8.74547Z" stroke="currentColor" strokeWidth="2"></path>
                    <path d="M64.4483 8.74547L53.2869 6.88524V40.7377L58.1982 41.7717C61.4869 42.464 64.703 40.3203 65.3292 37.0184L69.3568 15.7818C69.984 12.4748 67.7685 9.29884 64.4483 8.74547Z" stroke="currentColor" strokeWidth="2"></path>
                    <g filter="url(#filter1)">
                      <rect x="17.5656" y="1" width="35.8689" height="42.7541" rx="5" stroke="currentColor" strokeWidth="2" shapeRendering="crispEdges"></rect>
                    </g>
                    <path d="M39.4826 33.0893C40.2331 33.9529 41.5385 34.0028 42.3537 33.2426L42.5099 33.0796L47.7453 26.976L53.4347 33.0981V38.7544C53.4346 41.5156 51.1959 43.7542 48.4347 43.7544H22.5656C19.8043 43.7544 17.5657 41.5157 17.5656 38.7544V35.2934L29.9728 22.145L39.4826 33.0893Z" className="fill-orange-50" fill="currentColor" stroke="currentColor" strokeWidth="2"></path>
                    <circle cx="40.0902" cy="14.3443" r="4.16393" className="fill-orange-50" fill="currentColor" stroke="currentColor" strokeWidth="2"></circle>
                    <defs>
                      <filter id="filter1" x="13.5656" y="0" width="43.8689" height="50.7541" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
                        <feOffset dy="3"></feOffset>
                        <feGaussianBlur stdDeviation="1.5"></feGaussianBlur>
                        <feComposite in2="hardAlpha" operator="out"></feComposite>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"></feColorMatrix>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"></feBlend>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"></feBlend>
                      </filter>
                    </defs>
                  </svg>
                </span>

                <div className="mt-4 flex flex-wrap justify-center text-sm/6 text-gray-600">
                  <span className="pe-1 bg-white font-semibold text-orange-600 hover:text-orange-700 rounded-lg decoration-2 hover:underline focus-within:outline-hidden focus-within:ring-2 focus-within:ring-orange-600 focus-within:ring-offset-2">Fotoğraf Ekle</span>
                  <span className="font-medium text-gray-800">
                    veya sürükle bırak
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  En fazla {MAX_IMAGES} fotoğraf eklenebilir ve her biri maksimum 10MB olabilir.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Images Grid */}
            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">
                    Eklenen Fotoğraflar ({images.length}/{MAX_IMAGES})
                  </h3>
                </div>

                <div ref={sortableRef} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className={`relative group bg-white border border-gray-200 overflow-hidden shadow-sm ${image.uploading ? 'uploading-item' : ''}`} style={{ aspectRatio: '4/3' }}>
                      {/* Image Order Badge - Sol üst */}
                      <div className="absolute top-1 left-1 bg-gray-800 bg-opacity-80 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium z-10">
                        {index + 1}
                      </div>

                      {/* Delete Button - Sağ üst */}
                      {!image.uploading && (
                        <button
                          onClick={() => {
                            if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
                              deleteImageMutation.mutate(image.id);
                            }
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-gray-800 bg-opacity-80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10 flex items-center justify-center"
                          disabled={deleteImageMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* Rotate Button - Sağ alt */}
                      {!image.uploading && (
                        <button
                          onClick={() => rotateImage(image.id)}
                          disabled={image.rotating}
                          className="absolute bottom-1 right-1 w-6 h-6 bg-gray-800 bg-opacity-80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10 flex items-center justify-center disabled:opacity-50"
                        >
                          {image.rotating ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <RotateCw className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      {/* Drag Handle - Orta */}
                      {!image.uploading && (
                        <div className="drag-handle absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 bg-opacity-80 text-white rounded-full cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      <div className="w-full h-full bg-gray-100 overflow-hidden">
                        <img
                          src={image.uploading ? image.url : (image.thumbnail || image.url)}
                          alt={`Fotoğraf ${index + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('❌ IMAGE LOAD ERROR:', image.id, 'URL:', image.url);
                            // Fallback to main image if thumbnail fails
                            if (image.thumbnail && e.currentTarget.src === image.thumbnail) {
                              e.currentTarget.src = image.url;
                            }
                          }}
                        />
                      </div>

                      {/* Upload Progress */}
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-6 h-6 border border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm font-medium">{image.progress}%</div>
                          </div>
                        </div>
                      )}

                      {/* Rotation Progress - ROTATION FIX */}
                      {image.rotating && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-6 h-6 border border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm font-medium">Döndürülüyor...</div>
                          </div>
                        </div>
                      )}

                      {/* Image Info */}
                      <div className="p-2 bg-white">
                        <div className="text-xs text-gray-500 text-center">
                          <div>{formatFileSize(image.size)}</div>
                          {image.originalSize > image.size && (
                            <div className="text-green-600">
                              ↓ {Math.round((1 - image.size / image.originalSize) * 100)}% küçültüldü
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={() => {
            const url = `/create-listing/step-2?classifiedId=${currentClassifiedId}`;
            navigate(url);
          }}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Önceki Adım
        </button>

        <button
          onClick={handleNextStep}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Sonraki Adım
        </button>
      </div>

      {/* Performance indicator */}
      <PageLoadIndicator />
    </div>
  );
} 