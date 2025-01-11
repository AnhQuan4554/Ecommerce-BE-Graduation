import asyncHandler from "../middlewares/asyncHandler.js";
import Product from "../models/productModel.js";

const addProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, category, quantity, brand } = req.fields;

    // Validation
    switch (true) {
      case !name:
        return res.json({ error: "Bạn cần điền tên sản phẩm" });
      case !brand:
        return res.json({ error: "Bạn cần chọn hãng sản phẩm" });
      case !description:
        return res.json({ error: "Bạn cần điền mô tả sản phẩm" });
      case !price:
        return res.json({ error: "Bạn cần điền giá cho sản phẩm" });
      case !category:
        return res.json({ error: "Bạn cần chọn loại sản phẩm" });
      case !quantity:
        return res.json({ error: "Bạn cần điền số lượng" });
    }
    const imageArray = req.fields.image
      .split(",")
      .map((img) => img.trim().replace(/\\/g, "/"));

    const product = new Product({
      ...req.fields,
      image: [...imageArray],
      options: JSON.parse(req.fields?.options).map((option) => ({
        name: option.name,
        price: parseFloat(option.price),
      })),
    });
    await product.save();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

const updateProductDetails = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, category, quantity, brand } = req.fields;
    // Validation
    switch (true) {
      case !name:
        return res.json({ error: "Name is required" });
      case !brand:
        return res.json({ error: "Brand is required" });
      case !description:
        return res.json({ error: "Description is required" });
      case !price:
        return res.json({ error: "Price is required" });
      case !category:
        return res.json({ error: "Category is required" });
      case !quantity:
        return res.json({ error: "Quantity is required" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.fields },
      { new: true }
    );

    await product.save();

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});
const updateStockAndSales = asyncHandler(async (req, res) => {
  try {
    const { countInStock, quantitySold } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...(countInStock !== undefined && { countInStock }),
        ...(quantitySold !== undefined && { quantitySold }),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

const removeProduct = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty list of IDs" });
    }

    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.json({
      message: `${result.deletedCount} product(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const fetchProducts = asyncHandler(async (req, res) => {
  try {
    const pageSize = 6;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword }).limit(pageSize);

    res.json({
      products,
      page: 1,
      pages: Math.ceil(count / pageSize),
      hasMore: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const fetchProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      return res.json(product);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Product not found" });
  }
});

const fetchAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .sort({ createAt: -1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});
const fetchFilteredProducts = asyncHandler(async (req, res) => {
  try {
    const { name, brand, category, priceStart, priceEnd, typeProduct } =
      req.query;
    let filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (brand && Number(brand) > 0) {
      filter.brand = brand;
    }

    if (category) {
      filter.category = category;
    }

    if (priceStart && priceEnd && priceEnd > 0) {
      filter.price = { $gte: Number(priceStart), $lte: Number(priceEnd) };
    }

    if (typeProduct && typeProduct > 0) {
      if (typeProduct == 1) {
        const brandArray = ["1", "2", "3", "4", "5", "6"];
        filter.brand = { $in: brandArray }; // Đặt lại giá trị brand
      } else if (typeProduct == 2) {
        const brandArray = ["7", "8", "9", "10", "11", "12", "13"];
        filter.brand = { $in: brandArray }; // Đặt lại giá trị brand
      }
    }

    const products = await Product.find(filter).sort({ createAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const addProductReview = asyncHandler(async (req, res) => {
  try {
    const { rating, comment, productId, userName, userId } = req.body;
    const product = await Product.findById(productId);

    if (product) {
      // const alreadyReviewed = product.reviews.find(
      //   (r) => r.user.toString() === req.user._id.toString()
      // );

      // if (alreadyReviewed) {
      //   res.status(400);
      //   throw new Error("Product already reviewed");
      // }

      const review = {
        name: userName,
        rating: Number(rating),
        comment,
        user: userId,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        Math.round(
          (product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length) *
            2
        ) / 2;

      await product.save();
      res.status(201).json({ message: "Review added", status: "success" });
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

const fetchTopProducts = asyncHandler(async (req, res) => {
  try {
    const { typeProduct, limitProduct } = req.query;
    let query = {};
    if (typeProduct) {
      let brandArray = [];
      // Nếu brand tồn tại, tạo điều kiện query với $in
      // Đảm bảo brand là mảng
      if (typeProduct == 0) {
        // phone
        brandArray = ["1", "2", "3", "4", "5", "6"];
      } else if (typeProduct == 1) {
        brandArray = ["7", "8", "9", "10", "11", "12", "13"];
      }
      query.brand = { $in: brandArray };
    } else {
    }
    const products = await Product.find(query)
      .sort({ rating: -1, quantitySold: -1 })
      .limit(Number(limitProduct) || 5);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

const fetchNewProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).limit(5);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

const filterProducts = asyncHandler(async (req, res) => {
  try {
    const { checked, radio } = req.body;

    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await Product.find(args);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const getProductsByBrand = asyncHandler(async (req, res) => {
  try {
    const { brand } = req.body;

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    const products = await Product.find({ brand });
    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for this brand" });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export {
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
};
