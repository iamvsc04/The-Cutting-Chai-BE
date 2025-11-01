import express from "express";
import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";
import Category from "../models/category.model.js"; // ✅ Fix import
import MenuItem from "../models/menu.model.js";

const router = express.Router();

// ✅ Get all categories
router.get("/categories", authenticate, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// ✅ Get products by category
router.get("/category/:id", authenticate, async (req, res) => {
  try {
    const items = await MenuItem.find({ category: req.params.id }).populate(
      "category",
      "name"
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// ✅ Get all menu items (admin view)
router.get("/", authenticate, getMenu);
router.post("/", authenticate, authorizeAdmin, createMenuItem);
router.put("/:id", authenticate, authorizeAdmin, updateMenuItem);
router.delete("/:id", authenticate, authorizeAdmin, deleteMenuItem);

export default router;
