import mongoose from "mongoose";
import { type } from "os";

const reviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: [true, "Order Id is Required"],
    unique:true
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "User Id is Required"],
  },
  title: {
    type: String,
    required: [true, "Please Enter Title"],
    minLength: [3, "Title Cannot be less then 3 characters"],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "Please Enter author"],
    trim: true,
  },
  comment: {
    type: String,
    required: [true, "Please Enter Title"],
    minLength: [10, "Title Cannot be less then 10 characters"],
    trim: true,
  },
  rating: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    min: [1, "Price Cannot be less then 1"],
    max: [5, "Rating Cannot be greater then 5"],
  },

  image: {
    url: {
      type: String,
    },
    publicId: {
      type: String,
    },
  },
},{timestamps:true});

const Review = mongoose.model("Review", reviewSchema);

export { Review };
