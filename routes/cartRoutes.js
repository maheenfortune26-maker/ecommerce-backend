const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { isAuthenticated } = require("../middleware/auth");

// All cart routes require authentication
router.use(isAuthenticated);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:productId", updateCartItem);
router.delete("/clear", clearCart);
router.delete("/:productId", removeFromCart);

module.exports = router;
