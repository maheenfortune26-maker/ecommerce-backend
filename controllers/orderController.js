const Order = require("../models/Order");
const Product = require("../models/Product");
const { ErrorHandler, catchAsync } = require("../middleware/errorHandler");

// @route   POST /api/v1/orders
// @access  Private
const createOrder = catchAsync(async (req, res, next) => {
  const { orderItems, shippingInfo, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorHandler("No order items provided", 400));
  }

  // Verify stock availability for each item
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    if (product.stock < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for: ${product.name}`, 400));
    }
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingInfo,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  res.status(201).json({ success: true, message: "Order placed successfully", order });
});

// @route   GET /api/v1/orders/my
// @access  Private
const getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "orderItems.product",
    "name images"
  );
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name images");

  if (!order) return next(new ErrorHandler("Order not found", 404));

  // Users can only see their own orders; admins can see all
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new ErrorHandler("Not authorized to view this order", 403));
  }

  res.status(200).json({ success: true, order });
});

// @route   GET /api/v1/admin/orders
// @access  Private (admin)
const getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate("user", "name email");
  const totalAmount = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  res.status(200).json({ success: true, count: orders.length, totalAmount, orders });
});

// @route   PUT /api/v1/admin/orders/:id
// @access  Private (admin) — update status & reduce stock when shipped
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  if (order.orderStatus === "delivered") {
    return next(new ErrorHandler("Order has already been delivered", 400));
  }

  // Reduce stock when order is marked as shipped
  if (req.body.status === "shipped") {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save({ validateBeforeSave: false });
      }
    }
  }

  if (req.body.status === "delivered") {
    order.deliveredAt = Date.now();
  }

  order.orderStatus = req.body.status;
  await order.save();

  res.status(200).json({ success: true, message: "Order status updated", order });
});

// @route   DELETE /api/v1/admin/orders/:id
// @access  Private (admin)
const deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));
  await order.deleteOne();
  res.status(200).json({ success: true, message: "Order deleted" });
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, deleteOrder };
