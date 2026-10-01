const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrUpdateReview,
} = require("../controllers/productController");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Private — authenticated users
router.post("/:id/review", isAuthenticated, createOrUpdateReview);

// Admin only
router.post("/", isAuthenticated, authorizeRoles("admin"), createProduct);
router.put("/:id", isAuthenticated, authorizeRoles("admin"), updateProduct);
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), deleteProduct);

module.exports = router;
