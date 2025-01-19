import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import { Sku } from "../models/skuModel.js";
import TempOrder from "../models/tempOrderModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { sendEmail } from "../utils/senEmail.js";
import Stripe from "stripe";
import paypal from "paypal-rest-sdk";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });
paypal.configure({
  mode: "live",
  client_id: process.env.PAYPAL_CLINET_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

const newOdrer = asyncHandler(async (req, res, next) => {
  let skus = req.body.orders;
  if (skus.lenght < 0) {
    return next(new ErrorHandler("Plz Add Products To Cart", 400));
  }

  let skussToFind = skus.map((item) => item._id);
  let findedSkus = await Sku.find({
    _id: { $in: skussToFind }, // Fetch documents where _id is in the cart array
  });

  const fetchProductById = async (productId) => {
    // Replace this with your database query logic
    const product = await Product.findById(productId).select(
      "name brand catagory shippingFee"
    ); // Fetch only the required fields
    console.log(product);

    return product;
  };
  const mergeArrays = async (array1, array2, fetchProductById) => {
    try {
      if (!Array.isArray(array1) || !Array.isArray(array2)) {
        return next(
          new ErrorHandler(
            "Must be an array. Try clearing the cart and try again.",
            401
          )
        );
      }

      // Create a map for quick lookup
      const quantityMap = new Map(
        array2.map((item) => [item._id, item.quantity])
      );

      // Merge arrays and handle missing data
      const mergedArray = await Promise.all(
        array1
          .filter((item) => {
            if (!item._id) {
              console.error("Missing '_id' in an item from array1:", item);
              return false;
            }
            return quantityMap.has(item._id.toString());
          })
          .map(async (item) => {
            const quantity = quantityMap.get(item._id.toString());
            if (quantity === undefined || quantity === 0 || !quantity) {
              return next(
                new ErrorHandler(
                  "Quantity not found. Try clearing the cart and try again.",
                  401
                )
              );
            }

            // Fetch product details for this SKU's productId
            const product = await fetchProductById(item.productId);

            if (!product) {
              return next(
                new ErrorHandler(
                  `Product not found for ID Clear the cart and try again: ${item.productId}`,
                  404
                )
              );
            }

            return {
              productId: item.productId.toString(), // Ensure productId is a string
              price: item.priceAfterDiscount,
              image: item.image?.url || null, // Handle missing image URLs
              quantity,
              skuId: item._id.toString(), // SKU ID
              name: product.name, // Add name from product data
              brand: product.brand, // Add brand from product data
              catagory: product.catagory, // Add category from product data
              shipping: Number(product.shippingFee) || 0,
              skuPhrase: item.skuId,
            };
          })
      );

      return mergedArray;
    } catch (error) {
      console.error("Error in mergeArrays function:", error.message);
      throw error; // Rethrow the error for further handling
    }
  };

  let itemsForCart = await mergeArrays(findedSkus, skus, fetchProductById);

  console.log(itemsForCart);

  let itemsPrice = 0;
  let shippingPrice = 0;
  itemsForCart.map((item) => {
    itemsPrice += item.price * item.quantity;
    shippingPrice += item.shipping * item.quantity;
  });
  console.log(shippingPrice);

  let shippingInfo = req.body.shippingData;
  let user = req.user._id;
  let paymentInfo = {
    status: "pending",
    method: "cod",
  };
  let taxPrice = (itemsPrice / 100) * process.env.TAX_PRICE;
  //let shippingPrice=process.env.SHIPPING_PRICE;
  //let totalPrice=itemsPrice+taxPrice+process.env.SHIPPING_PRICE;
  let orderStatus = "pending";

  let createdOrde = await Order.create({
    shippingInfo,
    orderItems: itemsForCart,
    user,
    paymentInfo,
    orderStatus,
    itemsPrice,
    shippingPrice,
    taxPrice,
  });
  if (!createdOrde) {
    return next(
      new ErrorHandler("Internal server Error Somthing went wrong", 500)
    );
  }
  

  console.log(createdOrde);

  return res.status(200).json({
    success: true,
    message: "Order Placed Successfully",
  });
});

let stripePaymentCard = asyncHandler(async (req, res, next) => {
  let skus = req.body.orders;
  console.log(skus);
  
  if (skus.length < 0) {
    return next(new ErrorHandler("Plz Add Products To Cart", 400));
  }

  let skussToFind = skus.map((item) => item._id);
  let findedSkus = await Sku.find({
    _id: { $in: skussToFind }, // Fetch documents where _id is in the cart array
  });

  const fetchProductById = async (productId) => {
    // Replace this with your database query logic
    const product = await Product.findById(productId).select(
      "name brand catagory shippingFee"
    ); // Fetch only the required fields
    return product;
  };
  const mergeArrays = async (array1, array2, fetchProductById) => {
    try {
      if (!Array.isArray(array1) || !Array.isArray(array2)) {
        return next(
          new ErrorHandler(
            "Must be an array. Try clearing the cart and try again.",
            401
          )
        );
      }

      // Create a map for quick lookup
      const quantityMap = new Map(
        array2.map((item) => [item._id, item.quantity])
      );

      // Merge arrays and handle missing data
      const mergedArray = await Promise.all(
        array1
          .filter((item) => {
            if (!item._id) {
              console.error("Missing '_id' in an item from array1:", item);
              return false;
            }
            return quantityMap.has(item._id.toString());
          })
          .map(async (item) => {
            const quantity = quantityMap.get(item._id.toString());
            if (quantity === undefined || quantity === 0 || !quantity) {
              return next(
                new ErrorHandler(
                  "Quantity not found. Try clearing the cart and try again.",
                  401
                )
              );
            }

            // Fetch product details for this SKU's productId
            const product = await fetchProductById(item.productId);

            if (!product) {
              return next(
                new ErrorHandler(
                  `Product not found for ID: ${item.productId}`,
                  404
                )
              );
            }

            return {
              productId: item.productId.toString(), // Ensure productId is a string
              price: item.priceAfterDiscount,
              image: item.image?.url || null, // Handle missing image URLs
              quantity,
              skuId: item._id.toString(), // SKU ID
              name: product.name, // Add name from product data
              brand: product.brand, // Add brand from product data
              catagory: product.catagory, // Add category from product data
              shipping: product.shippingFee || 0,
              skuPhrase: item.skuId,
            };
          })
      );

      return mergedArray;
    } catch (error) {
      console.error("Error in mergeArrays function:", error.message);
      throw error; // Rethrow the error for further handling
    }
  };

  let itemsForCart = await mergeArrays(findedSkus, skus, fetchProductById);
  let shippingPrice = 0;
  let itemsPrice = 0;
  itemsForCart.map((item) => {
    itemsPrice += item.price * item.quantity;
    shippingPrice += item.shipping * item.quantity;
  });
  console.log(shippingPrice);

  let shippingInfo = req.body.shippingData;
  let user = req.user._id;
  let paymentInfo = {
    status: "pending",
    method: "cod",
  };
  let taxPrice = (itemsPrice / 100) * process.env.TAX_PRICE;
  //let shippingPrice=process.env.SHIPPING_PRICE;
  //let totalPrice=itemsPrice+taxPrice+process.env.SHIPPING_PRICE;
  let orderStatus = "pending";
  let createdOrde = await TempOrder.create({
    shippingInfo,
    orderItems: itemsForCart,
    user,
    paymentInfo,
    orderStatus,
    itemsPrice,
    shippingPrice,
    taxPrice,
  });

  if (!createdOrde) {
    return next(new ErrorHandler("Error Internal Server", 500));
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let line_items = itemsForCart.map((item) => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: `${item.name} ${item.skuPhrase}`,
        images: [item.image],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  line_items.push({
    price_data: {
      currency: "gbp",
      product_data: { name: `Shipping Charges` },
      unit_amount: Math.round(shippingPrice * 100),
    },
    quantity: 1,
  });
  //const customer = await stripe.customers.create();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"], // Add as many as supported
    line_items: line_items,
    /*payment_method_options: {
      customer_balance: {
        bank_transfer: {
          type: "gb_bank_transfer",
        },
        funding_type: "bank_transfer",
      },
    },*/
    mode: "payment",
    //customer: customer.id,
    metadata: {
      id: createdOrde._id.toString(),
    },
    success_url: `${process.env.FRONT_URL_PRODUCTION}/success`,
    cancel_url: `${process.env.FRONT_URL_PRODUCTION}/cancel`,
  });

  return res.status(200).json({
    success: true,
    id: session.id,
  });
});

const webhook = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set your endpoint secret
  console.log(endpointSecret);

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify the event with the Stripe library
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event types you care about
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const sessionMetadata = session.metadata;
      //console.log('Checkout session completed:', session);
      console.log("Metadata:", sessionMetadata);

      // Retrieve the payment intent for additional details if required
      const paymentIntentId = session.payment_intent;
      console.log("Payment Intent ID:", paymentIntentId);

      let order = await TempOrder.findById(sessionMetadata.id)
        .select("-orderItems._id -_id -paymentInfo")
        .lean();
      console.log(order);
      let paymenInfo = {
        status: "paid",
        method: "stripe",
      };
      let createdOrde = await Order.create({
        ...order,
        paymentInfo: paymenInfo,
      });
      console.log("this is created order", createdOrde);
      await TempOrder.findByIdAndDelete(sessionMetadata.id);
      break;
    // Add more cases for other event types you want to handle
    default:
      const sessio = event.data.object;
      let id = sessio.metadata;
      await TempOrder.findByIdAndDelete(id.id);
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send("Received!");
});

