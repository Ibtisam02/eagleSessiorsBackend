import { Product } from "../models/productModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiFeatures from "../utils/apiFeatures.js";
import { deleteImagesFromCloudiary, uploadOnCludinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose, { Mongoose } from "mongoose";
import { Sku } from "../models/skuModel.js";
import { upload } from "../utils/multer.js";

//create product

const createProduct = asyncHandler(async (req, res) => {
  try {
    // Parse incoming JSON data
    const skus = JSON.parse(req.body.skus);
    const colors = JSON.parse(req.body.colors);
    const sizes = JSON.parse(req.body.sizes);
    const variants = JSON.parse(req.body.variants);

    // Upload primary images to Cloudinary
    const [uploadedImage1, uploadedImage2] = await Promise.all([
      uploadOnCludinary(req.files.images1[0].path),
      uploadOnCludinary(req.files.images2[0].path),
    ]);

    const productImages = [
      {
        public_id: uploadedImage1.public_id,
        url: uploadedImage1.url,
      },
      {
        public_id: uploadedImage2.public_id,
        url: uploadedImage2.url,
      },
    ];

    // Prepare color, size, and variant data
    const colorsToSend = colors.map((color) => ({ color }));
    const sizesToSend = sizes.map((size) => ({ size }));
    const variantsToSend = variants.map((variant) => ({ varient:variant }));
    console.log(variantsToSend);
    

    // Extract product details
    const { name, description, category, basePrice, discount, brand,shippingFee } = req.body;
    const user = req.user.id;

    // Check if SKUs exist
    if (skus.length === 0) {
      return res.status(400).json({
        success: false,
        message: "SKUs are required to create a product."
      });
    }

    // Create product
    const uploadedProduct = await Product.create({
      name,
      brand,
      shippingFee:Number(shippingFee),
      basePprice: Number(basePrice),
      catagory:category,
      colors: colorsToSend,
      sizes: sizesToSend,
      description,
      discount: Number(discount),
      images: productImages,
      varients: variantsToSend,
      user,
    });

    // Upload SKU images and prepare SKU data
    const skuImageData = await Promise.all(
      req.files.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "uploads" })
      )
    );

    skus.forEach((sku, i) => {
      const price = Number(sku.price);
      skus[i] = {
        ...sku,
        stock: Number(sku.stock),
        price,
        priceAfterDiscount: (price - (price * uploadedProduct.discount) / 100).toFixed(2),
        image: {
          publicId: skuImageData[i].public_id,
          url: skuImageData[i].secure_url,
        },
        productId: uploadedProduct._id,
      };
    });

    // Insert SKUs into the database
    await Sku.insertMany(skus);

    return res.status(200).json({
      success: true,
      message: "Product and SKUs created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error.message);

    // Rollback any partial data
    if (error instanceof mongoose.Error) {
      await Product.findByIdAndDelete(uploadedProduct?._id);
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the product. Please try again.",
    });
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments();
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination();
  const products = await apiFeature.query;
  res.status(200).json({
    success: true,
    productCount,
    products,
  });
});
const getSingleSku = asyncHandler(async (req, res) => {
 const sku=await Sku.findOne({productId:req.query.productId,skuId:req.query.skuId})
 
  res.status(200).json({
    success: true,
    sku,
  });
});


const getProductsForHomePage = asyncHandler(async (req, res) => {
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination();
  const products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
  });
});

const updateAProduct = asyncHandler(async (req, res, next) => {
  try {
    
    let skus = req.body.skus;
    let basicDetails = req.body.basicDetails;
    
    let toUpdate = skus.map((item) => {
      return {
        price: item.price,
        stock: item.stock,
        _id: item._id
      };
    });
    
    console.log(toUpdate);
    console.log(basicDetails);
    
    await Product.findByIdAndUpdate(req.params.id, {
      name: basicDetails.name,
      brand: basicDetails.brand,
      discount: Number(basicDetails.discount),
      catagory: basicDetails.category,
      basePrice: Number(basicDetails.basePrice),
      description: basicDetails.description,
      shippingFee: Number(basicDetails.shippingFee)
    });
    
    for (let ids of toUpdate) {
      // Fetch the product
      const product = await Sku.findById(ids._id);
      if (product) {
        // Update price and stock
        product.price = ids.price;
        product.stock = Number(ids.stock);
        await product.save();
      }
    }
    
    // Calculate priceAfterDiscount and update in one go
    await Sku.updateMany(
      { productId: req.params.id },
      [{
        $set: {
          priceAfterDiscount: { $toDouble: { $subtract: ['$price', { $multiply: ['$price', { $divide: [Number(basicDetails.discount), 100] }] }] } }
        }
      }]
    );
    
    return res.status(200).json({
      success: true,
      message: "Updated!"
    });
    
    //console.log(name,description,category,discount,brand,shippingFee,basePrice);
    

    /*const imageData = await Promise.all(
      req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "uploads" })
      )
    );
    const images = imageData.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    await Product.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          colors: { _id: { $in: rmColors } },
          sizes: { _id: { $in: rmSizes } }, // If you also want to remove sizes
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        // Update other fields
        name: req.body.name,
        catagory: req.body.catagory,
        stock: req.body.stock,
        price: req.body.price,
        description: req.body.description,
        discount: req.body.discount,
        subCatagory: req.body.subCatagory,

        // Push multiple items to the items array
        $push: {
          images: { $each: images },
          colors: { $each: colors },
          sizes: { $each: sizes },
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    console.log(updatedProduct);
    return res.status(200).json({
      success: true,
      updatedProduct,
    });
    */
  } catch (error) {
    return next(error);
  }
});

