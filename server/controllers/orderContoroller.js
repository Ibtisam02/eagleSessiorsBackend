import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import { Sku } from "../models/skuModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { sendEmail } from "../utils/senEmail.js";
import Stripe from "stripe"




const newOdrer = asyncHandler(async (req, res, next) => {
    let skus=req.body.orders
    if (skus.lenght<0) {
      return next(new ErrorHandler("Plz Add Products To Cart", 400));
    }
    
    let skussToFind=skus.map((item)=>(item._id))
    let findedSkus = await Sku.find({
      _id: { $in: skussToFind }, // Fetch documents where _id is in the cart array
    });

    const fetchProductById = async (productId) => {
      // Replace this with your database query logic
      const product = await Product.findById(productId).select("name brand catagory"); // Fetch only the required fields
      return product;
    };
    const mergeArrays = async (array1, array2, fetchProductById) => {
      try {
        if (!Array.isArray(array1) || !Array.isArray(array2)) {
          return next(new ErrorHandler("Must be an array. Try clearing the cart and try again.", 401));
        }
    
        // Create a map for quick lookup
        const quantityMap = new Map(array2.map(item => [item._id, item.quantity]));
    
        // Merge arrays and handle missing data
        const mergedArray = await Promise.all(
          array1
            .filter(item => {
              if (!item._id) {
                console.error("Missing '_id' in an item from array1:", item);
                return false;
              }
              return quantityMap.has(item._id.toString());
            })
            .map(async item => {
              const quantity = quantityMap.get(item._id.toString());
              if (quantity === undefined || quantity === 0 || !quantity) {
                return next(new ErrorHandler("Quantity not found. Try clearing the cart and try again.", 401));
              }
    
              // Fetch product details for this SKU's productId
              const product = await fetchProductById(item.productId);
    
              if (!product) {
                return next(new ErrorHandler(`Product not found for ID: ${item.productId}`, 404));
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
                skuPhrase:item.skuId
              };
            })
        );
    
        return mergedArray;
      } catch (error) {
        console.error("Error in mergeArrays function:", error.message);
        throw error; // Rethrow the error for further handling
      }
    };

    

    let itemsForCart= await mergeArrays(findedSkus,skus,fetchProductById);

    console.log(itemsForCart);
    
    let itemsPrice=0;
    itemsForCart.map((item)=>{
      itemsPrice+=(item.price*item.quantity)
    })
    let shippingInfo= req.body.shippingData;
    let user=req.user._id;
    let paymentInfo={
      status:"pending",
      method:"cod"
    }
    let taxPrice=itemsPrice/100*process.env.TAX_PRICE;
    let shippingPrice=process.env.SHIPPING_PRICE;
    //let totalPrice=itemsPrice+taxPrice+process.env.SHIPPING_PRICE;
    let orderStatus="pending"

   let createdOrde= await Order.create({shippingInfo,orderItems:itemsForCart,user,paymentInfo,orderStatus,itemsPrice,shippingPrice,taxPrice})
    if (!createdOrde) {
      return next(new ErrorHandler("Internal server Error Somthing went wrong", 500));
    }
    await sendEmail({
      email: "ibtisamwarraich101@gmail.com",
      subject: "Eagle Scissors New Order Email",
      message: `Congratulations! You have recived a new Order from user ${shippingInfo.firstName} ${shippingInfo.lastName} \nEmail:   ${shippingInfo.email}\nPhone:   ${shippingInfo.phone}\nAddress:   ${shippingInfo.address}`,
    });

    console.log(createdOrde);
    

    return res.status(200).json({
      success:true,
      message:"Order Placed Successfully"
    })
});


