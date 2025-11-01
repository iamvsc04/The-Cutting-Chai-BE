import MenuItem from "../models/menu.model.js";
import Category from "../models/category.model.js";

/**
 * ✅ Get all menu items (populated with category)
 */
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

/**
 * ✅ Create a new menu item
 */
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, category, description, addons = [] } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    // 🔹 Validate that category exists
    const categoryObj = await Category.findById(category);
    if (!categoryObj) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // 🔹 Create the menu item (note: addons lowercase!)
    const newItem = await MenuItem.create({
      name,
      price,
      category: categoryObj._id,
      description,
      addons, // ✅ use correct field name
    });

    // 🔹 Populate category before sending back
    const populated = await newItem.populate("category", "name");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res
      .status(500)
      .json({ message: "Error creating menu item", error: error.message });
  }
};

/**
 * ✅ Update a menu item
 */
export const updateMenuItem = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists)
        return res.status(400).json({ message: "Invalid category ID" });
    }

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price, category, description },
      { new: true, runValidators: true }
    ).populate("category", "name");

    if (!updated)
      return res.status(404).json({ message: "Menu item not found" });

    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating menu item", error: error.message });
  }
};

/**
 * ✅ Delete a menu item
 */
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
