import mongoose from "mongoose";
import { type } from "os";

const productScheema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter Product Description"],
  },
  basePprice: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    maxLength: [8, "Price cannot exceed 8 characters"],
  },
  shippingFee: {
    type: Number,
    required: [true, "Please Enter Shipping Price"],
    min:[0,"cnnot be less then zero"]
  },
  brand: {
    type: String,
  },
  discount: {
    type: Number,
    default:0,
    maxLength: [3, "Price cannot exceed 8 characters"],
    min:[0,"discount Cannot be less then 0%"],
    max:[100,"discount Cannot be more then 100%"],
  },
  rating: {
    type: Number, 
    default: 0,
    max:[5,"Cannot be greater then 5"],
    min:[0,"Cannot be less then 0"]
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  colors: [
    {
      color: {
        type: String,
      },
    },
  ],
  sizes: [
    {
      size: {
        type: String,
      },
    },
  ],
  varients: [
    {
      varient: {
        type: String,
        lowercase: true, 
        trim: true,
      },
    },
  ],
  catagory: {
    type: String,
    required: [true, "Please Enter Product Catagory"],
  },
  numberOfReviews: {
    type: Number,
    default: 0,
    min:[0,"cannot be less then zero"]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productScheema);

export { Product };