let stripePaymentCard=asyncHandler(async (req,res,next)=>{
  let skus=req.body.orders
    if (skus.lenght<0) {
      return next(new ErrorHandler("Plz Add Products To Cart", 400));
    }
    
    let skussToFind=skus.map((item)=>(item._id))
    let findedSkus = await Sku.find({
      _id: { $in: skussToFind }, // Fetch documents where _id is in the cart array
    });

    const fetchProductById = async (productId) => {
      // Replace this with your database query logic
      const product = await Product.findById(productId).select("name brand catagory"); // Fetch only the required fields
      return product;
    };
    const mergeArrays = async (array1, array2, fetchProductById) => {
      try {
        if (!Array.isArray(array1) || !Array.isArray(array2)) {
          return next(new ErrorHandler("Must be an array. Try clearing the cart and try again.", 401));
        }
    
        // Create a map for quick lookup
        const quantityMap = new Map(array2.map(item => [item._id, item.quantity]));
    
        // Merge arrays and handle missing data
        const mergedArray = await Promise.all(
          array1
            .filter(item => {
              if (!item._id) {
                console.error("Missing '_id' in an item from array1:", item);
                return false;
              }
              return quantityMap.has(item._id.toString());
            })
            .map(async item => {
              const quantity = quantityMap.get(item._id.toString());
              if (quantity === undefined || quantity === 0 || !quantity) {
                return next(new ErrorHandler("Quantity not found. Try clearing the cart and try again.", 401));
              }
    
              // Fetch product details for this SKU's productId
              const product = await fetchProductById(item.productId);
    
              if (!product) {
                return next(new ErrorHandler(`Product not found for ID: ${item.productId}`, 404));
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
                skuPhrase:item.skuId
              };
            })
        );
    
        return mergedArray;
      } catch (error) {
        console.error("Error in mergeArrays function:", error.message);
        throw error; // Rethrow the error for further handling
      }
    };

    

    let itemsForCart= await mergeArrays(findedSkus,skus,fetchProductById);
    console.log(itemsForCart);
    
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
let line_items=itemsForCart.map((item)=>({
    price_data: {
      currency: 'gbp',
      product_data: { name: `${item.name} ${item.skuPhrase}`,images: [item.image],  },
      unit_amount: Math.round(item.price*100),
    },
    quantity: item.quantity,
}))

line_items.push({
  price_data: {
    currency: 'gbp',
    product_data: { name: `Shipping Charges`  },
    unit_amount: Math.round(process.env.SHIPPING_PRICE*100),
  },
  quantity: 1,
})

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card','bacs_debit','paypal'], // Add as many as supported
    line_items: line_items,
    mode: 'payment',
    success_url: 'http://localhost:5173/success',
    cancel_url: 'http://localhost:5173/cancel',
  });


  return res.status(200).json({
    success:true,
    id:session.id
    
  })
})


const getAllOrders = asyncHandler(async (req, res, next) => {
  
  let orders=await Order.find().sort({createdAt:-1})
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
    success:true,
    orders:orders
  })
});


const changeOrderStatus=asyncHandler(async (req,res,next)=>{
 let order= await Order.findById(req.body.id);
 if (!order) {
  return next(new ErrorHandler("Order not found!", 400));
 }
 if (order.orderStatus==='canceled') {
  return next(new ErrorHandler("Order is canceled earlier", 400));
 }
 if (order.orderStatus==='deliverd') {
  return next(new ErrorHandler("Order is already deliverd", 400));
 }
 let status='';
 if (order.orderStatus==='pending') {
  await Order.findByIdAndUpdate(req.body.id,{orderStatus:'shipped'});
  status='shipped';
 }
 else if (order.orderStatus==='shipped') {
  await Order.findByIdAndUpdate(req.body.id,{orderStatus:'deliverd',$set: { 'paymentInfo.status': 'paid' }});
  status='deliverd';
 }

 return res.status(200).json({
  success:true,
  message:`Order status changed to ${status}`
 })
})

const cancelOrder=asyncHandler (async (req,res,next)=>{
  let order= await Order.findById(req.body.id);
  if (order.orderStatus!=='pending') {
    return next(new ErrorHandler(`Cannot cancele the order when it is already ${order.orderStatus}` , 400));
  }
  await Order.findByIdAndUpdate(req.body.id,{orderStatus:'canceled',$set: { 'paymentInfo.status': 'canceled' }});
  return res.status(200).json({
    success:true,
    message:`Order status changed to canceled`
   })
})

const getAllMyOrders=asyncHandler(async (req,res,next)=>{
  
  let myOrders=await Order.find({user:req.user.id}).sort({createdAt:-1})
  return res.status(200).json({
    success:true,
    myOrders
   })
})





export {newOdrer , getAllOrders, changeOrderStatus,cancelOrder,getAllMyOrders, stripePaymentCard}