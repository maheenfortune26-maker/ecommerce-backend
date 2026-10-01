const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

// All routes require authentication
router.use(isAuthenticated);

// User routes
router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);

// Admin routes
router.get("/admin/all", authorizeRoles("admin"), getAllOrders);
router.put("/admin/:id", authorizeRoles("admin"), updateOrderStatus);
router.delete("/admin/:id", authorizeRoles("admin"), deleteOrder);

module.exports = router;
