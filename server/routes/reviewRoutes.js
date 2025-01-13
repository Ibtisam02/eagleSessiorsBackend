import express from "express"
import { getAllBanners,addBannerAdmin, addTestiMonialsAdmin, deleteBanner, deleteReviewAdmin, deleteTestimonial, getAllReviews, getAllReviewsAdmin, getAllTestimonials, userAddAReview, sendEmailForMsg, changeLogo, getLogo } from "../controllers/reviewContoroller.js";
import { authorizeRole, verifyJWT } from "../middleware/auth.js";
import { upload } from "../utils/multer.js";

const router=express.Router();


router.route("/user/add/review").post(verifyJWT,upload.single("image"),userAddAReview);
router.route("/get/all/reviews").get(getAllReviews);
router.route("/get/all/reviews/admin").get(verifyJWT,authorizeRole("admin"),getAllReviewsAdmin);
router.route("/delete/a/review/admin/:id").delete(verifyJWT,authorizeRole("admin"),deleteReviewAdmin);
router.route("/add/a/testimonial").post(verifyJWT,authorizeRole("admin"),upload.single("image"),addTestiMonialsAdmin);
router.route("/add/a/banner").post(verifyJWT,authorizeRole("admin"),upload.single("image"),addBannerAdmin);
router.route("/delete/a/testimonial/:id").delete(verifyJWT,authorizeRole("admin"),deleteTestimonial);
router.route("/delete/a/banner/:id").delete(verifyJWT,authorizeRole("admin"),deleteBanner);
router.route("/get/all/testimonials").get(getAllTestimonials);
router.route("/get/all/banners").get(getAllBanners);
router.route("/send/message").post(sendEmailForMsg);
router.route("/get/logo").get(getLogo);
router.route("/change/logo").put(verifyJWT,authorizeRole("admin"),upload.single("image"),changeLogo);


export default router