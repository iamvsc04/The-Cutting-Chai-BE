import express from "express";
import Order from "../models/order.model.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { generateOrderId } from "../utils/generateOrderId.js";

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (req.user.role === "biller") filter.branchCode = req.user.branchCode;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ----------------- CREATE ORDER -----------------
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { branchCode, items, totalAmount, paymentMode } = req.body;

    if (!branchCode || !items?.length) {
      return res
        .status(400)
        .json({ message: "branchCode and items are required" });
    }

    if (!paymentMode) {
      return res.status(400).json({ message: "paymentMode is required" });
    }

    // Billers can only create orders for their branch
    if (req.user.role === "biller" && req.user.branchCode !== branchCode) {
      return res.status(403).json({ message: "Access denied for this branch" });
    }

    // Normalize items for consistent stock mapping
    const normalizedItems = items.map((i) => ({
      menuItemId: i.menuItemId || i._id, // ensure consistency
      itemName: i.itemName,
      quantity: i.quantity,
      price: i.price,
      addons: i.addons || [],
    }));

    const orderId = await generateOrderId(branchCode);

    const newOrder = await Order.create({
      orderId,
      branchCode,
      items: normalizedItems,
      totalAmount,
      paymentMode,
      createdBy: req.user.id,
    });

    const io = req.app.get("io") || globalThis.__ioRef;
    if (io) {
      io.to(`branch:${branchCode}`).emit("order:created", newOrder);
      io.to("admins").emit("order:created", newOrder);
    }

    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

// ----------------- GET ORDERS (ADMIN / BILLER) -----------------
router.get("/", authenticate, async (req, res, next) => {
  try {
    let orders;

    if (req.user.role === "admin") {
      orders = await Order.find().sort({ createdAt: -1 }).lean();
    } else if (req.user.role === "biller") {
      orders = await Order.find({ branchCode: req.user.branchCode })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ----------------- UPDATE ORDER STATUS -----------------
router.put("/:id/status", authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Billers can only update orders in their branch
    if (
      req.user.role === "biller" &&
      req.user.branchCode !== order.branchCode
    ) {
      return res.status(403).json({ message: "Access denied for this branch" });
    }

    order.status = status;
    if (status === "completed") order.completedAt = new Date();
    await order.save();

    const io = req.app.get("io") || globalThis.__ioRef;
    if (io) {
      io.to(`branch:${order.branchCode}`).emit("order:updated", order);
      io.to("admins").emit("order:updated", order);
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ----------------- GET ORDERS BY DATE -----------------
router.get("/by-date/:date", authenticate, async (req, res, next) => {
  try {
    const { date } = req.params;
    const selectedDate = new Date(date);

    if (isNaN(selectedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Calculate day start and end range
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    let filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (req.user.role === "biller") {
      filter.branchCode = req.user.branchCode;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing", authenticate, async (req, res, next) => {
  try {
    let filter = { status: "ongoing" };

    if (req.user.role === "biller") {
      filter.branchCode = req.user.branchCode;
    }

    const ongoingOrders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(ongoingOrders);
  } catch (err) {
    next(err);
  }
});

export default router;
