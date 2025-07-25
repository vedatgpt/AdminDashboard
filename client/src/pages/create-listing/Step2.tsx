import { useListing } from '../../contexts/ListingContext';
import { useCategoryCustomFields } from '../../hooks/useCustomFields';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useStep3Prefetch } from '@/hooks/useStep3Prefetch';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import '../../styles/tiptap.css';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { IOSSpinner } from '../../components/iOSSpinner';
import { useLocationsTree } from '@/hooks/useLocations';
import { useLocationSettings } from '@/hooks/useLocationSettings';
import { useCategoriesTree } from '@/hooks/useCategories';
import { useState, useMemo, useEffect } from 'react';
import type { Location, Category } from '@shared/schema';

export default function Step2() {
  const { state, dispatch } = useListing();
  const { selectedCategory, formData, categoryPath, classifiedId } = state;
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { prefetchStep3Data } = useStep3Prefetch();

  // Input handler 
  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  // TipTap Editor Setup - Tam featured setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#EC7830] underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left'
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Underline,
    ],
    content: formData.customFields.description || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleInputChange('description', html);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4 prose prose-sm max-w-none',
      },
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated]);
  
  // URL parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = state.classifiedId || classifiedId || (classifiedIdParam ? parseInt(classifiedIdParam) : undefined);
  
  // Draft listing hooks - GÜVENLİK KONTROLÜ EKLENDİ + LOADING STATE
  const { data: draftData, error: draftError, isError: isDraftError, isLoading: isDraftLoading } = useDraftListing(currentClassifiedId);
  const updateDraftMutation = useUpdateDraftListing();

  // SECURITY FIX: URL manipülasyonu koruması - İyileştirilmiş Logic
  useEffect(() => {
    if (isDraftError && draftError && currentClassifiedId) {

      
      // 403 Forbidden: Başka kullanıcının draft'ına erişim
      if (draftError.message?.includes('erişim yetkiniz yok')) {

        // Güvenlik ihlali mesajı göster ve Step1'e yönlendir
        navigate('/create-listing/step-1');
      } 
      // 404 Not Found: Hiç var olmayan draft ID
      else if (draftError.message?.includes('bulunamadı')) {

        // Sessizce Step1'e yönlendir (yeni ilan oluşturma akışı)
        navigate('/create-listing/step-1');
      }
      // Diğer hatalar
      else {

        navigate('/create-listing/step-1');
      }
    }
  }, [isDraftError, draftError, currentClassifiedId, navigate]);
  
  // Location selection state
  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Location | null>(null);
  
  // Fetch data
  const { data: locations = [] } = useLocationsTree();
  const { data: locationSettings } = useLocationSettings();
  const { data: allCategories = [] } = useCategoriesTree();
  
  // Build flat categories array for path building
  const flatCategories = useMemo(() => {
    const flatten = (categories: Category[]): Category[] => {
      const result: Category[] = [];
      for (const category of categories) {
        result.push(category);
        if (category.children && category.children.length > 0) {
          result.push(...flatten(category.children));
        }
      }
      return result;
    };
    return flatten(allCategories);
  }, [allCategories]);
  
  // Initialize classifiedId from URL on component mount
  useEffect(() => {
    if (currentClassifiedId && !state.classifiedId) {
      dispatch({ type: 'SET_CLASSIFIED_ID', payload: currentClassifiedId });
      dispatch({ type: 'SET_IS_DRAFT', payload: true });
    }
  }, [currentClassifiedId, state.classifiedId, dispatch]);

  // Load draft data when available and rebuild category path
  useEffect(() => {
    if (draftData && state.classifiedId && allCategories.length > 0) {
      // Load draft data into context
      dispatch({ 
        type: 'LOAD_DRAFT', 
        payload: { 
          classifiedId: state.classifiedId, 
          draft: draftData 
        } 
      });
      
      // Load form data from draft
      if (draftData.customFields) {
        try {
          const customFields = JSON.parse(draftData.customFields);
          dispatch({ type: 'SET_CUSTOM_FIELDS', payload: customFields });
        } catch (error) {
          console.error('Custom fields parse error:', error);
        }
      }
      
      // Rebuild category path from draft categoryId
      if (draftData.categoryId) {
        const buildCategoryPath = (categoryId: number): Category[] => {
          const path: Category[] = [];
          let currentId = categoryId;
          
          while (currentId) {
            const category = flatCategories.find(c => c.id === currentId);
            if (category) {
              path.unshift(category);
              currentId = category.parentId || 0;
            } else {
              break;
            }
          }
          return path;
        };
        
        const category = flatCategories.find(c => c.id === draftData.categoryId);
        const path = buildCategoryPath(draftData.categoryId);
        
        if (category && path.length > 0) {
          dispatch({ 
            type: 'SET_CATEGORY', 
            payload: { category, path } 
          });
        }
      }
      
      // Load location data from draft
      if (draftData.locationData) {
        try {
          const locationData = JSON.parse(draftData.locationData);
          if (locationData.country) setSelectedCountry(locationData.country);
          if (locationData.city) setSelectedCity(locationData.city);
          if (locationData.district) setSelectedDistrict(locationData.district);
          if (locationData.neighborhood) setSelectedNeighborhood(locationData.neighborhood);
        } catch (error) {
          console.error('Location data parse error:', error);
        }
      }
    }
  }, [draftData, state.classifiedId, allCategories, flatCategories, dispatch]);
  
  // Get available locations based on selection
  const availableCountries = useMemo(() => {
    return locations.filter(loc => loc.type === 'country');
  }, [locations]);
  
  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedCountry.id).filter((loc: any) => loc.type === 'city');
  }, [locations, selectedCountry]);
  
  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedCity.id).filter((loc: any) => loc.type === 'district');
  }, [locations, selectedCity]);

  const availableNeighborhoods = useMemo(() => {
    if (!selectedDistrict) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedDistrict.id).filter((loc: any) => loc.type === 'neighborhood');
  }, [locations, selectedDistrict]);
  


  // Ülke görünürlüğü kapalıyken otomatik ilk ülkeyi seç
  useEffect(() => {
    if (locationSettings && !locationSettings.showCountry && availableCountries.length > 0 && !selectedCountry) {
      const defaultCountry = availableCountries[0];
      setSelectedCountry(defaultCountry);
      updateFormData({
        location: {
          country: defaultCountry,
          city: null,
          district: null
        }
      });
    }
  }, [locationSettings, availableCountries, selectedCountry]);
  
  const updateFormData = (newData: any) => {
    dispatch({ type: 'SET_CUSTOM_FIELDS', payload: { ...formData.customFields, ...newData } });
  };
  
  // Test verilerini doldur fonksiyonu
  const fillTestData = () => {
    const testData = {
      // Universal fields
      title: 'Test BMW 3.20d Sedan - Galeriden Temiz',
      description: '<p><strong>Temiz ve bakımlı araç!</strong></p><p>• Motor hacmi: 2000cc</p><p>• Yakıt türü: Dizel</p><p>• Vites: Manuel</p><p>• Renk: Beyaz</p><p>• Kilometre: 125.000km</p><p>• Hasar durumu: Boyasız</p>',
      price: { value: '485000', unit: 'TL' },
      
      // Custom fields with exact API field names
      'Yıl': '2023',
      'Yakıt Tipi': 'Dizel',
      'Vites': 'Manuel',
      'Araç Durumu': 'İkinci El',
      'Kilometre': { value: '125000', unit: 'km' },
      'Kasa Tipi': 'Sedan',
      'Motor Gücü': { value: '190', unit: 'hp' },
      'Motor Hacmi': { value: '2000', unit: 'cc' },
      'Çekiş': 'Önden Çekiş',
      'Direksiyon Yönü': 'Sol',
      'Renk': 'Beyaz',
      'Takaslı': 'Hayır'
    };

    // Form verilerini güncelle
    dispatch({ 
      type: 'SET_CUSTOM_FIELDS', 
      payload: { 
        ...formData.customFields, 
        ...testData 
      } 
    });

    // Lokasyon verilerini de doldur
    if (availableCountries.length > 0) {
      const testCountry = availableCountries[0];
      setSelectedCountry(testCountry);
      
      // İlk şehri seç
      setTimeout(() => {
        const testCity = availableCities.length > 0 ? availableCities[0] : null;
        if (testCity) {
          setSelectedCity(testCity);
        }
      }, 100);
    }


  };

  const nextStep = async () => {
    // Update draft with current form data before navigating
    if (currentClassifiedId) {
      const draftData = {
        title: formData.customFields.title || null,
        description: formData.customFields.description || null,
        price: formData.customFields.price ? JSON.stringify(formData.customFields.price) : null,
        customFields: JSON.stringify(formData.customFields),
        locationData: JSON.stringify({
          country: selectedCountry,
          city: selectedCity,
          district: selectedDistrict,
          neighborhood: selectedNeighborhood,
          location: {
            country: selectedCountry,
            city: selectedCity,
            district: selectedDistrict,
            neighborhood: selectedNeighborhood
          }
        })
      };
      
      // Data saved successfully
      
      try {
        await updateDraftMutation.mutateAsync({
          id: currentClassifiedId,
          data: draftData
        });
        
        // Step3 verilerini prefetch et - Step3'e geçmeden önce
        if (user?.id) {
          prefetchStep3Data(currentClassifiedId, user.id);
        }
      } catch (error) {
        console.error('Draft güncellenemedi:', error);
      }
    }
    
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    const url = currentClassifiedId ? 
      `/create-listing/step-3?classifiedId=${currentClassifiedId}` : 
      '/create-listing/step-3';
    navigate(url);
  };
  // Get categoryId from draft or selected category for custom fields
  const categoryIdForFields = draftData?.categoryId || selectedCategory?.id || 0;

  const { data: customFields = [], isLoading: fieldsLoading } = useCategoryCustomFields(categoryIdForFields);

  // FINAL LOADING CHECK: Auth, Draft VE Fields - HEPSI BİRLİKTE
  if (authLoading || isDraftLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <IOSSpinner />
      </div>
    );
  }

  // Custom fields yoksa da fiyat inputu gösterilmeli

  return (
    <div className="min-h-screen bg-white">

      {/* Main content with dynamic padding based on breadcrumb presence */}
      <div className="lg:pt-6 pt-[64px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-3">
          
         

          {/* Kategori Bilgi Kutusu */}
          <div className="mb-6 lg:mt-0 mt-3">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-md leading-tight">
                    Seçtiğiniz Kategori Bilgileri
                  </h3>
                  {/* Breadcrumb kutunun içinde alt sol kısmında */}
                  <div className="mt-3">
                    {categoryPath && categoryPath.length > 0 && (
                      <BreadcrumbNav 
                        categoryPath={categoryPath}
                        onCategoryClick={() => {}}
                        disableFirstCategory={true}
                      />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/create-listing/step-1')}
                  className="text-orange-500 text-sm font-medium hover:text-orange-600 hover:underline transition-colors"
                >
                  Değiştir
                </button>
              </div>
            </div>
          </div>

   

          {/* İlan Detayları Kutusu */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="w-full">

                <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
                  İlan Detayları
                </h3>

                
        {/* İlan Başlığı Input - Tüm kategoriler için geçerli */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            İlan Başlığı
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={formData.customFields.title || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 64) {
                handleInputChange('title', value);
              }
            }}
            placeholder="İlanınız için başlık yazınız"
            maxLength={64}
            className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        {/* Açıklama Input - Tüm kategoriler için geçerli */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* TipTap Toolbar */}
            <div className="border-b border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-1">
              {/* Format Buttons */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded border ${editor?.isActive('bold') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Bold"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h6.5a3.5 3.5 0 001.545-6.645A3.5 3.5 0 0011.5 3H5zm2 3h4.5a1.5 1.5 0 010 3H7V6zm0 5h5.5a1.5 1.5 0 010 3H7v-3z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded border ${editor?.isActive('italic') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Italic"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.5 3a.5.5 0 00-.5.5V14a.5.5 0 00.5.5h3a.5.5 0 000-1H9.5V4H11a.5.5 0 000-1H8.5z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded border ${editor?.isActive('underline') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 17h12v1H4v-1zm6-1c3.31 0 6-2.69 6-6V4c0-.55-.45-1-1-1s-1 .45-1 1v6c0 2.21-1.79 4-4 4s-4-1.79-4-4V4c0-.55-.45-1-1-1s-1 .45-1 1v6c0 3.31 2.69 6 6 6z"/>
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              {/* List Buttons */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded border ${editor?.isActive('bulletList') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Bullet List"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM7 4h10a1 1 0 010 2H7a1 1 0 010-2zM7 8h10a1 1 0 010 2H7a1 1 0 010-2zM7 12h10a1 1 0 010 2H7a1 1 0 010-2z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded border ${editor?.isActive('orderedList') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Numbered List"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 5h1v1H3V5zM3 7h1v1H3V7zM3 9h1v1H3V9zM3 11h1v1H3v-1zM7 5h10a1 1 0 010 2H7a1 1 0 010-2zM7 9h10a1 1 0 010 2H7a1 1 0 010-2zM7 13h10a1 1 0 010 2H7a1 1 0 010-2z"/>
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              {/* Text Alignment */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded border ${editor?.isActive({ textAlign: 'left' }) ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 8a1 1 0 011-1h9a1 1 0 110 2H3a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 16a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded border ${editor?.isActive({ textAlign: 'center' }) ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM7 16a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded border ${editor?.isActive({ textAlign: 'right' }) ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM8 8a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM11 16a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded border ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Justify"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 8a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 16a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"/>
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              {/* Color Picker */}
              <div className="flex items-center gap-1">
                <label className="text-sm text-gray-600">Color:</label>
                <input
                  type="color"
                  onInput={(e) => editor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  defaultValue="#000000"
                />
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().unsetColor().run()}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              {/* Link Buttons */}
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Link URL giriniz:');
                  if (url) {
                    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                  }
                }}
                className={`p-2 rounded border ${editor?.isActive('link') ? 'bg-[#EC7830] text-white border-[#EC7830]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                title="Add Link"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z"/>
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().unsetLink().run()}
                className="p-2 rounded border bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                title="Remove Link"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15.293 3.293a1 1 0 011.414 1.414L12.414 9l4.293 4.293a1 1 0 01-1.414 1.414L11 10.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 9 5.293 4.707a1 1 0 011.414-1.414L11 7.586l4.293-4.293z"/>
                </svg>
              </button>
            </div>
            
            {/* Editor Content */}
            <div className="min-h-[200px] bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Fiyat Input - Tüm kategoriler için geçerli */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Fiyat
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative lg:w-[30%] w-full">
            <input
              type="text"
              value={(() => {
                const priceValue = formData.customFields.price || '';
                const value = typeof priceValue === 'object' ? priceValue.value || '' : priceValue || '';
                return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
              })()}
              onChange={(e) => {
                let processedValue = e.target.value.replace(/\D/g, '');
                const currentPrice = formData.customFields.price || {};
                const selectedCurrency = typeof currentPrice === 'object' ? currentPrice.unit || 'TL' : 'TL';
                handleInputChange('price', { value: processedValue, unit: selectedCurrency });
              }}
              placeholder="Fiyat giriniz"
              inputMode="numeric"
              className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
            />
            <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
              <select
                value={(() => {
                  const currentPrice = formData.customFields.price || {};
                  return typeof currentPrice === 'object' ? currentPrice.unit || 'TL' : 'TL';
                })()}
                onChange={(e) => {
                  const currentPrice = formData.customFields.price || {};
                  const value = typeof currentPrice === 'object' ? currentPrice.value || '' : currentPrice || '';
                  handleInputChange('price', { value, unit: e.target.value });
                }}
                className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="TL">TL</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {customFields && customFields.length > 0 && (
          <div className="space-y-6">
            {customFields.map((field) => {
            const currentValue = formData.customFields[field.fieldName] || '';
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.fieldType === 'text' && (
                  field.hasUnits && field.unitOptions ? (
                    (() => {
                      const unitOptions = JSON.parse(field.unitOptions || '[]');
                      const selectedUnit = typeof currentValue === 'object' 
                        ? currentValue.unit || field.defaultUnit || unitOptions[0]
                        : field.defaultUnit || unitOptions[0];
                      
                      if (unitOptions.length <= 1) {
                        return (
                          <div className="relative lg:w-[30%] w-full">
                            <input
                              type="text"
                              value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                              onChange={(e) => {
                                handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                              }}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 sm:py-3 px-4 pe-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none z-20 pe-4">
                              <span className="text-gray-500">{selectedUnit}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="relative lg:w-[30%] w-full">
                          <input
                            type="text"
                            value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                            onChange={(e) => {
                              handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                            }}
                            placeholder={field.placeholder || ''}
                            className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                handleInputChange(field.fieldName, { value, unit: e.target.value });
                              }}
                              className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            >
                              {unitOptions.map((unit: string, index: number) => (
                                <option key={index} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="py-3 px-4 block lg:w-[30%] w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  )
                )}

                {field.fieldType === 'number' && (
                  field.hasUnits && field.unitOptions ? (
                    (() => {
                      const unitOptions = JSON.parse(field.unitOptions || '[]');
                      const selectedUnit = typeof currentValue === 'object' 
                        ? currentValue.unit || field.defaultUnit || unitOptions[0]
                        : field.defaultUnit || unitOptions[0];
                      
                      if (unitOptions.length <= 1) {
                        return (
                          <div className="relative lg:w-[30%] w-full">
                            <input
                              type="text"
                              value={(() => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                              })()}
                              onChange={(e) => {
                                let processedValue = e.target.value.replace(/\D/g, '');
                                
                                if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                                  return;
                                }
                                if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                                  return;
                                }
                                
                                handleInputChange(field.fieldName, { value: processedValue, unit: selectedUnit });
                              }}
                              placeholder={field.placeholder || ''}
                              inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                              className="py-2.5 sm:py-3 px-4 pe-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none z-20 pe-4">
                              <span className="text-gray-500">{selectedUnit}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="relative lg:w-[30%] w-full">
                          <input
                            type="text"
                            value={(() => {
                              const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                              return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                            })()}
                            onChange={(e) => {
                              let processedValue = e.target.value.replace(/\D/g, '');
                              
                              if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                                return;
                              }
                              if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                                return;
                              }
                              
                              handleInputChange(field.fieldName, { value: processedValue, unit: selectedUnit });
                            }}
                            placeholder={field.placeholder || ''}
                            inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                            className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                handleInputChange(field.fieldName, { value, unit: e.target.value });
                              }}
                              className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            >
                              {unitOptions.map((unit: string, index: number) => (
                                <option key={index} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      value={(() => {
                        const value = currentValue || '';
                        return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                      })()}
                      onChange={(e) => {
                        let processedValue = e.target.value.replace(/\D/g, '');
                        
                        if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                          return;
                        }
                        if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                          return;
                        }
                        
                        handleInputChange(field.fieldName, processedValue);
                      }}
                      placeholder={field.placeholder || ''}
                      inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                      min={field.minValue || undefined}
                      max={field.maxValue || undefined}
                      className="py-3 px-4 block lg:w-[30%] w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  )
                )}

                {field.fieldType === 'select' && (
                  field.hasUnits && field.unitOptions ? (
                    <div className="relative lg:w-[30%] w-full">
                      <select
                        value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                        onChange={(e) => {
                          const unitOptions = JSON.parse(field.unitOptions || '[]');
                          const selectedUnit = typeof currentValue === 'object' 
                            ? currentValue.unit || field.defaultUnit || unitOptions[0]
                            : field.defaultUnit || unitOptions[0];
                          handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                        }}
                        className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                      >
                        <option value="">{field.placeholder || "Seçiniz"}</option>
                        {field.options && JSON.parse(field.options).map((option: string, index: number) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                        <select
                          value={typeof currentValue === 'object' ? currentValue.unit || field.defaultUnit : field.defaultUnit}
                          onChange={(e) => {
                            const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                            handleInputChange(field.fieldName, { value, unit: e.target.value });
                          }}
                          className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        >
                          {JSON.parse(field.unitOptions || '[]').map((unit: string, index: number) => (
                            <option key={index} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className="py-3 px-4 pe-9 block lg:w-[30%] w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">{field.placeholder || "Seçiniz"}</option>
                      {field.options && JSON.parse(field.options).map((option: string, index: number) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  )
                )}

                {field.fieldType === 'checkbox' && field.options && (
                  <div className="space-y-2">
                    {JSON.parse(field.options).map((option: string, index: number) => {
                      const selectedValues = Array.isArray(currentValue) ? currentValue : [];
                      return (
                        <label key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange(field.fieldName, [...selectedValues, option]);
                              } else {
                                handleInputChange(field.fieldName, selectedValues.filter((v: string) => v !== option));
                              }
                            }}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {field.fieldType === 'boolean' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentValue === true}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                  </label>
                )}
                

                
                {field.fieldType === 'number' && field.minValue !== null && field.maxValue !== null && (
                  <p className="text-sm text-gray-500">
                    {field.minValue} - {field.maxValue} arasında
                  </p>
                )}
              </div>
            );
            })}
          </div>
        )}



              </div>
            </div>
          </div>

          {/* Lokasyon Bilgileri Kutusu */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="w-full">
                <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
                  Adres Bilgileri
                </h3>

                {/* Desktop'ta yan yana, mobile'da alt alta */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

                  {/* Ülke Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showCountry && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ülke
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedCountry?.id || ''}
                        onChange={(e) => {
                          const countryId = parseInt(e.target.value);
                          const country = availableCountries.find(c => c.id === countryId);
                          setSelectedCountry(country || null);
                          setSelectedCity(null);
                          setSelectedDistrict(null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              country: country || null,
                              city: null,
                              district: null,
                              neighborhood: null
                            }
                          });
                        }}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                      >
                        <option value="">Ülke seçiniz</option>
                        {availableCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* İl/Şehir Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showCity && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        İl
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedCity?.id || ''}
                        onChange={(e) => {
                          const cityId = parseInt(e.target.value);
                          const city = availableCities.find(c => c.id === cityId);
                          setSelectedCity(city || null);
                          setSelectedDistrict(null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              country: selectedCountry,
                              city: city || null,
                              district: null,
                              neighborhood: null
                            }
                          });
                        }}
                        disabled={locationSettings?.showCountry ? !selectedCountry : false}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {(locationSettings?.showCountry && !selectedCountry) ? "Önce ülke seçiniz" : "İl seçiniz"}
                        </option>
                        {availableCities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* İlçe Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showDistrict && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        İlçe
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedDistrict?.id || ''}
                        onChange={(e) => {
                          const districtId = parseInt(e.target.value);
                          const district = availableDistricts.find(d => d.id === districtId);
                          setSelectedDistrict(district || null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              country: selectedCountry,
                              city: selectedCity,
                              district: district || null,
                              neighborhood: null
                            }
                          });
                        }}
                        disabled={locationSettings?.showCity ? !selectedCity : false}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {(locationSettings?.showCity && !selectedCity) ? "Önce il seçiniz" : "İlçe seçiniz"}
                        </option>
                        {availableDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mahalle Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showNeighborhood && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mahalle
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedNeighborhood?.id || ''}
                        onChange={(e) => {
                          const neighborhoodId = parseInt(e.target.value);
                          const neighborhood = availableNeighborhoods.find(n => n.id === neighborhoodId);
                          setSelectedNeighborhood(neighborhood || null);
                          updateFormData({
                            location: {
                              country: selectedCountry,
                              city: selectedCity,
                              district: selectedDistrict,
                              neighborhood: neighborhood || null
                            }
                          });
                        }}
                        disabled={locationSettings?.showDistrict ? !selectedDistrict : false}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {(locationSettings?.showDistrict && !selectedDistrict) ? "Önce ilçe seçiniz" : "Mahalle seçiniz"}
                        </option>
                        {availableNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood.id} value={neighborhood.id}>
                            {neighborhood.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* Butonlar - Kutu Dışında */}
          <div className="mb-6 space-y-3">
            {/* Test Verileri Doldur Butonu */}
            <button
              onClick={fillTestData}
              className="w-full bg-gray-500 text-white py-2.5 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              🧪 Tüm Verileri Doldur (Test)
            </button>
            
            {/* Sonraki Adım Butonu */}
            <button
              onClick={nextStep}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Sonraki Adım
            </button>
          </div>
        </div>
        
        {/* Performance indicator */}
        <PageLoadIndicator />
      </div>
    </div>
  );
}