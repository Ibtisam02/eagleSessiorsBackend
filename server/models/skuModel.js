import mongoose from "mongoose";
import { type } from "os";

const skuSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Please Enter SKU ID"],
  },
  stock: {
    type: Number,
    required: [true, "Please Enter Stock Quantity"],
    min: [0, "Stock cannot be negative"],
  },
  skuId: {
    type: String,
    required: [true, "Please Enter Stock Quantity"],
    lowercase: true, // Automatically converts the value to lowercase
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    maxLength: [8, "Price cannot exceed 8 characters"],
    min: [0, "Price Cannot be less then 0"],
  },
  priceAfterDiscount: {
    type: Number,
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message:
        "Price after discount must be less than or equal to the original price.",
    },
  },
  image: {
    url: {
      type: String,
      required: [true, "Please Enter an Image URL"],
    },
    publicId:{
      type:String,
      required:true,
    }
  },
});

const Sku = mongoose.model("Sku", skuSchema);

export { Sku };
