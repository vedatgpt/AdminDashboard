import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { insertCategorySchema, updateCategorySchema, insertCustomFieldSchema } from "@shared/schema";
// Middleware functions inline since they're not exported from routes.ts
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Configure multer for icon uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'category-icons');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed'));
    }
  }
});

// Get all categories in tree structure (public endpoint)
router.get("/", async (req, res) => {
  try {
    const categories = await storage.getCategoriesTree();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories tree:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get categories by parent ID with pagination (public endpoint)
router.get("/paginated", async (req, res) => {
  try {
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : null;
    const categories = await storage.getChildCategories(parentId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching paginated categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get category breadcrumbs (public endpoint)
router.get("/:id/breadcrumbs", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const breadcrumbs = await storage.getCategoryBreadcrumbs(id);
    res.json(breadcrumbs);
  } catch (error) {
    console.error("Error fetching category breadcrumbs:", error);
    res.status(500).json({ error: "Failed to fetch breadcrumbs" });
  }
});

// Get packages for category (public endpoint - BEFORE auth middleware)
router.get("/:categoryId/packages", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    // Get packages for this category and inherited packages from parent categories
    const categoryPackages = await storage.getCategoryPackagesWithInheritance(categoryId);
    res.json(categoryPackages);
  } catch (error: any) {
    console.error("Error getting category packages:", error);
    res.status(500).json({ error: "Kategori paketleri alınamadı" });
  }
});

// Get single category by ID (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await storage.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Get custom fields for this category
    const customFields = await storage.getCategoryCustomFields(id);
    
    res.json({
      ...category,
      customFields
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// GET /api/categories/:id/children - Get child categories (public endpoint for prefetch)
router.get('/:id/children', async (req, res) => {
  try {
    const parentId = parseInt(req.params.id);
    if (isNaN(parentId)) {
      return res.status(400).json({ error: 'Invalid parent ID' });
    }

    const children = await storage.getChildCategories(parentId);
    res.json(children);
  } catch (error) {
    console.error('Get child categories error:', error);
    res.status(500).json({ error: 'Failed to get child categories' });
  }
});

// GET /api/categories/:id/custom-fields - Get custom fields for a category (public endpoint)
router.get('/:id/custom-fields', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Use inheritance to get custom fields from parent categories if none exist for this category
    const customFields = await storage.getCategoryCustomFieldsWithInheritance(categoryId);
    res.json(customFields);
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ error: 'Failed to get custom fields' });
  }
});

// Custom Fields Routes (admin only)

// POST /api/categories/:id/custom-fields - Create custom field for a category
router.post('/:id/custom-fields', requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const validation = insertCustomFieldSchema.safeParse({ ...req.body, categoryId });
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      });
    }

    const customField = await storage.createCustomField(validation.data);
    res.status(201).json(customField);
  } catch (error) {
    console.error('Create custom field error:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create custom field";
    res.status(500).json({ error: errorMessage });
  }
});

// PATCH /api/categories/custom-fields/:fieldId - Update custom field
router.patch('/custom-fields/:fieldId', requireAdmin, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    if (isNaN(fieldId)) {
      return res.status(400).json({ error: 'Invalid field ID' });
    }

    const validation = insertCustomFieldSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      });
    }

    const updatedField = await storage.updateCustomField(fieldId, validation.data);
    res.json(updatedField);
  } catch (error) {
    console.error('Update custom field error:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update custom field";
    res.status(500).json({ error: errorMessage });
  }
});

// DELETE /api/categories/custom-fields/:fieldId - Delete custom field
router.delete('/custom-fields/:fieldId', requireAdmin, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    if (isNaN(fieldId)) {
      return res.status(400).json({ error: 'Invalid field ID' });
    }

    await storage.deleteCustomField(fieldId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete custom field error:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete custom field";
    res.status(500).json({ error: errorMessage });
  }
});

