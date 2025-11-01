// backend/routes/auth.routes.js
import express from "express";
import {
  login,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/auth.controller.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/login", login);

// ✅ Admin-only: manage users
router.post("/users", authenticate, authorizeAdmin, createUser);
router.get("/users", authenticate, authorizeAdmin, getAllUsers);
router.put("/users/:id", authenticate, authorizeAdmin, updateUser);
router.delete("/users/:id", authenticate, authorizeAdmin, deleteUser);

// ✅ Optional legacy route for older frontend (auto-sets role=biller)
router.post(
  "/create-biller",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      req.body.role = "biller";
      return createUser(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
