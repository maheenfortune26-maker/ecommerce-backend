const Product = require("../models/Product");
const { ErrorHandler, catchAsync } = require("../middleware/errorHandler");

// @route   GET /api/v1/products
// @access  Public — supports search, filter, pagination
const getAllProducts = catchAsync(async (req, res, next) => {
  const resultsPerPage = Number(req.query.limit) || 8;
  const page = Number(req.query.page) || 1;
  const skip = resultsPerPage * (page - 1);

  // Build query object
  let queryObj = {};

  // Search by keyword (regex — case insensitive)
  if (req.query.keyword) {
    queryObj.name = { $regex: req.query.keyword, $options: "i" };
  }

  // Filter by category
  if (req.query.category) {
    queryObj.category = req.query.category;
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  // Filter by minimum rating
  if (req.query.rating) {
    queryObj.ratings = { $gte: Number(req.query.rating) };
  }

  const totalProducts = await Product.countDocuments(queryObj);
  const products = await Product.find(queryObj)
    .skip(skip)
    .limit(resultsPerPage)
    .populate("createdBy", "name");

  res.status(200).json({
    success: true,
    totalProducts,
    resultsPerPage,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / resultsPerPage),
    products,
  });
});

// @route   GET /api/v1/products/:id
// @access  Public
const getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "createdBy",
    "name"
  );
  if (!product) return next(new ErrorHandler("Product not found", 404));
  res.status(200).json({ success: true, product });
});

// @route   POST /api/v1/products
// @access  Private (admin only)
const createProduct = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, message: "Product created", product });
});

// @route   PUT /api/v1/products/:id
// @access  Private (admin only)
const updateProduct = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, message: "Product updated", product });
});

// @route   DELETE /api/v1/products/:id
// @access  Private (admin only)
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  await product.deleteOne();
  res.status(200).json({ success: true, message: "Product deleted" });
});

// @route   POST /api/v1/products/:id/review
// @access  Private
const createOrUpdateReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  const existingReview = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
  } else {
    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    product.numOfReviews = product.reviews.length;
  }

  // Recalculate average rating
  product.ratings =
    product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();
  res.status(200).json({ success: true, message: "Review submitted" });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrUpdateReview,
};
