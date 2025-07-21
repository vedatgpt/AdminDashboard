import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, GripVertical, RotateCw } from "lucide-react";
import { useLocation } from "wouter";
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
}

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<HTMLDivElement>(null);

  // Removed authentication check for development

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
      console.error('Upload error:', error);
      // Remove failed upload
      setImages(prev => prev.filter(img => img.id !== uploadingId));
      alert(`Yükleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
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
      console.error('Delete error:', error);
      alert(`Silme hatası: ${error.message}`);
    }
  });

  // Initialize Sortable.js for uploaded images
  useEffect(() => {
    if (sortableRef.current && images.filter(img => !img.uploading).length > 0) {
      const sortable = Sortable.create(sortableRef.current, {
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
              const [removed] = newImages.splice(evt.oldIndex, 1);
              newImages.splice(evt.newIndex, 0, removed);
              return newImages;
            });
          }
        }
      });

      return () => {
        if (sortable) {
          sortable.destroy();
        }
      };
    }
  }, [images.filter(img => !img.uploading).length]); // Only reinitialize when non-uploading images change

  // Removed redirect for development

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('Sadece resim dosyaları yüklenebilir');
        return false;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        alert(`Dosya boyutu ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB'dan küçük olmalıdır`);
        return false;
      }
      
      // Remove duplicate check - allow same images to be uploaded
      return true;
    });

    if (images.length + validFiles.length > MAX_IMAGES) {
      alert(`En fazla ${MAX_IMAGES} resim yükleyebilirsiniz`);
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

  const handleNextStep = () => {
    // Wait for all uploads to complete
    const hasUploading = images.some(img => img.uploading);
    if (hasUploading) {
      alert('Lütfen tüm fotoğrafların yüklenmesini bekleyin');
      return;
    }

    // For now, just store images in localStorage temporarily
    localStorage.setItem('listingImages', JSON.stringify(images.map(img => ({
      filename: img.filename,
      url: img.url,
      thumbnail: img.thumbnail
    }))));
    navigate('/create-listing/step-4');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fotoğraf Yükleme</h1>
            <p className="text-gray-600">
              İlanınıza ait fotoğrafları yükleyin. En fazla {MAX_IMAGES} fotoğraf yükleyebilirsiniz.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-orange-400 bg-orange-50' 
                  : 'border-gray-300 hover:border-orange-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {images.some(img => img.uploading) ? (
                <div className="space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600">Fotoğraflar işleniyor...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-orange-100 rounded-full">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Fotoğrafları buraya sürükleyin veya tıklayın
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG dosyaları kabul edilir. Maksimum 10MB.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Camera className="w-4 h-4" />
                    Fotoğraf Seç
                  </button>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Fotoğraflar ({images.length}/{MAX_IMAGES})
                </h3>
                <div className="text-sm text-gray-500">
                  Sürükleyerek sıralayabilirsiniz
                </div>
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
                        onClick={() => {
                          // Rotate functionality placeholder
                          alert('Döndürme özelliği yakında eklenecek');
                        }}
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

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/create-listing/step-2')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              ← Geri
            </button>
            
            <button
              onClick={handleNextStep}
              disabled={images.length === 0 || images.some(img => img.uploading)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                images.length > 0 && !images.some(img => img.uploading)
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              İlerle →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}