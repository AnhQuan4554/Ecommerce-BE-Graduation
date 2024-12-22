import { response } from "express";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Utility Function
function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const taxRate = 0.15;
  const taxPrice = (itemsPrice * taxRate).toFixed(2);

  const totalPrice = (
    itemsPrice +
    shippingPrice +
    parseFloat(taxPrice)
  ).toFixed(2);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice,
    totalPrice,
  };
}

const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, userId } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
    }
    const itemsFromDB = await Product.find({
      _id: { $in: orderItems.map((x) => x._id) },
    });

    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
      );
      if (!matchingItemFromDB) {
        res.status(404);
        throw new Error(`Product not found: ${itemFromClient._id}`);
      }
      return {
        ...itemFromClient,
        product: itemFromClient._id,
        price: matchingItemFromDB.price,
        _id: undefined,
      };
    });

    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calcPrices(dbOrderItems);

    const order = new Order({
      orderItems: dbOrderItems,
      user: userId,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id username");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await Order.find({ user: userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Total order
const countTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    res.json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateTotalSales = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, order) => {
      if (order.isPaid) {
        return sum + order.totalPrice;
      } else {
        return sum;
      }
    }, 0);
    res.json({ totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calcualteTotalSalesByDate = async (req, res) => {
  try {
    const salesByDate = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(salesByDate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "username email"
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update status payment for order
const markOrderAsPaid = async (req, res) => {
  try {
    console.log("req.params.id", req.params.id);
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();

      const updateOrder = await order.save();
      res.status(200).json({
        status: "success",
        data: updateOrder,
      });
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update status delivery for order
const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const statusDelivery = req.body.statusDelivery;
    if (order) {
      order.isDelivered = statusDelivery;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProductStockInOrder = async (req, res) => {
  try {
    const { productId, qty } = req.body;

    const product = await Product.findById(productId);

    product.countInStock -= qty;

    await product.save();

    res.json({ message: "Product stock updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateProductSales = async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true });
    const productSales = {};

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const productName = item.name;
        if (productSales[productName]) {
          productSales[productName] += item.qty;
        } else {
          productSales[productName] = item.qty;
        }
      });
    });

    return res.status(200).json(productSales);
  } catch (error) {
    console.error("Error calculating product sales:", error);
    res.status(500).json({ error: error.message });
  }
};

const calculateProductAddToCart = async (req, res) => {
  try {
    const orders = await Order.find();
    const productsAddedToCartRatio = {};

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const productName = item.name;
        if (productsAddedToCartRatio[productName]) {
          productsAddedToCartRatio[productName]++;
        } else {
          productsAddedToCartRatio[productName] = 1;
        }
      });
    });

    res.json(productsAddedToCartRatio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ status: "success" });
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
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
};
