import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";
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

interface PreviewImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  uploaded?: UploadedImage;
}

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sortableRef = useRef<HTMLDivElement>(null);

  // Removed authentication check for development

  const uploadSingleImage = async (previewImage: PreviewImage) => {
    const formData = new FormData();
    formData.append('images', previewImage.file);
    
    try {
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Update preview image as uploaded
      setPreviewImages(prev => prev.map(img => 
        img.id === previewImage.id 
          ? { ...img, uploading: false, progress: 100, uploaded: data.images[0] }
          : img
      ));
      
      // Add to uploaded images
      setImages(prev => [...prev, data.images[0]]);
      
    } catch (error) {
      console.error('Upload error:', error);
      // Mark as failed
      setPreviewImages(prev => prev.map(img => 
        img.id === previewImage.id 
          ? { ...img, uploading: false, progress: 0 }
          : img
      ));
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
    if (sortableRef.current && images.length > 0) {
      const sortable = Sortable.create(sortableRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'opacity-50',
        chosenClass: 'ring-2 ring-orange-500',
        onEnd: (evt) => {
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
            const newImages = [...images];
            const [removed] = newImages.splice(evt.oldIndex, 1);
            newImages.splice(evt.newIndex, 0, removed);
            setImages(newImages);
          }
        }
      });

      return () => sortable.destroy();
    }
  }, [images.length]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewImages.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  const totalImages = images.length + previewImages.length;

  // Removed redirect for development

  const handleFileSelect = (files: FileList | null) => {
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
      
      return true;
    });

    if (images.length + previewImages.length + validFiles.length > MAX_IMAGES) {
      alert(`En fazla ${MAX_IMAGES} resim yükleyebilirsiniz`);
      return;
    }

    if (validFiles.length > 0) {
      // Create preview images
      const newPreviews: PreviewImage[] = validFiles.map(file => ({
        id: `preview-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        progress: 0
      }));
      
      setPreviewImages(prev => [...prev, ...newPreviews]);
      
      // Start uploading each image
      newPreviews.forEach(preview => {
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            setPreviewImages(prev => prev.map(img => 
              img.id === preview.id ? { ...img, progress } : img
            ));
          } else {
            clearInterval(progressInterval);
          }
        }, 200);
        
        // Start actual upload
        uploadSingleImage(preview);
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
    const hasUploading = previewImages.some(img => img.uploading);
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
              {previewImages.some(img => img.uploading) ? (
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

          {/* Preview Images */}
          {previewImages.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5" />
                Yükleniyor ({previewImages.length})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewImages.map((preview) => (
                  <div key={preview.id} className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={preview.preview}
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Upload Progress */}
                    {preview.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <div className="text-sm">{preview.progress}%</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Success */}
                    {preview.uploaded && (
                      <div className="absolute top-2 left-2 p-1 bg-green-500 text-white rounded-full">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Images Grid */}
          {images.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Yüklenen Fotoğraflar ({totalImages}/{MAX_IMAGES})
                </h3>
                <div className="text-sm text-gray-500">
                  Sürükleyerek sıralayabilirsiniz
                </div>
              </div>
              
              <div ref={sortableRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    {/* Drag Handle */}
                    <div className="drag-handle absolute top-2 left-2 p-1 bg-black bg-opacity-50 text-white rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    {/* Image Order Badge */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                      {index + 1}
                    </div>
                    
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={image.thumbnail || image.url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteImageMutation.mutate(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      disabled={deleteImageMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
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
              disabled={totalImages === 0}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                totalImages > 0
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