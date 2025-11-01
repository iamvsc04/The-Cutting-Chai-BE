import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String }, // URL or file path of the category image
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
