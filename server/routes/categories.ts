import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { insertCategorySchema, updateCategorySchema, insertCustomFieldSchema } from "@shared/schema";
// Middleware functions inline since they're not exported from routes.ts
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.session.userId = req.session.user.id; // Add userId for backward compatibility
  next();
};

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.session.userId = req.session.user.id; // Add userId for backward compatibility
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

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

// Admin only routes below
router.use(requireAuth);
router.use(requireAdmin);

// Create new category (admin only)
router.post("/", async (req, res) => {
  try {
    const validatedData = insertCategorySchema.parse(req.body);
    console.log("Creating category with data:", validatedData);
    
    // Check for duplicate slug within same parent
    const existingCategory = await storage.getCategoryBySlug(validatedData.slug, validatedData.parentId);
    if (existingCategory) {
      return res.status(400).json({ 
        error: "Bu slug aynı üst kategoride zaten kullanılıyor", 
        details: "slug must be unique within same parent category" 
      });
    }
    
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating category:", error);
    console.error("Error details:", error.message);
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
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update category" });
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
    res.status(500).json({ error: error.message || "Failed to move category" });
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
    res.status(500).json({ error: error.message || "Failed to delete category" });
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
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create custom field" });
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