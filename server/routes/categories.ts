import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { categoryFormSchema, customFieldFormSchema } from "@shared/schema";
import type { Category, InsertCategory, InsertCustomField, InsertFilter } from "@shared/schema";

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.session.userId = req.session.user.id;
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const router = Router();

// Get all categories in tree structure
router.get("/", requireAuth, async (req, res) => {
  try {
    const categories = await storage.getCategoryTree();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Kategoriler alınırken hata oluştu" });
  }
});

// Get single category by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await storage.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }

    // Get custom fields and filters
    const [customFields, filters] = await Promise.all([
      storage.getCategoryCustomFields(id),
      storage.getCategoryFilters(id)
    ]);

    res.json({ ...category, customFields, filters });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Kategori alınırken hata oluştu" });
  }
});

// Create new category (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validatedData = categoryFormSchema.parse(req.body);
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      res.status(400).json({ error: "Geçersiz kategori verisi" });
    } else {
      res.status(500).json({ error: "Kategori oluşturulurken hata oluştu" });
    }
  }
});

// Update category (admin only)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = categoryFormSchema.partial().parse(req.body);
    
    const category = await storage.updateCategory(id, validatedData);
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Kategori güncellenirken hata oluştu" });
  }
});

// Delete category (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteCategory(id);
    res.json({ message: "Kategori başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting category:", error);
    if (error instanceof Error && error.message.includes("alt kategoriler")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Kategori silinirken hata oluştu" });
    }
  }
});

// Custom Fields Routes

// Get custom fields for a category
router.get("/:id/custom-fields", requireAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const customFields = await storage.getCategoryCustomFields(categoryId);
    res.json(customFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    res.status(500).json({ error: "Özel alanlar alınırken hata oluştu" });
  }
});

// Create custom field for a category (admin only)
router.post("/:id/custom-fields", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const validatedData = customFieldFormSchema.parse(req.body);
    
    const customField = await storage.createCustomField({
      ...validatedData,
      categoryId
    });
    
    res.status(201).json(customField);
  } catch (error) {
    console.error("Error creating custom field:", error);
    res.status(500).json({ error: "Özel alan oluşturulurken hata oluştu" });
  }
});

// Update custom field (admin only)
router.patch("/custom-fields/:fieldId", requireAdmin, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    const validatedData = customFieldFormSchema.partial().parse(req.body);
    
    const customField = await storage.updateCustomField(fieldId, validatedData);
    res.json(customField);
  } catch (error) {
    console.error("Error updating custom field:", error);
    res.status(500).json({ error: "Özel alan güncellenirken hata oluştu" });
  }
});

// Delete custom field (admin only)
router.delete("/custom-fields/:fieldId", requireAdmin, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.fieldId);
    await storage.deleteCustomField(fieldId);
    res.json({ message: "Özel alan başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    res.status(500).json({ error: "Özel alan silinirken hata oluştu" });
  }
});

// Filter Routes

// Get filters for a category
router.get("/:id/filters", requireAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const filters = await storage.getCategoryFilters(categoryId);
    res.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: "Filtreler alınırken hata oluştu" });
  }
});

// Create filter for a category (admin only)
router.post("/:id/filters", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const filterData: InsertFilter = {
      ...req.body,
      categoryId
    };
    
    const filter = await storage.createCategoryFilter(filterData);
    res.status(201).json(filter);
  } catch (error) {
    console.error("Error creating filter:", error);
    res.status(500).json({ error: "Filtre oluşturulurken hata oluştu" });
  }
});

// Update filter (admin only)
router.patch("/filters/:filterId", requireAdmin, async (req, res) => {
  try {
    const filterId = parseInt(req.params.filterId);
    const filter = await storage.updateCategoryFilter(filterId, req.body);
    res.json(filter);
  } catch (error) {
    console.error("Error updating filter:", error);
    res.status(500).json({ error: "Filtre güncellenirken hata oluştu" });
  }
});

// Delete filter (admin only)
router.delete("/filters/:filterId", requireAdmin, async (req, res) => {
  try {
    const filterId = parseInt(req.params.filterId);
    await storage.deleteCategoryFilter(filterId);
    res.json({ message: "Filtre başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting filter:", error);
    res.status(500).json({ error: "Filtre silinirken hata oluştu" });
  }
});

export default router;