const paypalPayments = asyncHandler(async (req, res, next) => {
  console.log("working");
  console.log(req.body.orders);
  
  let skus = req.body.orders;
  if (skus.length < 0) {
    return next(new ErrorHandler("Plz Add Products To Cart", 400));
  }

  let skussToFind = skus.map((item) => item._id);
  let findedSkus = await Sku.find({
    _id: { $in: skussToFind }, // Fetch documents where _id is in the cart array
  });

  const fetchProductById = async (productId) => {
    // Replace this with your database query logic
    const product = await Product.findById(productId).select(
      "name brand catagory shippingFee"
    ); // Fetch only the required fields
    return product;
  };
  const mergeArrays = async (array1, array2, fetchProductById) => {
    try {
      if (!Array.isArray(array1) || !Array.isArray(array2)) {
        return next(
          new ErrorHandler(
            "Must be an array. Try clearing the cart and try again.",
            401
          )
        );
      }

      // Create a map for quick lookup
      const quantityMap = new Map(
        array2.map((item) => [item._id, item.quantity])
      );

      // Merge arrays and handle missing data
      const mergedArray = await Promise.all(
        array1
          .filter((item) => {
            if (!item._id) {
              console.error("Missing '_id' in an item from array1:", item);
              return false;
            }
            return quantityMap.has(item._id.toString());
          })
          .map(async (item) => {
            const quantity = quantityMap.get(item._id.toString());
            if (quantity === undefined || quantity === 0 || !quantity) {
              return next(
                new ErrorHandler(
                  "Quantity not found. Try clearing the cart and try again.",
                  401
                )
              );
            }

            // Fetch product details for this SKU's productId
            const product = await fetchProductById(item.productId);

            if (!product) {
              return next(
                new ErrorHandler(
                  `Product not found for ID: ${item.productId}`,
                  404
                )
              );
            }

            return {
              productId: item.productId.toString(), // Ensure productId is a string
              price: item.priceAfterDiscount,
              image: item.image?.url || null, // Handle missing image URLs
              quantity,
              skuId: item._id.toString(), // SKU ID
              name: product.name, // Add name from product data
              brand: product.brand, // Add brand from product data
              catagory: product.catagory, // Add category from product data
              shipping: product.shippingFee || 0,
              skuPhrase: item.skuId,
            };
          })
      );

      return mergedArray;
    } catch (error) {
      console.error("Error in mergeArrays function:", error.message);
      throw error; // Rethrow the error for further handling
    }
  };

  let itemsForCart = await mergeArrays(findedSkus, skus, fetchProductById);
  let shippingPrice = 0;
  let itemsPrice = 0;
  itemsForCart.map((item) => {
    itemsPrice += item.price * item.quantity;
    shippingPrice += item.shipping * item.quantity;
  });
  console.log(shippingPrice);

  let shippingInfo = req.body.shippingData;
  let user = req.user._id;
  let paymentInfo = {
    status: "pending",
    method: "cod",
  };
  let taxPrice = (itemsPrice / 100) * process.env.TAX_PRICE;
  //let shippingPrice=process.env.SHIPPING_PRICE;
  //let totalPrice=itemsPrice+taxPrice+process.env.SHIPPING_PRICE;
  let orderStatus = "pending";
  let createdOrde = await TempOrder.create({
    shippingInfo,
    orderItems: itemsForCart,
    user,
    paymentInfo,
    orderStatus,
    itemsPrice,
    shippingPrice,
    taxPrice,
  });

  if (!createdOrde) {
    return next(new ErrorHandler("Error Internal Server", 500));
  }
  let line_items = itemsForCart.map((item) => ({
    currency: "GBP",
    name: `${item.name} ${item.skuPhrase}`,
    sku: `${item.skuPhrase}`,
    price: `${item.price}`,
    quantity: item.quantity,
  }));

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: `https://eaglesessiorsbackend-production.up.railway.app/api/v1/success?orderId=${createdOrde._id}`, // Use env for base URL
      cancel_url: `https://eaglesessiorsbackend-production.up.railway.app/api/v1/failed`,
    },
    transactions: [
      {
        item_list: {
          items:line_items
        },
        amount: {
          currency: "GBP",
          total: `${itemsPrice+shippingPrice}`,
          details: {
            subtotal: `${itemsPrice}`, // Total of all item prices
            shipping: `${shippingPrice}`,  // Shipping fee
          },
        },
        description: "This is Eagle scissors payment.",
      },
    ],
  };

  try {
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) return reject(error);
        resolve(payment);
      });
    });

    console.log(payment);
    res.json(payment); // Return payment data to client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment creation failed", error });
  }
});

