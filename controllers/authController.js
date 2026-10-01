const User = require("../models/User");
const { ErrorHandler, catchAsync } = require("../middleware/errorHandler");

// Helper: generate token and set cookie
const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents XSS — JS can't read this cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @route   POST /api/v1/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  const user = await User.create({ name, email, password });
  sendToken(user, 201, res, "Registration successful");
});

// @route   POST /api/v1/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  // select: false on password field — must explicitly select it
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res, "Login successful");
});

// @route   POST /api/v1/auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// @route   GET /api/v1/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

// @route   PUT /api/v1/auth/me/update
// @access  Private
const updateProfile = catchAsync(async (req, res, next) => {
  const updates = { name: req.body.name, email: req.body.email };
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, user });
});

// @route   PUT /api/v1/auth/password/update
// @access  Private
const updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res, "Password updated successfully");
});

module.exports = { register, login, logout, getMe, updateProfile, updatePassword };
