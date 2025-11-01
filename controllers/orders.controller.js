import Order from "../models/order.model.js";
import { generateOrderId } from "../utils/generateOrderId.js";

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { branchCode, items, totalAmount, paymentMode } = req.body;

    if (req.user.role === "biller" && req.user.branchCode !== branchCode)
      return res.status(403).json({ message: "Unauthorized branch access" });

    const orderId = await generateOrderId(branchCode);
    const newOrder = await Order.create({
      orderId,
      branchCode,
      items,
      totalAmount,
      paymentMode,
      createdBy: req.user.id,
    });

    const io = req.app.get("io");
    io.to(`branch:${branchCode}`).emit("new-order", newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders for branch or all orders for admin
export const getOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === "admin") {
      orders = await Order.find().sort({ createdAt: -1 });
    } else if (req.user.role === "biller") {
      orders = await Order.find({ branchCode: req.user.branchCode }).sort({
        createdAt: -1,
      });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role === "biller" && req.user.branchCode !== order.branchCode)
      return res.status(403).json({ message: "Unauthorized branch access" });

    order.status = status;
    if (status === "completed") order.completedAt = new Date();
    await order.save();

    const io = req.app.get("io");
    io.to(`branch:${order.branchCode}`).emit("order-updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
