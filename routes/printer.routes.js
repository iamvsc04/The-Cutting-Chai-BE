import express from "express";
import { printOrder, reprintOrder } from "../controllers/printer.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/print", authenticate, printOrder);
router.post("/reprint", authenticate, reprintOrder);

export default router;
