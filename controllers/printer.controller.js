// backend/controllers/printer.controller.js
import {
  formatOrderForReceipt,
  printToTcpPrinter,
} from "../utils/printer.utils.js";
import Order from "../models/order.model.js";
import Branch from "../models/branch.model.js";

/**
 * Print a newly created order
 * If printerIP not provided, fetches from branch configuration
 */
export const printOrder = async (req, res) => {
  try {
    const { orderId, printerIP } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Get printerIP from request or from branch config
    let ip = printerIP;
    if (!ip) {
      const branch = await Branch.findOne({ branchCode: order.branchCode });
      if (!branch || !branch.printerIP) {
        return res.status(400).json({
          message: "Printer IP not configured for this branch",
        });
      }
      ip = branch.printerIP;
    }

    const receiptText = formatOrderForReceipt(order);

    try {
      await printToTcpPrinter({ ip, port: 9100 }, receiptText);
      res.json({ message: "Printed successfully", orderId });
    } catch (printErr) {
      // If printer connection fails, return 202 (Accepted) with warning
      // This allows the order to proceed even if printer is unavailable
      console.warn("Printer connection failed:", printErr.message);
      res.status(202).json({
        message: "Order created but printer unavailable",
        warning: printErr.message,
        orderId,
      });
    }
  } catch (err) {
    console.error("Print error:", err);
    res.status(500).json({ message: "Failed to print", error: err.message });
  }
};

/**
 * Reprint an existing order (same as printOrder, can be called anytime)
 */
export const reprintOrder = async (req, res) => {
  try {
    const { orderId, printerIP } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Get printerIP from request or from branch config
    let ip = printerIP;
    if (!ip) {
      const branch = await Branch.findOne({ branchCode: order.branchCode });
      if (!branch || !branch.printerIP) {
        return res.status(400).json({
          message: "Printer IP not configured for this branch",
        });
      }
      ip = branch.printerIP;
    }

    const receiptText = formatOrderForReceipt(order);

    try {
      await printToTcpPrinter({ ip, port: 9100 }, receiptText);
      res.json({ message: "Reprinted successfully", orderId });
    } catch (printErr) {
      console.warn("Printer connection failed:", printErr.message);
      res.status(202).json({
        message: "Reprint request accepted but printer unavailable",
        warning: printErr.message,
        orderId,
      });
    }
  } catch (err) {
    console.error("Reprint error:", err);
    res.status(500).json({ message: "Failed to reprint", error: err.message });
  }
};
