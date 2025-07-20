import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Category } from '@shared/schema';

// Listing state interface
export interface ListingState {
  currentStep: number;
  selectedCategory: Category | null;
  categoryPath: Category[];
  formData: {
    // Step 2: Custom fields data
    customFields: Record<string, any>;
    // Step 3: Location and contact
    title: string;
    description: string;
    price: string;
    city: string;
    district: string;
    // Step 4: Images
    images: File[];
    // Future steps will be added here
  };
}

// Action types
type ListingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CATEGORY'; payload: { category: Category; path: Category[] } }
  | { type: 'SET_CATEGORY_WITH_PATH'; payload: { category: Category | null; path: Category[] } }
  | { type: 'SET_CUSTOM_FIELDS'; payload: Record<string, any> }
  | { type: 'RESET_LISTING' };

// Initial state
const initialState: ListingState = {
  currentStep: 1,
  selectedCategory: null,
  categoryPath: [],
  formData: {
    customFields: {},
    title: '',
    description: '',
    price: '',
    city: '',
    district: '',
    images: [],
  },
};

// Reducer
function listingReducer(state: ListingState, action: ListingAction): ListingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload.category,
        categoryPath: action.payload.path,
      };
    case 'SET_CATEGORY_WITH_PATH':
      return {
        ...state,
        selectedCategory: action.payload.category,
        categoryPath: action.payload.path,
      };
    case 'SET_CUSTOM_FIELDS':
      return {
        ...state,
        formData: { ...state.formData, customFields: action.payload },
      };
    case 'RESET_LISTING':
      return initialState;
    default:
      return state;
  }
}

// Context
const ListingContext = createContext<{
  state: ListingState;
  dispatch: React.Dispatch<ListingAction>;
} | null>(null);

// Provider component
export function ListingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(listingReducer, initialState);

  return (
    <ListingContext.Provider value={{ state, dispatch }}>
      {children}
    </ListingContext.Provider>
  );
}

// Hook to use the context
export function useListing() {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListing must be used within a ListingProvider');
  }
  return context;
}