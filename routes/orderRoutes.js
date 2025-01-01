import express from "express";
const router = express.Router();

import {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  updateProductStockInOrder,
  calculateProductSales,
  calculateProductAddToCart,
  deleteOrderById,
  calculateSalesByMonthWithPaymentMethod,
} from "../controllers/orderController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

router.route("/").post(createOrder).get(getAllOrders);

router.route("/mine").get(getUserOrders);
router.route("/total-orders").get(countTotalOrders);
router.route("/total-sales").get(calculateTotalSales);
router.route("/total-sales-by-date").get(calcualteTotalSalesByDate);
router
  .route("/total-sales-by-month")
  .get(calculateSalesByMonthWithPaymentMethod);
router.route("/total-sales-by-product").get(calculateProductSales);
router.route("/total-add-to-cart").get(calculateProductAddToCart);
router.route("/:id").get(findOrderById);
router.route("/:id/pay").put(markOrderAsPaid);
router.route("/:id/deliver").put(markOrderAsDelivered);
router.route("/update-stock").post(updateProductStockInOrder);
router.route("/:id").delete(deleteOrderById);

export default router;
