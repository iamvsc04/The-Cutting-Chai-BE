import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
  price: Number,
  addons: [{ name: String, price: Number }],
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    branchCode: { type: String, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMode: { type: String, enum: ["cash", "upi"], required: true },
    status: {
      type: String,
      enum: ["ongoing", "completed", "cancelled"],
      default: "ongoing",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
