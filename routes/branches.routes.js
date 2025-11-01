import express from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";
import {
  getAllBranches,
  createBranch,
  updateBranch,
} from "../controllers/branches.controller.js";

const router = express.Router();

router.get("/", authenticate, authorizeAdmin, getAllBranches);
router.post("/", authenticate, authorizeAdmin, createBranch);
router.put("/:id", authenticate, authorizeAdmin, updateBranch);

export default router;
