import express from "express";
import formidable from "express-formidable";
const router = express.Router();

// controllers
import {
  addProduct,
  updateProductDetails,
  removeProduct,
  fetchProducts,
  fetchProductById,
  fetchAllProducts,
  addProductReview,
  fetchTopProducts,
  fetchNewProducts,
  filterProducts,
  getProductsByBrand,
  updateStockAndSales,
  fetchFilteredProducts,
} from "../controllers/productController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import checkId from "../middlewares/checkId.js";

router.route("/").get(fetchProducts).post(formidable(), addProduct);
// .post(authenticate, authorizeAdmin, formidable(), addProduct);

router.route("/allproducts").get(fetchAllProducts);
router.route("/filter-product").post(fetchFilteredProducts);
router.route("/reviews").post(addProductReview);

router.get("/top", fetchTopProducts);

router.get("/new", fetchNewProducts);

router
  .route("/:id")
  .get(fetchProductById)
  // .put(authenticate, authorizeAdmin, formidable(), updateProductDetails)
  .put(formidable(), updateProductDetails)

  // .delete(authenticate, authorizeAdmin, removeProduct);
  .delete(removeProduct);
router.route("/:id/is-buy").put(updateStockAndSales);
router.route("/delete").delete(removeProduct);

router.route("/filtered-products").post(filterProducts);
router.post("/brand", getProductsByBrand);

export default router;
