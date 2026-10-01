const User = require("../models/User");
const Product = require("../models/Product");
const { ErrorHandler, catchAsync } = require("../middleware/errorHandler");

// @route   GET /api/v1/cart
// @access  Private
const getCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate(
    "cart.product",
    "name price stock images"
  );

  const cartItems = user.cart.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    stock: item.product.stock,
    image: item.product.images[0]?.url || "",
    quantity: item.quantity,
    subtotal: item.product.price * item.quantity,
  }));

  const totalPrice = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  res.status(200).json({
    success: true,
    cartItems,
    totalItems: cartItems.length,
    totalPrice,
  });
});

// @route   POST /api/v1/cart
// @access  Private
const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (product.stock < 1) {
    return next(new ErrorHandler("Product is out of stock", 400));
  }

  const user = await User.findById(req.user._id);
  const existingItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    // Cap quantity at stock level
    const newQty = existingItem.quantity + quantity;
    existingItem.quantity = Math.min(newQty, product.stock);
  } else {
    user.cart.push({ product: productId, quantity: Math.min(quantity, product.stock) });
  }

  await user.save();
  res.status(200).json({ success: true, message: "Item added to cart" });
});

// @route   PUT /api/v1/cart/:productId
// @access  Private
const updateCartItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const user = await User.findById(req.user._id);

  const item = user.cart.find(
    (item) => item.product.toString() === req.params.productId
  );
  if (!item) return next(new ErrorHandler("Item not in cart", 404));

  const product = await Product.findById(req.params.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  // Enforce stock cap
  item.quantity = Math.min(Math.max(1, quantity), product.stock);
  await user.save();

  res.status(200).json({ success: true, message: "Cart updated" });
});

// @route   DELETE /api/v1/cart/:productId
// @access  Private
const removeFromCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter(
    (item) => item.product.toString() !== req.params.productId
  );
  await user.save();
  res.status(200).json({ success: true, message: "Item removed from cart" });
});

// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { cart: [] });
  res.status(200).json({ success: true, message: "Cart cleared" });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
