const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ErrorHandler, catchAsync } = require("./errorHandler");

// Protect private routes — verifies JWT from cookie or header
const isAuthenticated = catchAsync(async (req, res, next) => {
  let token;

  // Check cookie first, then Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("User no longer exists", 401));
  }

  next();
});

// Role-based authorization — restrict to specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { isAuthenticated, authorizeRoles };
