// backend/utils/generateOrderId.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g., "order_<branchCode>_20251019"
    seq: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "counters" }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/**
 * generateOrderId(branchCode)
 * Produces an ID like: BR01-YYYYMMDD-0001
 * Uses a counters collection to ensure atomic increment per day+branch.
 */
export const generateOrderId = async (branchCode = "BR") => {
  const now = new Date();
  const yy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateKey = `${yy}${mm}${dd}`;

  // counter key scope per branch per day
  const counterId = `order_${branchCode}_${dateKey}`;

  const updated = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  ).lean();

  const seq = String(updated.seq).padStart(4, "0"); // 4-digit sequence
  const orderId = `${branchCode}-${dateKey}-${seq}`;
  return orderId;
};
