import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface PhotoUploadAreaProps {
  onFileSelect: (files: FileList | null) => void;
  maxImages: number;
  currentImageCount: number;
}

export default function PhotoUploadArea({ onFileSelect, maxImages, currentImageCount }: PhotoUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const files = e.dataTransfer.files;
    onFileSelect(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  };

  const isDisabled = currentImageCount >= maxImages;

  return (
    <div className="mb-6 lg:mt-0 mt-3">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="w-full">
          <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
            Fotoğraf ({currentImageCount}/{maxImages})
          </h3>
          
          <div 
            className={`cursor-pointer p-12 flex justify-center border border-dashed rounded-xl transition-colors ${
              isDisabled 
                ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                : dragActive 
                  ? 'bg-orange-50 border-orange-400' 
                  : 'bg-white border-gray-300 hover:border-orange-400'
            }`}
            onClick={isDisabled ? undefined : handleClick}
            onDragOver={isDisabled ? undefined : handleDragOver}
            onDragLeave={isDisabled ? undefined : handleDragLeave}
            onDrop={isDisabled ? undefined : handleDrop}
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
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_969"></feBlend>
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_969" result="shape"></feBlend>
                    </filter>
                  </defs>
                </svg>
              </span>
              
              <div className="mt-4">
                {isDisabled ? (
                  <p className="text-gray-500">Maksimum fotoğraf sayısına ulaştınız</p>
                ) : (
                  <>
                    <p className="text-gray-800 font-medium">
                      <Upload className="inline w-4 h-4 mr-1" />
                      Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, JPEG - Maksimum 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}