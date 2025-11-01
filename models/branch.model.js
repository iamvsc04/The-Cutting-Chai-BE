import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branchCode: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    printerIP: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Branch", branchSchema);
