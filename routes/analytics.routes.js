import express from "express";
import {
  getSummaryStats,
  getReportByDateRange,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/summary", getSummaryStats);
router.get("/reports", getReportByDateRange);

export default router;
