import express from "express";
import User from "../models/user.model.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register initial admin (one-time, only if no admin exists)
router.post("/reg/04", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if any admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res
        .status(403)
        .json({
          message:
            "Admin already exists. Use admin login to create additional users.",
        });
    }

    // Check if email is already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const admin = await User.create({ name, email, password, role: "admin" });
    res
      .status(201)
      .json({ message: "Admin registered successfully", adminId: admin._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create biller credentials (admin only)
router.post(
  "/create-biller",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { name, email, password, branchCode } = req.body;

      // Validate required fields
      if (!name || !email || !password || !branchCode) {
        return res
          .status(400)
          .json({
            message: "Name, email, password, and branchCode are required",
          });
      }

      // Check if email already exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const biller = await User.create({
        name,
        email,
        password,
        role: "biller",
        branchCode,
      });

      res.status(201).json({
        message: "Biller created successfully",
        billerId: biller._id,
        email: biller.email,
        branchCode: biller.branchCode,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
