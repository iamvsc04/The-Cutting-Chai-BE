// backend/utils/printer.utils.js
import net from "net";

/**
 * formatOrderForReceipt(order)
 * Returns a Buffer / string of the printable text. You can convert to ESC/POS bytes here.
 */
export const formatOrderForReceipt = (order) => {
  // Simple plain-text receipt. You can replace with actual ESC/POS commands.
  const lines = [];
  lines.push("THE CUTTING CHAI");
  lines.push(`Order: ${order.orderId}`);
  lines.push(`Branch: ${order.branchCode}`);
  lines.push(`Biller ID: ${order.createdBy || "N/A"}`);
  lines.push("-----------------------------");
  order.items.forEach((it) => {
    const name = it.itemName || it.name || "Item";
    lines.push(`${name} x${it.quantity}  ₹${(it.price || 0).toFixed(2)}`);
    if (it.addons && it.addons.length) {
      lines.push("  + " + it.addons.join(", "));
    }
  });
  lines.push("-----------------------------");
  lines.push(`Total: ₹${(order.totalAmount || 0).toFixed(2)}`);
  lines.push(`Payment: ${order.paymentMode || "N/A"}`);
  lines.push("");
  lines.push("Thank you!");
  lines.push("\n\n\n"); // feed lines for paper cut

  return lines.join("\n");
};

/**
 * printToTcpPrinter({ ip, port }, payload)
 * payload: string or Buffer
 */
export const printToTcpPrinter = ({ ip, port = 9100 }, payload) =>
  new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(5000);
    client.connect(port, ip, () => {
      const data = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(payload, "utf8");
      client.write(data);
      client.end();
    });
    client.on("error", (err) => {
      reject(err);
    });
    client.on("timeout", () => {
      client.destroy();
      reject(new Error("Printer connection timeout"));
    });
    client.on("close", (hadError) => {
      if (hadError) reject(new Error("Printer connection closed with error"));
      else resolve(true);
    });
  });
