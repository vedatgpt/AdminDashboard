import { Router } from "express";
import { storage } from "../storage";
import { insertCategoryPackageSchema, updateCategoryPackageSchema } from "@shared/schema";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/category-packages/:categoryId - Get all category packages for a category
router.get("/:categoryId", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    const packages = await storage.getCategoryPackages(categoryId);
    res.json(packages);
  } catch (error) {
    console.error("Error fetching category packages:", error);
    res.status(500).json({ error: "Kategori paketleri getirilirken bir hata oluştu" });
  }
});

// GET /api/category-packages/package/:id - Get specific category package by ID
router.get("/package/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz paket ID" });
    }

    const categoryPackage = await storage.getCategoryPackageById(id);
    if (!categoryPackage) {
      return res.status(404).json({ error: "Kategori paketi bulunamadı" });
    }

    res.json(categoryPackage);
  } catch (error) {
    console.error("Error fetching category package:", error);
    res.status(500).json({ error: "Kategori paketi getirilirken bir hata oluştu" });
  }
});

// POST /api/category-packages/:categoryId - Create new category package
router.post("/:categoryId", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    const validatedData = insertCategoryPackageSchema.parse({
      ...req.body,
      categoryId
    });

    const categoryPackage = await storage.createCategoryPackage(validatedData);
    res.status(201).json(categoryPackage);
  } catch (error) {
    console.error("Error creating category package:", error);
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({ error: "Girilen veriler geçersiz", details: error.issues });
    }
    res.status(500).json({ error: "Kategori paketi oluşturulurken bir hata oluştu" });
  }
});

// PATCH /api/category-packages/package/:id - Update category package
router.patch("/package/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz paket ID" });
    }

    const validatedData = updateCategoryPackageSchema.parse(req.body);
    const categoryPackage = await storage.updateCategoryPackage(id, validatedData);
    res.json(categoryPackage);
  } catch (error) {
    console.error("Error updating category package:", error);
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({ error: "Girilen veriler geçersiz", details: error.issues });
    }
    res.status(500).json({ error: "Kategori paketi güncellenirken bir hata oluştu" });
  }
});

// DELETE /api/category-packages/package/:id - Delete category package
router.delete("/package/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz paket ID" });
    }

    await storage.deleteCategoryPackage(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category package:", error);
    res.status(500).json({ error: "Kategori paketi silinirken bir hata oluştu" });
  }
});

// PATCH /api/category-packages/:categoryId/reorder - Reorder category packages
router.patch("/:categoryId/reorder", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    const { packageIds } = req.body;
    if (!Array.isArray(packageIds) || packageIds.some((id: any) => typeof id !== "number")) {
      return res.status(400).json({ error: "Geçersiz paket ID listesi" });
    }

    await storage.reorderCategoryPackages(categoryId, packageIds);
    res.status(204).send();
  } catch (error) {
    console.error("Error reordering category packages:", error);
    res.status(500).json({ error: "Kategori paketleri yeniden sıralanırken bir hata oluştu" });
  }
});

export default router;