// Reorder categories (admin only) - MUST BE BEFORE router.use middleware
router.patch("/reorder", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { parentId, categoryIds } = req.body;
    
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: "categoryIds must be an array" });
    }
    
    // Validate that all category IDs are valid integers
    const validCategoryIds = categoryIds.filter(id => 
      typeof id === 'number' && Number.isInteger(id) && id > 0
    );
    
    if (validCategoryIds.length !== categoryIds.length) {
      return res.status(400).json({ error: "All category IDs must be valid positive integers" });
    }
    
    // Update sort order for all categories in the list
    for (let i = 0; i < validCategoryIds.length; i++) {
      const categoryId = validCategoryIds[i];
      await storage.updateCategory(categoryId, { sortOrder: i + 1 });
    }
    
    res.json({ message: "Categories reordered successfully" });
  } catch (error) {

    res.status(500).json({ error: "Failed to reorder categories" });
  }
});

// Admin only routes below
router.use(requireAuth);
router.use(requireAdmin);

// Create new category (admin only)
router.post("/", async (req, res) => {
  try {
    const validatedData = insertCategorySchema.parse(req.body);

    
    // Check for duplicate slug within same parent
    const existingCategory = await storage.getCategoryBySlug(validatedData.slug, validatedData.parentId ?? null);
    if (existingCategory) {
      return res.status(400).json({ 
        error: "Bu slug aynı üst kategoride zaten kullanılıyor", 
        details: "slug must be unique within same parent category" 
      });
    }
    
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  } catch (error: any) {

    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create category", details: error.message });
  }
});

// Update category (admin only)
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = updateCategorySchema.parse(req.body);
    const category = await storage.updateCategory(id, validatedData);
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: (error as any).errors });
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to update category", details: errorMessage });
  }
});

// Move category to new parent (admin only)
router.patch("/:id/move", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { newParentId } = req.body;
    
    const category = await storage.moveCategoryToParent(id, newParentId);
    res.json(category);
  } catch (error) {
    console.error("Error moving category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to move category";
    res.status(500).json({ error: errorMessage });
  }
});



// Delete category (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete category";
    res.status(500).json({ error: errorMessage });
  }
});

// Create new category package (admin only)
router.post("/:categoryId/packages", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    const insertData = { ...req.body, categoryId };
    const { insertCategoryPackageSchema } = await import("@shared/schema");
    const validatedData = insertCategoryPackageSchema.parse(insertData);
    const categoryPackage = await storage.createCategoryPackage(validatedData);
    res.status(201).json(categoryPackage);
  } catch (error: any) {
    console.error("Error creating category package:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
    }
    res.status(500).json({ error: "Kategori paketi oluşturulamadı" });
  }
});

// Custom Fields routes

// Get custom fields for category
router.get("/:id/custom-fields", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const customFields = await storage.getCategoryCustomFields(categoryId);
    res.json(customFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    res.status(500).json({ error: "Failed to fetch custom fields" });
  }
});

// Create custom field for category (admin only)
router.post("/:id/custom-fields", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const validatedData = insertCustomFieldSchema.parse({
      ...req.body,
      categoryId
    });
    
    const customField = await storage.createCustomField(validatedData);
    res.status(201).json(customField);
  } catch (error) {
    console.error("Error creating custom field:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: (error as any).errors });
    }
    const errorMessage = error instanceof Error ? error.message : "Failed to create custom field";
    res.status(500).json({ error: errorMessage });
  }
});

// Update custom field (admin only)
router.patch("/custom-fields/:fieldId", async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    const updates = req.body;
    
    const customField = await storage.updateCustomField(fieldId, updates);
    res.json(customField);
  } catch (error) {
    console.error("Error updating custom field:", error);
    res.status(500).json({ error: "Failed to update custom field" });
  }
});

// Delete custom field (admin only)
router.delete("/custom-fields/:fieldId", async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    await storage.deleteCustomField(fieldId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting custom field:", error);
    res.status(500).json({ error: "Failed to delete custom field" });
  }
});

// Upload category icon
router.post("/upload-icon", requireAdmin, upload.single('icon'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    res.json({ 
      success: true, 
      filename: req.file.filename,
      path: `/uploads/category-icons/${req.file.filename}`
    });
  } catch (error) {
    console.error("Icon upload error:", error);
    res.status(500).json({ error: "Failed to upload icon" });
  }
});

export default router;