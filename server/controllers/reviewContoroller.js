import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { Review } from "../models/reviewModel.js";
import {
  deleteImagesFromCloudiary,
  uploadOnCludinary,
} from "../utils/cloudinary.js";
import Testimonial from "../models/testimonialModel.js";
import Banner from "../models/bannerModel.js";
import { Product } from "../models/productModel.js";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/senEmail.js";
import validator from "validator";
import { Logo } from "../models/logoModel.js";

const userAddAReview = asyncHandler(async (req, res, next) => {
  console.log(req.file);

  let orderId = new mongoose.Types.ObjectId(`${req.body.id}`);

  let order = await Order.findById(orderId);

  if (order.isRated) {
    return next(new ErrorHandler(`Already Reviewd`, 400));
  }

  if (!order) {
    return next(new ErrorHandler(`No Order found ${req.user.id}`, 404));
  }
  let reviewExist = await Review.findOne({ orderId: orderId });
  if (reviewExist) {
    return next(new ErrorHandler(`Already Reviewd`, 400));
  }
  if (order.user.toString() !== req.user.id) {
    return next(
      new ErrorHandler(`No Order Exist for user ${req.user.id}`, 404)
    );
  }
  if (order.orderStatus !== "deliverd") {
    return next(new ErrorHandler(`Order is not yet deliverd`, 404));
  }
  let imageToUpload = null;
  if (req.file) {
    let image = await uploadOnCludinary(req.file.path);
    console.log(image);

    imageToUpload = {
      url: image.secure_url,
      publicId: image.public_id,
    };
  }
  

  let reviewCreated = await Review.create({
    comment: req.body.comment,
    image: imageToUpload,
    title: req.body.title,
    orderId: order._id,
    rating: Number(req.body.rating),
    userId: req.user.id,
    author: order.shippingInfo.firstName,
  });
  
  if (reviewCreated) {
    await Order.findByIdAndUpdate(orderId, { isRated: true });

    let productIds = order?.orderItems?.map((item) => item.productId);
  const uniqueProductIds = [...new Set(productIds)];
  for (let productId of uniqueProductIds) {
    // Fetch the product
    const product = await Product.findById(productId);
    if (product) {
      // Calculate the new average rating
      const totalRating = product.rating * product.numberOfReviews;
      const newTotalRating = totalRating + Number(req.body.rating);
      const newNumberOfReviews = product.numberOfReviews + 1;
      const newAverageRating = newTotalRating / newNumberOfReviews;
      product.rating = newAverageRating.toFixed(1);
      product.numberOfReviews = newNumberOfReviews; // Save the product
      await product.save();
    }
  }
    
  }

  return res.status(200).json({
    success: true,
    message: "Review Created Successfully!",
  });
});

const getAllReviews = asyncHandler(async (req, res, next) => {
  let reviews = await Review.find({ rating: { $gt: 3 } })
    .sort({ createdAt: -1 })
    .select({
      _id: 1,
      title: 1,
      comment: 1,
      rating: 1,
      "image.url": 1,
      createdAt: 1,
      author: 1,
    });
  console.log(reviews);

  res.status(200).json({
    success: true,
    reviews,
  });
});
const getAllReviewsAdmin = asyncHandler(async (req, res, next) => {
  let reviews = await Review.find().sort({ createdAt: -1 });
  console.log(reviews);

  res.status(200).json({
    success: true,
    reviews,
  });
});

const deleteReviewAdmin = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(
      new ErrorHandler(`No Review Exist for id ${req.params.id}`, 404)
    );
  }
  let pubId = review.image.publicId;
  console.log(pubId);

  await Review.findByIdAndDelete(req.params.id);
  await deleteImagesFromCloudiary([pubId]);
  //console.log(reviews);

  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});

//add testimonials

const addTestiMonialsAdmin = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler(`Plz upload image`, 400));
  }

  let { secure_url, public_id } = await uploadOnCludinary(req.file.path);

  let image = {
    url: secure_url,
    publicId: public_id,
  };
  await Testimonial.create({ image: image });
  res.status(200).json({
    success: true,
    message: "Testimonial Added Successfully",
  });
});
const addBannerAdmin = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler(`Plz upload image`, 400));
  }

  let { secure_url, public_id } = await uploadOnCludinary(req.file.path);

  let image = {
    url: secure_url,
    publicId: public_id,
  };
  await Banner.create({
    image: image,
    title: req.body.title,
    buttonText: req.body.buttonText,
    description: req.body.description,
    subTitle: req.body.subTitle,
    link: req.body.link,
  });
  res.status(200).json({
    success: true,
    message: "Banner Added Successfully",
  });
});

const getAllTestimonials = asyncHandler(async (req, res, next) => {
  let testimonials = await Testimonial.find().sort({ createdAt: -1 });
  let pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
  let products = await Product.countDocuments();
  let users = await User.countDocuments();

  res.status(200).json({
    success: true,
    testimonials,
    pendingOrders,
    products,
    users,
  });
});
const getAllBanners = asyncHandler(async (req, res, next) => {
  let banners = await Banner.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    banners,
  });
});

const deleteTestimonial = asyncHandler(async (req, res, next) => {
  let testi = await Testimonial.findById(req.params.id);
  await deleteImagesFromCloudiary([testi.image.publicId]);

  await Testimonial.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Testimonial Deleted successfully",
  });
});
const deleteBanner = asyncHandler(async (req, res, next) => {
  let banner = await Banner.findById(req.params.id);

  await deleteImagesFromCloudiary([banner.image.publicId]);
  await Banner.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Banner Deleted successfully",
  });
});

let sendEmailForMsg = asyncHandler(async (req, res, next) => {
  if (!req.body.name || !req.body.email || !req.body.comment) {
    return next(
      new ErrorHandler(
        `Cannot send Massege all name, email and comment are required fields`,
        401
      )
    );
  }
  if (!validator.isEmail(req.body.email)) {
    return next(
      new ErrorHandler(`${req.body.email} is not a valid email`, 401)
    );
  }
  await sendEmail({
    email: "eagletraders121@gmail.com",
    subject: "Eagle Scissors Contact Email",
    message: `Name:   ${req.body.name}\n Email:   ${req.body.email}\n Phone:   ${req.body.phone}\n Comment:   ${req.body.comment} `,
  });

  res.status(200).json({
    success: true,
    message: "Email Sent successfully!",
  });
});

let changeLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler(`Image is Required`, 401));
  }

  let { secure_url, public_id } = await uploadOnCludinary(req.file.path);
  let logo = {
    logoLink: secure_url,
    publicId: public_id,
  };
  let logoUpdated = await Logo.findByIdAndUpdate("6783c5a8d85926e871cc3d93", {
    logo: logo,
  });
  console.log(logoUpdated);

  await deleteImagesFromCloudiary([logoUpdated.logo.publicId]);

  res.status(200).json({
    success: true,
    message: "Logo Changed successfully!",
  });
});

let getLogo = asyncHandler(async (req, res, next) => {
  let logo = await Logo.findById("6783c5a8d85926e871cc3d93");
  res.status(200).json({
    success: true,
    logo: logo.logo.logoLink,
  });
});

export {
  userAddAReview,
  getAllReviews,
  getAllReviewsAdmin,
  deleteReviewAdmin,
  addTestiMonialsAdmin,
  getAllTestimonials,
  deleteTestimonial,
  addBannerAdmin,
  deleteBanner,
  getAllBanners,
  sendEmailForMsg,
  changeLogo,
  getLogo,
};