const successPaypal = asyncHandler(async (req, res, next) => {
  const { PayerID: payerId, paymentId } = req.query;

  const execute_payment_json = {
    payer_id: payerId
  };

  try {
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        (error, payment) => {
          if (error) return reject(error);
          resolve(payment);
        }
      );
    });
    
    const amount = payment.transactions[0].amount.total;
    let order=await TempOrder.findById(req.query.orderId).select("-orderItems._id -_id -paymentInfo").lean();
    console.log(order);
    if (order.totalPrice===Number(amount)) {
      let paymenInfo = {
        status: "paid",
        method: "paypal",
      };
      let createdOrde = await Order.create({
        ...order,
        paymentInfo: paymenInfo,
      });
      console.log("this is created order", createdOrde);
      await TempOrder.findByIdAndDelete(req.query.orderId);
    }
    // Redirect to success page
    res.redirect(`${process.env.FRONT_URL_PRODUCTION}/success`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONT_URL_PRODUCTION}/cancel`);
  }
});

const failedPaypal = asyncHandler(async (req, res, next) => {
  res.redirect(`${process.env.FRONT_URL_PRODUCTION}/cancel`);
});
const getAllOrders = asyncHandler(async (req, res, next) => {
  let orders = await Order.find().sort({ createdAt: -1 });
  /*const ordersWithProducts = await Order.aggregate([
    {
      $unwind: "$orderItems" // Unwind the orderItems array
    },
    {
      $lookup: {
        from: "products", // Replace with your actual products collection name
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    {
      $unwind: "$productDetails" // Unwind the productDetails array
    },
    {
      $project: {
        shippingInfo: 1,
        user: 1,
        paymentInfo: 1,
        itemsPrice: 1,
        taxPrice: 1,
        shippingPrice: 1,
        totalPrice: 1,
        orderStatus: 1,
        createdAt: 1,
        __v: 1,
        "orderItems.price": 1,
        "orderItems.quantity": 1,
        "orderItems.image": 1,
        "orderItems.productId": 1,
        "orderItems.skuId": 1,
        "orderItems._id": 1,
        "orderItems.productDetails.name": "$productDetails.name", // Only include name
        "orderItems.productDetails.catagory": "$productDetails.catagory", // Only include category
        "orderItems.productDetails.barnd": "$productDetails.brand" // Only include category
      }
    },
    {
      $group: {
        _id: "$_id", // Group back to original order structure
        shippingInfo: { $first: "$shippingInfo" },
        user: { $first: "$user" },
        paymentInfo: { $first: "$paymentInfo" },
        itemsPrice: { $first: "$itemsPrice" },
        taxPrice: { $first: "$taxPrice" },
        shippingPrice: { $first: "$shippingPrice" },
        totalPrice: { $first: "$totalPrice" },
        orderStatus: { $first: "$orderStatus" },
        createdAt: { $first: "$createdAt" },
        __v: { $first: "$__v" },
        orderItems: {
          $push: {
            price: "$orderItems.price",
            quantity: "$orderItems.quantity",
            image: "$orderItems.image",
            productId: "$orderItems.productId",
            skuId: "$orderItems.skuId",
            _id: "$orderItems._id",
            productDetails: "$orderItems.productDetails"
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 } // Sort by createdAt in descending order (newest first)
    }
  ]);*/
  return res.status(200).json({
    success: true,
    orders: orders,
  });
});

const changeOrderStatus = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.body.id);
  if (!order) {
    return next(new ErrorHandler("Order not found!", 400));
  }
  if (order.orderStatus === "canceled") {
    return next(new ErrorHandler("Order is canceled earlier", 400));
  }
  if (order.orderStatus === "deliverd") {
    return next(new ErrorHandler("Order is already deliverd", 400));
  }
  let status = "";
  if (order.orderStatus === "pending") {
    await Order.findByIdAndUpdate(req.body.id, { orderStatus: "shipped" });
    status = "shipped";
  } else if (order.orderStatus === "shipped") {
    await Order.findByIdAndUpdate(req.body.id, {
      orderStatus: "deliverd",
      $set: { "paymentInfo.status": "paid" },
      deliveredAt: Date.now(),
    });
    status = "deliverd";
  }

  return res.status(200).json({
    success: true,
    message: `Order status changed to ${status}`,
  });
});

const cancelOrder = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.body.id);
  if (order.orderStatus !== "pending") {
    return next(
      new ErrorHandler(
        `Cannot cancele the order when it is already ${order.orderStatus}`,
        400
      )
    );
  }
  await Order.findByIdAndUpdate(req.body.id, {
    orderStatus: "canceled",
    $set: { "paymentInfo.status": "canceled" },
  });
  return res.status(200).json({
    success: true,
    message: `Order status changed to canceled`,
  });
});

const getAllMyOrders = asyncHandler(async (req, res, next) => {
  let myOrders = await Order.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  return res.status(200).json({
    success: true,
    myOrders,
  });
});

export {
  newOdrer,
  getAllOrders,
  changeOrderStatus,
  cancelOrder,
  getAllMyOrders,
  stripePaymentCard,
  webhook,
  paypalPayments,
  successPaypal,
  failedPaypal,
};
