import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface UploadedImage {
  id: string;
  filename: string;
  url: string;
  thumbnail?: string;
  size: number;
  originalSize: number;
}

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Step3() {
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setImages(prev => [...prev, ...data.images]);
      setUploading(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploading(false);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/upload/images/${imageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      return response.json();
    },
    onSuccess: (_, imageId) => {
      setImages(prev => prev.filter(img => img.id !== imageId));
    }
  });

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

    if (images.length + validFiles.length > MAX_IMAGES) {
      alert(`En fazla ${MAX_IMAGES} resim yükleyebilirsiniz`);
      return;
    }

    if (validFiles.length > 0) {
      setUploading(true);
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      uploadMutation.mutate(fileList.files);
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
              {uploading ? (
                <div className="space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600">Fotoğraflar yükleniyor...</p>
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

          {/* Image Grid */}
          {images.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Yüklenen Fotoğraflar ({images.length}/{MAX_IMAGES})
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.thumbnail || image.url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteImageMutation.mutate(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={deleteImageMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* Image Info */}
                    <div className="mt-2 text-xs text-gray-500">
                      <div>{formatFileSize(image.size)}</div>
                      {image.originalSize > image.size && (
                        <div className="text-green-600">
                          ↓ {Math.round((1 - image.size / image.originalSize) * 100)}% küçültüldü
                        </div>
                      )}
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
              disabled={images.length === 0}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                images.length > 0
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