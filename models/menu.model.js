import mongoose from "mongoose";

const addonSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
    addons: [addonSchema],
    image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
