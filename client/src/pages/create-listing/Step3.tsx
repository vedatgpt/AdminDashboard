import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { useDraftListing } from '@/hooks/useDraftListing';
import CreateListingLayout from '@/components/CreateListingLayout';
import PhotoUploadArea from '@/components/PhotoUploadArea';
import PhotoGrid from '@/components/PhotoGrid';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

const MAX_IMAGES = 20;

export default function Step3() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // URL parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = classifiedIdParam ? parseInt(classifiedIdParam) : undefined;
  
  console.log('Step3 yüklendi - currentClassifiedId:', currentClassifiedId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load existing photos from draft
  const { data: draftData } = useDraftListing(currentClassifiedId);
  
  // Photo upload hook
  const { 
    images, 
    setImages, 
    handleFileSelect, 
    deleteImage, 
    rotateImage 
  } = usePhotoUpload(currentClassifiedId);

  // Load photos from draft data when available
  useEffect(() => {
    if (draftData?.photos && images.length === 0) {
      try {
        const existingPhotos = JSON.parse(draftData.photos as string);
        if (Array.isArray(existingPhotos) && existingPhotos.length > 0) {
          setImages(existingPhotos);
        }
      } catch (error) {
        console.error('Error parsing draft photos:', error);
      }
    }
  }, [draftData, images.length, setImages]);

  // Navigation handlers
  const handleGoToNextStep = () => {
    navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`);
  };

  const handleGoToPreviousStep = () => {
    navigate(`/create-listing/step-2?classifiedId=${currentClassifiedId}`);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Yükleniyor...</div>;
  }

  return (
    <CreateListingLayout stepNumber={3}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Photo Upload Area */}
        <PhotoUploadArea 
          onFileSelect={handleFileSelect}
          maxImages={MAX_IMAGES}
          currentImageCount={images.length}
        />

        {/* Photo Grid */}
        <PhotoGrid 
          images={images}
          onImagesReorder={setImages}
          onDeleteImage={deleteImage}
          onRotateImage={rotateImage}
          currentClassifiedId={currentClassifiedId}
        />

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleGoToPreviousStep}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Önceki Adım
          </button>
          
          <button
            onClick={handleGoToNextStep}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sonraki Adım
          </button>
        </div>
        
        {/* Performance indicator */}
        <PageLoadIndicator />
      </div>
    </CreateListingLayout>
  );
}