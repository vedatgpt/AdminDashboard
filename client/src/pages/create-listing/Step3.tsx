import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Upload, X, GripVertical, RotateCw } from "lucide-react";
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

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Get classifiedId from URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentClassifiedId = urlParams.get('classifiedId') ? parseInt(urlParams.get('classifiedId')!) : undefined;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load existing photos from draft
  const { data: draftData } = useDraftListing(currentClassifiedId);
  const updateDraftMutation = useUpdateDraftListing();

  useEffect(() => {
    if (draftData?.photos && images.length === 0) {
      try {
        const existingPhotos = JSON.parse(draftData.photos as string);
        if (Array.isArray(existingPhotos)) {
          setImages(existingPhotos);
        }
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
      }
    }
  }, [draftData]);

  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload/photos', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data, formData) => {
      // Update image with actual data
      const file = formData.get('photo') as File;
      const tempId = formData.get('tempId') as string;
      
      setImages(prev => prev.map(img => 
        img.id === tempId 
          ? { ...img, ...data, uploading: false, progress: 100 }
          : img
      ));
      
      // Save to draft
      saveToDraft();
    },
    onError: (error, formData) => {
      const tempId = formData.get('tempId') as string;
      setImages(prev => prev.filter(img => img.id !== tempId));
      toast({
        title: "Yükleme Hatası",
        description: "Fotoğraf yüklenemedi",
        variant: "destructive",
      });
    }
  });

  // Save photos to draft
  const saveToDraft = () => {
    if (!currentClassifiedId) return;
    
    const photosToSave = images.filter(img => !img.uploading);
    updateDraftMutation.mutate({
      id: currentClassifiedId,
      data: { photos: JSON.stringify(photosToSave) }
    });
  };

  // Initialize Sortable.js
  useEffect(() => {
    if (!sortableRef.current || images.filter(img => !img.uploading).length === 0) return;

    const sortable = new Sortable(sortableRef.current, {
      animation: 150,
      ghostClass: 'opacity-50',
      chosenClass: 'ring-2 ring-orange-500',
      dragClass: 'rotate-3',
      handle: '.drag-handle',
      filter: '.uploading-item',
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          setImages(prevImages => {
            const newImages = [...prevImages];
            const [removed] = newImages.splice(evt.oldIndex!, 1);
            newImages.splice(evt.newIndex!, 0, removed);
            
            // Update order numbers
            const updatedImages = newImages.map((img, index) => ({
              ...img,
              order: index + 1
            }));
            
            // Save to draft asynchronously
            if (currentClassifiedId) {
              const xhr = new XMLHttpRequest();
              xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, true);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.send(JSON.stringify({
                photos: JSON.stringify(updatedImages.filter(img => !img.uploading))
              }));
            }
            
            return updatedImages;
          });
        }
      }
    });

    return () => sortable?.destroy();
  }, [images.filter(img => !img.uploading).length, currentClassifiedId]);

  // File upload handler
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Hata", description: "Sadece resim dosyaları yüklenebilir", variant: "destructive" });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Hata", description: "Dosya boyutu 10MB'dan küçük olmalıdır", variant: "destructive" });
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > MAX_IMAGES) {
      toast({ title: "Hata", description: `En fazla ${MAX_IMAGES} fotoğraf yüklenebilir`, variant: "destructive" });
      return;
    }

    // Add files to state with uploading status
    validFiles.forEach(file => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempImage: UploadedImage = {
        id: tempId,
        filename: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        originalSize: file.size,
        uploading: true,
        progress: 0,
        order: images.length + 1
      };
      
      setImages(prev => [...prev, tempImage]);
      
      // Upload file
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('tempId', tempId);
      if (currentClassifiedId) formData.append('classifiedId', currentClassifiedId.toString());
      
      uploadMutation.mutate(formData);
    });
  };

  // Delete image
  const deleteImage = (imageId: string) => {
    if (confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
      setImages(prev => prev.filter(img => img.id !== imageId));
      saveToDraft();
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Format file size
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
        
        {/* Upload Area */}
        <div className="mb-6 lg:mt-0 mt-3">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="w-full">
              <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
                Fotoğraf
              </h3>
              
              <div 
                className={`cursor-pointer p-12 flex justify-center bg-white border border-dashed rounded-xl transition-colors ${
                  dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
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
                          <feGaussianBlur stdDeviation="2"></feGaussianBlur>
                          <feComposite in2="hardAlpha" operator="out"></feComposite>
                          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"></feColorMatrix>
                          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_109"></feBlend>
                          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_109" result="shape"></feBlend>
                        </filter>
                      </defs>
                    </svg>
                  </span>
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <span className="font-semibold text-orange-600 hover:text-orange-500">
                      Fotoğraf yüklemek için tıklayın
                    </span>
                    <p className="pl-1">veya sürükleyip bırakın</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">PNG, JPG, JPEG (max. 10MB)</p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        {images.length > 0 && (
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">
                Yüklenen Fotoğraflar ({images.filter(img => !img.uploading).length}/{MAX_IMAGES})
              </h4>
              
              <div 
                ref={sortableRef}
                className="grid grid-cols-2 lg:grid-cols-5 gap-4"
              >
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative group bg-white border-2 border-gray-200 rounded-lg overflow-hidden ${
                      image.uploading ? 'uploading-item opacity-75' : ''
                    }`}
                    data-id={image.id}
                  >
                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-600 rounded-full">
                        {index + 1}
                      </span>
                    </div>

                    {/* Drag Handle */}
                    {!image.uploading && (
                      <div className="drag-handle absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                        <div className="p-1 bg-gray-600 text-white rounded">
                          <GripVertical size={14} />
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="absolute top-8 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>

                    {/* Image */}
                    <div className="aspect-[4/3] relative">
                      <img
                        src={image.thumbnail || image.url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Upload Progress */}
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm">Yükleniyor...</div>
                          </div>
                        </div>
                      )}
                    </div>

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
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => navigate(`/create-listing/step-2?classifiedId=${currentClassifiedId}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Önceki Adım
          </button>
          
          <button
            onClick={() => navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sonraki Adım
          </button>
        </div>
        
        <PageLoadIndicator />
      </div>
    </CreateListingLayout>
  );
}