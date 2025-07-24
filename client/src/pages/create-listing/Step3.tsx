import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, GripVertical, RotateCw } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import CreateListingLayout from '@/components/CreateListingLayout';
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

// Import constants from config
const MAX_IMAGES = 20; // TODO: Import from shared config
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB // TODO: Import from shared config

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // URL parameter support - SABIT DEĞİŞKEN
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = classifiedIdParam ? parseInt(classifiedIdParam) : undefined;
  
  console.log('Step3 yüklendi - currentClassifiedId:', currentClassifiedId);

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

      }
    }
  }, [draftData]);

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
            setImages(prev => prev.map(img => {
              if (img.id === uploadingId && img.uploading) {
                return { ...img, progress: percentComplete };
              }
              return img;
            }));
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
                }
                // Replace with uploaded image
                newImages[uploadingIndex] = { ...data.images[0], uploading: false };
              }
              return newImages;
            });
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
      setImages(prev => prev.filter(img => img.id !== uploadingId));
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
      setImages(prev => prev.filter(img => img.id !== imageId));
    },
    onError: (error) => {

      toast({
        title: "Silme Hatası",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Rotate image function using zustand state management
  const rotateImage = (imageId: string) => {
    setImages(prev => prev.map(img => {
      if (img.id === imageId) {
        // Create a new image element to apply rotation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imageElement = new Image();
        
        imageElement.onload = () => {
          // Set canvas dimensions for 90-degree rotation
          canvas.width = imageElement.height;
          canvas.height = imageElement.width;
          
          // Apply rotation
          ctx?.translate(canvas.width / 2, canvas.height / 2);
          ctx?.rotate(Math.PI / 2);
          ctx?.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
          
          // Convert back to blob and update image
          canvas.toBlob((blob) => {
            if (blob) {
              const newUrl = URL.createObjectURL(blob);
              setImages(prev => prev.map(prevImg => 
                prevImg.id === imageId 
                  ? { ...prevImg, url: newUrl, thumbnail: newUrl }
                  : prevImg
              ));
            }
          }, 'image/jpeg', 0.9);
        };
        
        imageElement.src = img.url;
        return img;
      }
      return img;
    }));
  };

  // Initialize Sortable.js for uploaded images with proper cleanup
  useEffect(() => {
    let sortable: Sortable | null = null;
    
    if (sortableRef.current && images.filter(img => !img.uploading).length > 0) {
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
              
              // SON ÇARE: Fotoğraf sıralama kaydetme - sync call
              console.log('DRAG END - currentClassifiedId:', currentClassifiedId);
              console.log('DRAG END - updatedImages:', updatedImages.map(img => ({ id: img.id, order: img.order })));
              
              if (currentClassifiedId) {
                // Sync XMLHttpRequest - garantili kaydetme
                const xhr = new XMLHttpRequest();
                xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, false); // false = sync
                xhr.setRequestHeader('Content-Type', 'application/json');
                
                try {
                  xhr.send(JSON.stringify({
                    photos: JSON.stringify(updatedImages)
                  }));
                  
                  if (xhr.status === 200) {
                    console.log('✅ SYNC: Fotoğraf sıralaması kaydedildi');
                  } else {
                    console.error('❌ SYNC: Kaydetme başarısız', xhr.status);
                  }
                } catch (error) {
                  console.error('❌ SYNC: API hatası', error);
                }
              } else {
                console.error('❌ currentClassifiedId YOK!');
              }
              
              // State'i return etmeden önce bir daha güncelle - KESIN ÇÖZÜM
              return updatedImages;
            });
          }
        }
      });
    }

    return () => {
      if (sortable) {
        try {
          sortable.destroy();
        } catch (error) {
          // Sortable already destroyed, ignore error
        }
      }
    };
  }, [images.filter(img => !img.uploading).length, currentClassifiedId]); // Only reinitialize when non-uploading images change

  // Removed redirect for development

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
        title: "Çok Fazla Resim",
        description: `En fazla ${MAX_IMAGES} resim yükleyebilirsiniz`,
        variant: "destructive"
      });
      return;
    }

    if (validFiles.length > 0) {
      // Create preview images with uploading state
      const newImages: UploadedImage[] = validFiles.map((file, index) => {
        const id = `uploading-${Date.now()}-${index}`;
        return {
          id,
          filename: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          originalSize: file.size,
          uploading: true,
          progress: 0
        };
      });
      
      setImages(prev => [...prev, ...newImages]);
      
      // Upload each image individually for separate progress tracking
      newImages.forEach((newImage, index) => {
        uploadSingleImage(validFiles[index], newImage.id);
      });
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
    handleFileSelect(e.dataTransfer.files);
  };

  // Use standard draft mutation
  const updateDraftMutation = useUpdateDraftListing();

  // Auto-save photos to draft whenever images change (with debounce)
  useEffect(() => {
    if (currentClassifiedId && !images.some(img => img.uploading)) {
      const timeoutId = setTimeout(() => {
        updateDraftMutation.mutate({
          id: currentClassifiedId,
          data: {
            photos: JSON.stringify(images.map(img => ({
              id: img.id,
              filename: img.filename,
              url: img.url,
              thumbnail: img.thumbnail,
              size: img.size,
              originalSize: img.originalSize
            })))
          }
        });
      }, 1500); // 1.5 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [images, currentClassifiedId]);

  const handleNextStep = () => {
    // Wait for all uploads to complete
    const hasUploading = images.some(img => img.uploading);
    if (hasUploading) {
      toast({
        title: "Bekleyiniz",
        description: 'Lütfen tüm fotoğrafların yüklenmesini bekleyin',
        variant: "destructive"
      });
      return;
    }

    // Save photos to draft before navigating
    if (currentClassifiedId && images.length > 0) {
      updateDraftMutation.mutate({
        id: currentClassifiedId,
        data: {
          photos: JSON.stringify(images.map(img => ({
            id: img.id,
            filename: img.filename,
            url: img.url,
            thumbnail: img.thumbnail,
            size: img.size,
            originalSize: img.originalSize
          })))
        }
      }, {
        onSuccess: () => {
          navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`);
        }
      });
    } else {
      navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <CreateListingLayout stepNumber={3}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Fotoğraf Yükleme Kutusu */}
          <div className="mb-6 lg:mt-0 mt-3">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
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
                  <div key={image.id} className={`relative group bg-white border-2 border-gray-200 overflow-hidden shadow-sm ${image.uploading ? 'uploading-item' : ''}`} style={{ aspectRatio: '4/3' }}>
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
                        className="absolute bottom-1 right-1 w-6 h-6 bg-gray-800 bg-opacity-80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10 flex items-center justify-center"
                      >
                        <RotateCw className="w-3 h-3" />
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
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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
          onClick={() => {
            const url = `/create-listing/step-4?classifiedId=${currentClassifiedId}`;
            navigate(url);
          }}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Sonraki Adım
        </button>
      </div>
      
      {/* Performance indicator */}
      <PageLoadIndicator />
    </CreateListingLayout>
  );
}