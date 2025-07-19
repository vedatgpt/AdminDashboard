import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { insertCategorySchema } from "@shared/schema";
import { requireAdmin } from "../../middleware/auth";

const router = Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET /api/admin/categories - Get categories by parent
router.get("/", async (req, res) => {
  try {
    const { parent } = req.query;
    const parentId = parent === "0" || parent === undefined ? undefined : Number(parent);
    
    const categories = await storage.getCategories(parentId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Kategoriler alınırken bir hata oluştu" });
  }
});

// GET /api/admin/categories/:id - Get category by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const category = await storage.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Kategori alınırken bir hata oluştu" });
  }
});

// GET /api/admin/categories/:id/path - Get category path (breadcrumbs)
router.get("/:id/path", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const path = await storage.getCategoryPath(id);
    res.json(path);
  } catch (error) {
    console.error("Error fetching category path:", error);
    res.status(500).json({ error: "Kategori yolu alınırken bir hata oluştu" });
  }
});

// POST /api/admin/categories - Create new category
router.post("/", async (req, res) => {
  try {
    const validatedData = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Kategori oluşturulurken bir hata oluştu" });
  }
});

// PATCH /api/admin/categories/:id - Update category
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validatedData = insertCategorySchema.partial().parse(req.body);
    
    const category = await storage.updateCategory(id, validatedData);
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
    }
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Kategori güncellenirken bir hata oluştu" });
  }
});

// DELETE /api/admin/categories/:id - Delete category
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if category has subcategories
    const subcategories = await storage.getCategories(id);
    if (subcategories.length > 0) {
      return res.status(400).json({ 
        error: "Bu kategori silinemez", 
        message: "Önce alt kategorileri silmelisiniz" 
      });
    }
    
    await storage.deleteCategory(id);
    res.json({ message: "Kategori başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Kategori silinirken bir hata oluştu" });
  }
});

export default router;