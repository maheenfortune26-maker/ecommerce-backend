const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
} = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Private routes
router.post("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getMe);
router.put("/me/update", isAuthenticated, updateProfile);
router.put("/password/update", isAuthenticated, updatePassword);

module.exports = router;