//Delete Product

const deleteAProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Fund", 404));
  }
  let skus= await Sku.find({productId:req.params.id})
  let skuPubIds=[];
  skus.forEach((sku)=>{
    skuPubIds.push(sku.image.publicId)
  })
  let pubIds = [];
  product.images.forEach((img) => {
    pubIds.push(img.public_id);
  });
  console.log(pubIds,skuPubIds);
  
  await Product.findByIdAndDelete(req.params.id);
  await Sku.deleteMany({productId:req.params.id});
  await deleteImagesFromCloudiary(pubIds);
  await deleteImagesFromCloudiary(skuPubIds);
  
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

//Get A Product
const getAProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Fund", 404));
  }

  const skus=await Sku.find({productId:product._id})
  return res.status(200).json({
    success: true,
    product,
    skus
  });
});



const getSkus = asyncHandler(async (req, res, next) => {
  try {
    const cart = req.body.cart; // Array of SKU IDs
    console.log(cart);
    
    let newCart=cart.map((item)=>(item._id));
    console.log(newCart);
    // Check if cart is not empty
    let findedSkus = null;
    if (cart?.length > 0) {
      findedSkus = await Sku.find({
        _id: { $in: newCart }, // Fetch documents where _id is in the cart array
      });
    }
    
    return res.status(200).json({
      success: true,
      findedSkus,
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching SKUs.",
    });
  }
});


//Add a review or update

const addAReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };
  console.log(review);

  const product = await Product.findById(productId);
  const isReviewd = product.reviews.find((item) => item.user == req.user.id);
  if (isReviewd) {
    product.reviews.forEach((item) => {
      if (item.user == req.user.id) {
        item.rating = rating;
        item.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  let avg = 0;
  product.reviews.forEach((item) => {
    avg += item.rating;
  });
  product.rating = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: "Review Added successfully",
  });
});

//get all reviews of a product

const getAllReviewsOfAProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    return next(new ErrorHandler("Product not Found!", 404));
  }

  return res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});
const getAllReviews = asyncHandler(async (req, res, next) => {
  const product = await Product.find().select({ reviews: 1, name: 1 });
  let noOfProducts = await Product.find().countDocuments();
  let rando = Math.floor(Math.random() * noOfProducts);
  let reviws = product[rando];

  console.log(reviws);

  return res.status(200).json({
    success: true,
    reviews: reviws,
  });
});

//delete a review

const deleteAReview = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    return next(new ErrorHandler("Product not Found!", 404));
  }

  const reviews = product.reviews.filter(
    (item) => item._id.toString() !== req.query.id.toString()
  );
  let avg = 0;
  reviews.forEach((item) => {
    avg += item.rating;
  });
  const rating = avg / reviews.length;
  const numberOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      rating,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  return res.status(200).json({
    success: true,
    message: "review delted successfully",
  });
});

const getAllProductsLength = asyncHandler(async (req, res, next) => {
  const products = await Product.countDocuments();

  res.status(200).json({
    success: true,
    products,
  });
});
const getAllProductsWithLowStockLength = asyncHandler(
  async (req, res, next) => {
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 5 },
    });

    res.status(200).json({
      success: true,
      lowStockProducts,
    });
  }
);

export {
  getAllProducts,
  createProduct,
  updateAProduct,
  deleteAProduct,
  getAProduct,
  addAReview,
  getAllReviews,
  deleteAReview,
  getAllProductsLength,
  getAllProductsWithLowStockLength,
  getProductsForHomePage,
  getSingleSku,
  getSkus,
};
