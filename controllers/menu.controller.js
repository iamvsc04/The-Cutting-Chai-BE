import MenuItem from "../models/menu.model.js";
import Category from "../models/category.model.js";

const normalizeAddons = (rawAddons) => {
  if (!Array.isArray(rawAddons)) return [];
  return rawAddons
    .map((a) => {
      if (!a) return null;
      const name = (a.name || a.title || "").toString().trim();
      const price = a.price === "" || a.price == null ? null : Number(a.price);
      if (!name || price == null || Number.isNaN(price)) return null;
      return { name, price };
    })
    .filter(Boolean);
};

export const getMenu = async (req, res) => {
  try {
    const items = await MenuItem.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, price, category, description, addons } = req.body;

    if (!name || price == null || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    const categoryObj = await Category.findById(category);
    if (!categoryObj) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const normalizedAddons = normalizeAddons(addons);

    const newItem = await MenuItem.create({
      name: name.toString().trim(),
      price: Number(price),
      category: categoryObj._id,
      description: description ? description.toString().trim() : "",
    });

    const populated = await newItem.populate("category", "name");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res
      .status(500)
      .json({ message: "Error creating menu item", error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { name, price, category, description, addons } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists)
        return res.status(400).json({ message: "Invalid category ID" });
    }

    const update = {};
    if (name !== undefined) update.name = name.toString().trim();
    if (price !== undefined && price !== null) update.price = Number(price);
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description.toString();

    if (addons !== undefined) {
      update.addons = normalizeAddons(addons);
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    if (!updated)
      return res.status(404).json({ message: "Menu item not found" });

    res.json(updated);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res
      .status(500)
      .json({ message: "Error updating menu item", error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    await item.deleteOne();
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting menu item", error: error.message });
  }
};
