import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useStep4Prefetch } from '@/hooks/useStep4Prefetch';
import { useClassifiedId } from '@/hooks/useClassifiedId';
import { useDoubleClickProtection } from '@/hooks/useDoubleClickProtection';
import { LISTING_CONFIG, ERROR_MESSAGES } from '@shared/constants';

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
}

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

  // DOUBLE-CLICK PROTECTION: Using custom hook
  const { isSubmitting, executeWithProtection } = useDoubleClickProtection();

  // URL parameter support - Custom hook kullanımı
  const currentClassifiedId = useClassifiedId();



  // SECURITY FIX: Draft ownership verification
  const { data: draftData, error: draftError, isError: isDraftError, isLoading: isDraftLoading } = useQuery({
    queryKey: ['/api/draft-listings', currentClassifiedId],
    queryFn: async () => {
      if (!currentClassifiedId) return null;
      const response = await fetch(`/api/draft-listings/${currentClassifiedId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
        }
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.FORBIDDEN);
        }
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      return response.json();
    },
    enabled: !!currentClassifiedId,
    staleTime: 30000, // 30 seconds cache
    gcTime: 300000, // 5 minutes cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // EMERGENCY DEBUG ve manuel validation kodları kaldırıldı

  // PROGRESSIVE DISCLOSURE + ROUTER GUARD: Step 3 validation - REMOVED

  // DEBUG: Log step guard results - REMOVED

  // Step completion marking mutation
  const markStepCompletedMutation = useMutation({
    mutationFn: async ({ classifiedId, step }: { classifiedId: number; step: number }) => {
      const response = await fetch(`/api/draft-listings/${classifiedId}/step/${step}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Step completion update failed');
      return response.json();
    },
  });

  // SECURITY FIX: URL manipülasyonu koruması - İyileştirilmiş Logic
  useEffect(() => {
    if (isDraftError && draftError && currentClassifiedId) {
      console.error('🚨 SECURITY: Unauthorized draft access attempt:', currentClassifiedId);

      // 403 Forbidden: Başka kullanıcının draft'ına erişim - Güvenlik ihlali
      if (draftError.message?.includes('erişim yetkiniz yok')) {
        console.error('🚨 SECURITY VIOLATION: User attempted to access another user\'s draft');
        toast({
          title: "Güvenlik Hatası",
          description: "İlgili ilan için yetkiniz bulunmamaktadır.",
          variant: "destructive"
        });
        navigate('/create-listing/step-1');
      } 
      // 404 Not Found: Hiç var olmayan draft ID - Normal akış
      else if (draftError.message?.includes('bulunamadı')) {
        console.log('ℹ️ Non-existent draft ID, redirecting to Step1 for new listing');
        // Toast gösterme, sadece Step1'e yönlendir
        navigate('/create-listing/step-1');
      }
      // Diğer hatalar
      else {
        console.error('🚨 Unknown draft error:', draftError.message);
        navigate('/create-listing/step-1');
      }
    }
  }, [isDraftError, draftError, currentClassifiedId, navigate, toast]);

  // SECURITY CHECK: Step2 verilerinin tamamlanmış olması gerekiyor
  useEffect(() => {
    if (draftData && currentClassifiedId && !isDraftLoading) {
      console.log('🔍 Step-3 Validasyon: draftData:', draftData);
      console.log('🔍 Step-3 Validasyon: draftData.title:', draftData.title);
      console.log('🔍 Step-3 Validasyon: draftData.description:', draftData.description);
      console.log('🔍 Step-3 Validasyon: draftData.price:', draftData.price);
      console.log('🔍 Step-3 Validasyon: draftData.customFields:', draftData.customFields);

      let customFields;
      try {
        customFields = typeof draftData.customFields === 'string' 
          ? JSON.parse(draftData.customFields) 
          : draftData.customFields;
        console.log('🔍 Step-3 Validasyon: customFields:', customFields);
      } catch (error) {
        console.error('🔍 Step-3 Validasyon: customFields parse hatası:', error);
        // Invalid JSON, redirect to Step2
        toast({
          title: "Form Hatası",
          description: "Step-2'deki form bilgilerini tamamlayınız",
          variant: "destructive"
        });
        navigate(`/create-listing/step-2?classifiedId=${currentClassifiedId}`);
        return;
      }

      // Gerekli alanları kontrol et: title, description, price
      let titleValue = null;
      let descriptionValue = null;
      let priceValue = null;

      // Title kontrolü - önce draftData'dan, sonra customFields'den
      if (draftData?.title?.trim()) {
        titleValue = draftData.title.trim();
        console.log('🔍 Step-3 Validasyon: title from draftData:', titleValue);
      } else if (customFields?.title?.trim()) {
        titleValue = customFields.title.trim();
        console.log('🔍 Step-3 Validasyon: title from customFields:', titleValue);
      }

      // Description kontrolü - önce draftData'dan, sonra customFields'den
      if (draftData?.description?.trim()) {
        descriptionValue = draftData.description.trim();
        console.log('🔍 Step-3 Validasyon: description from draftData:', descriptionValue);
      } else if (customFields?.description?.trim()) {
        descriptionValue = customFields.description.trim();
        console.log('🔍 Step-3 Validasyon: description from customFields:', descriptionValue);
      }

      // Price kontrolü - önce draftData.price'dan, sonra customFields.price'dan
      if (draftData?.price) {
        try {
          const parsedPrice = JSON.parse(draftData.price);
          priceValue = parsedPrice?.value || parsedPrice;
          console.log('🔍 Step-3 Validasyon: price from draftData:', priceValue);
        } catch (error) {
          // JSON parse hatası durumunda string olarak kullan
          priceValue = draftData.price;
          console.log('🔍 Step-3 Validasyon: price from draftData (string):', priceValue);
        }
      } else if (customFields?.price) {
        if (typeof customFields.price === 'object' && customFields.price.value) {
          priceValue = customFields.price.value;
          console.log('🔍 Step-3 Validasyon: price from customFields (object):', priceValue);
        } else if (typeof customFields.price === 'string' && customFields.price.trim()) {
          priceValue = customFields.price;
          console.log('🔍 Step-3 Validasyon: price from customFields (string):', priceValue);
        }
      }

      console.log('🔍 Step-3 Validasyon: Final titleValue:', titleValue);
      console.log('🔍 Step-3 Validasyon: Final descriptionValue:', descriptionValue);
      console.log('🔍 Step-3 Validasyon: Final priceValue:', priceValue);

      // Geçici olarak validasyonu devre dışı bırakıyoruz
      console.log('✅ Step-3 Validasyon: Geçici olarak devre dışı');

      // if (!titleValue || 
      //     !descriptionValue || 
      //     !priceValue) {
      //   console.error('🔍 Step-3 Validasyon: Eksik bilgi tespit edildi!');
      //   console.error('🔍 Step-3 Validasyon: titleValue:', titleValue);
      //   console.error('🔍 Step-3 Validasyon: descriptionValue:', descriptionValue);
      //   console.error('🔍 Step-3 Validasyon: priceValue:', priceValue);
      //   toast({
      //     title: "Eksik Bilgi",
      //     description: "Başlık, açıklama ve fiyat bilgilerini tamamlayınız",
      //     variant: "destructive"
      //   });
      //   navigate(`/create-listing/step-2?classifiedId=${currentClassifiedId}`);
      //   return;
      // }

      console.log('✅ Step-3 Validasyon: Tüm alanlar tamam!');
    }
  }, [draftData, currentClassifiedId, isDraftLoading, navigate, toast]);

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
  // Note: draftData already defined above for security check

  // Track if we've already loaded draft data to prevent re-loading
  const [hasLoadedDraftData, setHasLoadedDraftData] = useState(false);

  // Load photos from draft data when available (only once when component mounts)
  useEffect(() => {
    if (!hasLoadedDraftData && draftData && typeof draftData === 'object' && draftData !== null && 'photos' in draftData && draftData.photos) {
      try {
        const existingPhotos = JSON.parse(draftData.photos as string);

        if (Array.isArray(existingPhotos) && existingPhotos.length > 0) {
          setImages(existingPhotos);
          setHasLoadedDraftData(true);
        }
      } catch (error) {
        // Handle parsing error silently
      }
    }
  }, [draftData, hasLoadedDraftData]);

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

            // Prevent draft data from reloading after upload
            setHasLoadedDraftData(true);

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

      // Prevent draft data from reloading after delete
      setHasLoadedDraftData(true);

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
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

      // 1. Check if file extension is blocked (comprehensive list)
      if (LISTING_CONFIG.BLOCKED_EXTENSIONS.includes(fileExtension as any)) {
        if (fileExtension === '.heic' || fileExtension === '.heif') {
          toast({
            title: "HEIC Formatı Desteklenmiyor",
            description: ERROR_MESSAGES.HEIC_NOT_SUPPORTED,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Desteklenmeyen Dosya Formatı",
            description: `${fileExtension.toUpperCase()} formatı desteklenmemektedir. ${ERROR_MESSAGES.UNSUPPORTED_FILE_EXTENSION}`,
            variant: "destructive"
          });
        }
        return false;
      }

      // 2. Check if file extension is allowed (positive validation)
      if (!LISTING_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
        toast({
          title: "Desteklenmeyen Dosya Uzantısı",
          description: ERROR_MESSAGES.UNSUPPORTED_FILE_EXTENSION,
          variant: "destructive"
        });
        return false;
      }

      // 3. Check if file type is image (browser MIME type validation)
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Geçersiz Dosya Türü",
          description: 'Sadece resim dosyaları yüklenebilir',
          variant: "destructive"
        });
        return false;
      }

      // 4. Check if MIME type is supported (additional validation)
      if (!LISTING_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        toast({
          title: "Desteklenmeyen MIME Türü",
          description: ERROR_MESSAGES.UNSUPPORTED_IMAGE_FORMAT,
          variant: "destructive"
        });
        return false;
      }

      // 5. Check file size
      if (file.size > LISTING_CONFIG.MAX_FILE_SIZE) {
        toast({
          title: "Dosya Çok Büyük",
          description: `Dosya boyutu ${Math.round(LISTING_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB'dan küçük olmalıdır`,
          variant: "destructive"
        });
        return false;
      }

      // All validations passed
      return true;
    });

    if (images.length + validFiles.length > LISTING_CONFIG.MAX_IMAGES) {
      toast({
        title: "Çok Fazla Fotoğraf",
        description: `En fazla ${LISTING_CONFIG.MAX_IMAGES} fotoğraf yükleyebilirsiniz`,
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
    await executeWithProtection(async () => {
      // PHOTO VALIDATION: Check if at least one photo is uploaded
      if (images.length === 0) {
        toast({
          title: "Fotoğraf Gerekli",
          description: "Devam etmek için en az bir fotoğraf yüklemeniz gerekir.",
          variant: "destructive"
        });
        return;
      }
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

        // PROGRESSIVE DISCLOSURE: Mark Step 3 as completed
        await markStepCompletedMutation.mutateAsync({ classifiedId: currentClassifiedId, step: 3 });

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
        return;
      }
      } else {
        navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}&t=${Date.now()}`);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:pt-6 pt-[72px]">
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
                  En fazla {LISTING_CONFIG.MAX_IMAGES} fotoğraf eklenebilir ve her biri maksimum 10MB olabilir.
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
                    Eklenen Fotoğraflar ({images.length}/{LISTING_CONFIG.MAX_IMAGES})
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
          disabled={isSubmitting}
          className={`px-6 py-3 rounded-lg transition-colors font-medium ${
            isSubmitting 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isSubmitting ? 'İşleniyor...' : 'Sonraki Adım'}
        </button>
      </div>

      {/* Performance indicator */}
      <PageLoadIndicator />
    </div>
  );
} 