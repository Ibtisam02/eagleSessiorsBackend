import mongoose from "mongoose";
import validator from "validator";

const orderScheema = new mongoose.Schema({
  shippingInfo: {
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        validate:[validator.isEmail,"Please Enter a Valid Email"],
        required:true
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      maxLength: [15, "Number cannot exceed 15 characters"],
    },
  },
  orderItems: [
    {
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      brand: {
        type: String,
      },
      catagory: {
        type: String,
        required: true,
      },
      productId: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
      skuId: {
        type: mongoose.Schema.ObjectId,
        ref: "Sku",
        required: true,
      },
      skuPhrase: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  paymentInfo: {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid','canceled'],
    },
    method:{
      type: String,
      required: true,
      enum: ['cod', 'card','bank','paypal'],
    }
  },

  payedAt: {
    type: Date,
  },
  itemsPrice: {
    type: Number,
    default: 0,
    required: true,
    set: (value) => Math.round(value * 100) / 100,
  },
  taxPrice: {
    type: Number,
    default: 0,
    required: true,
    set: (value) => Math.round(value * 100) / 100,
  },
  shippingPrice: {
    type: Number,
    default: 0,
    required: true,
    set: (value) => Math.round(value * 100) / 100,
  },
  totalPrice: {
    type: Number,
    default: 0,
    required: true,
    set: (value) => Math.round(value * 100) / 100,
  },

  orderStatus: {
    type: String,
    required: true,
    default: "pending",
    enum: ['pending', 'shipped','deliverd','canceled'],
  },
  isRated:{
    type:Boolean,
    default:false
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
orderScheema.pre('save', function (next) {
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
  next();
});
const Order = mongoose.model("Order", orderScheema);

export default Order;
