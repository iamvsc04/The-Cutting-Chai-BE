import Branch from "../models/branch.model.js";

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching branches", error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, branchCode, address, printerIP } = req.body;
    const branchExists = await Branch.findOne({ branchCode });
    if (branchExists)
      return res.status(400).json({ message: "Branch already exists" });

    const newBranch = await Branch.create({
      name,
      branchCode,
      address,
      printerIP,
    });
    res.status(201).json(newBranch);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating branch", error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Branch not found" });
    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating branch", error: error.message });
  }
};
