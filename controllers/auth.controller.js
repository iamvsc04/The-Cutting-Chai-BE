// backend/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "cuttingchai_secret_key";

// ✅ Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "8h" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchCode: user.branchCode,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ✅ Create user (admin action) — supports role "admin" or "biller"
export const createUser = async (req, res) => {
  try {
    const { name, email, password, branchCode, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "Missing required fields" });

    if (!["admin", "biller"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    if (role === "biller" && !branchCode)
      return res
        .status(400)
        .json({ message: "Biller must be assigned a branchCode" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    // Let the model handle password hashing
    const newUser = await User.create({
      name,
      email,
      password,
      branchCode: branchCode || null,
      role,
    });

    res.status(201).json({
      message: `${role} created successfully`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        branchCode: newUser.branchCode,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

// ✅ Get all users (Admin only)
export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// ✅ Update user (admin can change role/branch/name/email; password optional)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, branchCode, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If changing role to biller, enforce branchCode presence
    if (role === "biller" && !branchCode) {
      return res
        .status(400)
        .json({ message: "Biller must be assigned a branchCode" });
    }

    // If changing email, check uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ message: "Email already in use" });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.branchCode = branchCode ?? user.branchCode;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({
      message: "User updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchCode: user.branchCode,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

// ✅ Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // prevent self-delete? optional - currently allow admins to delete any user including other admins.
    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};
