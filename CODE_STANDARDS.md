# Code Standards & Guidelines

## Overview

This document outlines the professional coding standards and best practices used throughout the Classified Ads Platform. These standards ensure code consistency, maintainability, and professional quality.

## General Principles

### 1. **Professional Development Standards**
- Code should appear as if written by a professional development team
- No obvious AI-generated patterns or comments
- Industry-standard naming conventions and structures
- Comprehensive error handling and user feedback

### 2. **Type Safety First**
- Full TypeScript implementation across all layers
- Strict type checking enabled
- Shared types between frontend and backend
- Runtime validation with Zod schemas

### 3. **Performance Consciousness**
- All features built with performance in mind
- Caching strategies implemented at appropriate layers
- Database operations optimized for scalability
- Frontend optimizations for smooth user experience

## TypeScript Standards

### File Organization
```typescript
// 1. Type imports first
import type { User, Category } from '@shared/schema';

// 2. Library imports
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 3. Local imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 4. Constants and interfaces
interface ComponentProps {
  id: number;
  onSubmit: (data: FormData) => void;
}

// 5. Component implementation
export default function Component({ id, onSubmit }: ComponentProps) {
  // Implementation
}
```

### Type Definitions
```typescript
// Use descriptive interface names
interface CategoryFormData {
  name: string;
  slug: string;
  parentId: number | null;
}

// Prefer interfaces over types for object shapes
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Use type for unions and primitives
type UserRole = 'admin' | 'corporate' | 'individual' | 'authorized_personnel';
type LoadingState = boolean;
```

## React Component Standards

### Component Structure
```typescript
/**
 * Component description and purpose
 * 
 * @param props - Component properties
 * @returns React component
 */
interface ComponentProps {
  // Props definition
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();
  const { data, isLoading } = useQuery();
  
  // 2. Event handlers
  const handleSubmit = (data: FormData) => {
    // Implementation
  };
  
  // 3. Effects and derived state
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 4. Early returns for loading/error states
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // 5. Main render
  return (
    <div className="professional-layout">
      {/* Implementation */}
    </div>
  );
}
```

### Hook Standards
```typescript
/**
 * Custom hook for specific functionality
 * 
 * @param param - Hook parameter
 * @returns Hook return value with consistent naming
 */
export function useCustomHook(param: string) {
  const [data, setData] = useState<DataType>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation
  
  return {
    data,
    isLoading,
    error,
    actions: {
      create,
      update,
      delete: deleteItem
    }
  };
}
```

## Backend Standards

### API Route Structure
```typescript
/**
 * API Route: Category Management
 * 
 * Handles CRUD operations for categories with proper error handling
 * and validation.
 */

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    const category = await storage.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Storage Layer Pattern
```typescript
/**
 * Storage interface method with comprehensive error handling
 */
async createCategory(data: InsertCategory): Promise<Category> {
  try {
    // Validation
    if (!data.name?.trim()) {
      throw new Error('Category name is required');
    }
    
    // Business logic
    const result = await db.insert(categories).values(data).returning();
    
    // Cache invalidation
    cache.delete('categories:all');
    
    return result[0];
  } catch (error) {
    console.error('Failed to create category:', error);
    throw new Error('Category creation failed');
  }
}
```

## Database Standards

### Schema Design
```typescript
// Table definitions with clear naming and types
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  parentId: integer('parent_id').references(() => categories.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Strategic indexes for performance
  parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
  slugIdx: index('categories_slug_idx').on(table.slug),
  activeIdx: index('categories_is_active_idx').on(table.isActive),
}));
```

## Error Handling Standards

### Frontend Error Handling
```typescript
// Comprehensive error handling in components
try {
  const result = await mutation.mutateAsync(data);
  setSuccess('Operation completed successfully');
} catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
  setError(message);
  console.error('Operation failed:', error);
}
```

### Backend Error Handling
```typescript
// Consistent API error responses
try {
  // Operation
} catch (error) {
  console.error('Detailed error for debugging:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    // Don't expose internal details in production
  });
}
```

## Performance Standards

### Caching Implementation
```typescript
// Consistent caching pattern
async getData(id: number): Promise<DataType> {
  const cacheKey = `data:${id}`;
  
  // Try cache first
  const cached = cache.get<DataType>(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const data = await db.query.table.findFirst({
    where: eq(table.id, id)
  });
  
  // Cache the result
  if (data) {
    cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
  }
  
  return data;
}
```

### Query Optimization
```typescript
// Batch operations instead of N+1 queries
const categoryIds = categories.map(cat => cat.id);
const metadata = await db
  .select()
  .from(categoryMetadata)
  .where(inArray(categoryMetadata.categoryId, categoryIds));
```

## UI/UX Standards

### Component Styling
```typescript
// Consistent class naming and responsive design
<div className="bg-white rounded-lg shadow-sm border border-gray-200">
  <div className="p-4 lg:p-6 border-b border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">
      {title}
    </h2>
  </div>
  
  <div className="p-4 lg:p-6 space-y-4">
    {/* Content */}
  </div>
</div>
```

### Form Handling
```typescript
// Professional form implementation
const form = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  defaultValues: initialData
});

const onSubmit = async (data: FormData) => {
  try {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    form.reset();
    onSuccess?.();
  } catch (error) {
    setError(getErrorMessage(error));
  } finally {
    setIsSubmitting(false);
  }
};
```

## Documentation Standards

### Code Comments
```typescript
/**
 * Professional function documentation
 * 
 * Explains the purpose, parameters, and return value clearly.
 * Includes usage examples when helpful.
 * 
 * @param data - The input data to process
 * @param options - Configuration options
 * @returns Processed result with metadata
 * 
 * @example
 * const result = await processData(input, { validate: true });
 */
```

### API Documentation
```typescript
/**
 * POST /api/categories
 * 
 * Creates a new category with validation and slug generation.
 * 
 * Body:
 * - name: string (required) - Category name
 * - parentId: number | null - Parent category ID
 * - description: string - Category description
 * 
 * Returns:
 * - 201: Category created successfully
 * - 400: Validation error
 * - 500: Server error
 */
```

## Testing Standards

### Unit Test Structure
```typescript
describe('CategoryService', () => {
  describe('createCategory', () => {
    it('should create category with valid data', async () => {
      // Arrange
      const validData = { name: 'Test Category', slug: 'test-category' };
      
      // Act
      const result = await categoryService.create(validData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(validData.name);
    });
    
    it('should throw error with invalid data', async () => {
      // Test error cases
    });
  });
});
```

## Security Standards

### Input Validation
```typescript
// Always validate input data
const validationSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'corporate', 'individual'])
});

const validatedData = validationSchema.parse(inputData);
```

### Authentication Checks
```typescript
// Consistent auth middleware usage
router.use('/admin/*', requireAuth, requireAdmin);
router.post('/api/categories', requireAuth, async (req, res) => {
  // Protected endpoint implementation
});
```

These standards ensure that all code maintains professional quality, consistency, and scalability while appearing as if written by an experienced development team.