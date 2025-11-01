// backend/controllers/analytics.controller.js
import Order from "../models/order.model.js";

export const getSummaryStats = async (req, res) => {
  try {
    const now = new Date();

    // --- Start of day/week/month ---
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = now.getDay(); // Sunday=0
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // make week start Monday
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Helper to aggregate revenue since a date ---
    const calcRevenue = async (fromDate) => {
      const agg = await Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: fromDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      return agg[0]?.total || 0;
    };

    const [today, week, month, totalOrders] = await Promise.all([
      calcRevenue(startOfToday),
      calcRevenue(startOfWeek),
      calcRevenue(startOfMonth),
      Order.countDocuments(),
    ]);

    return res.json({
      today,
      week,
      month,
      totalOrders,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};
export const getReportByDateRange = async (req, res) => {

  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Aggregate revenue and order data
    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "ready", "served"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const summary = result[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
    };

    // Fetch detailed orders for this range
    const orders = await Order.find({
      status: { $in: ["completed", "ready", "served"] },
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    return res.json({ summary, orders });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ message: "Error generating report" });
  }
};
