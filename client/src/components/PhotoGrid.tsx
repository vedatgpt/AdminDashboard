import React, { useEffect, useRef } from 'react';
import { GripVertical, X, RotateCw } from 'lucide-react';
import Sortable from 'sortablejs';

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

interface PhotoGridProps {
  images: UploadedImage[];
  onImagesReorder: (newImages: UploadedImage[]) => void;
  onDeleteImage: (imageId: string) => void;
  onRotateImage: (imageId: string) => void;
  currentClassifiedId?: number;
}

export default function PhotoGrid({ 
  images, 
  onImagesReorder, 
  onDeleteImage, 
  onRotateImage,
  currentClassifiedId 
}: PhotoGridProps) {
  const sortableRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Initialize Sortable.js
  useEffect(() => {
    if (!sortableRef.current || images.filter(img => !img.uploading).length === 0) return;

    const sortable = new Sortable(sortableRef.current, {
      animation: 150,
      ghostClass: 'opacity-50',
      chosenClass: 'ring-2 ring-orange-500',
      handle: '.drag-handle',
      filter: '.uploading-item',
      preventOnFilter: false,
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          evt.preventDefault?.();
          
          const newImages = [...images];
          const [removed] = newImages.splice(evt.oldIndex!, 1);
          newImages.splice(evt.newIndex!, 0, removed);
          
          // Update order numbers
          const updatedImages = newImages.map((img, index) => ({
            ...img,
            order: index + 1
          }));
          
          onImagesReorder(updatedImages);
          
          // Save to draft asynchronously
          if (currentClassifiedId) {
            const xhr = new XMLHttpRequest();
            xhr.open('PATCH', `/api/draft-listings/${currentClassifiedId}`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onload = () => {
              if (xhr.status === 200) {
                console.log('✅ Photo order saved');
              } else {
                console.error('❌ Failed to save photo order');
              }
            };
            
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
        }
      }
    });

    return () => {
      try {
        sortable.destroy();
      } catch (error) {
        // Sortable already destroyed, ignore error
      }
    };
  }, [images.filter(img => !img.uploading).length, currentClassifiedId, onImagesReorder]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Yüklenen Fotoğraflar ({images.length})
      </h4>
      
      <div 
        ref={sortableRef}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${
              image.uploading ? 'uploading-item' : ''
            }`}
          >
            {/* Order Badge */}
            <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-75 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {image.order || index + 1}
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              {!image.uploading && (
                <>
                  <button
                    onClick={() => onRotateImage(image.id)}
                    className="p-1 bg-gray-800 bg-opacity-75 text-white rounded hover:bg-opacity-90 transition-colors"
                    title="Döndür"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteImage(image.id)}
                    className="p-1 bg-red-600 bg-opacity-75 text-white rounded hover:bg-opacity-90 transition-colors"
                    title="Sil"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            
            {/* Drag Handle */}
            {!image.uploading && (
              <div className="drag-handle absolute bottom-2 right-2 z-10 p-1 bg-gray-800 bg-opacity-75 text-white rounded cursor-move hover:bg-opacity-90 transition-colors">
                <GripVertical className="w-3 h-3" />
              </div>
            )}
            
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
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-xs">
                      {Math.round(image.progress || 0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* File Info */}
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
  );
}