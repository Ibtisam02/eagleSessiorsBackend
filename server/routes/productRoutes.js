import express from "express"
import { addAReview, createProduct, deleteAProduct, deleteAReview, getAllProducts, getAllProductsLength, getAllProductsWithLowStockLength, getAllReviews, getAProduct, getProductsForHomePage, getSingleSku, getSkus, updateAProduct } from "../controllers/productController.js";
import { verifyJWT,authorizeRole } from "../middleware/auth.js";
import { upload } from "../utils/multer.js";
//import { getProductsInCart } from "../controllers/cartConotoroller.js";
const router=express.Router();
router.route("/products").get(getAllProducts)
router.route("/products/home").get(getProductsForHomePage)
router.route("/admin/products-length").get(verifyJWT,authorizeRole("admin"),getAllProductsLength)
router.route("/admin/low-stock-products-length").get(verifyJWT,authorizeRole("admin"),getAllProductsWithLowStockLength)
router.route("/admin/product/new").post(verifyJWT,authorizeRole("admin"),upload.fields([
    { name: 'images1', maxCount: 1 }, // Main product images
    { name: 'images2', maxCount: 1 }, // SKU images
    { name: 'files', maxCount: 10 }, // SKU images
]) ,createProduct)
router.route("/admin/product/:id").put(verifyJWT,authorizeRole("admin"),upload.array("images",10),updateAProduct).delete(verifyJWT,authorizeRole("admin"),deleteAProduct)
router.route("/product/:id").get(getAProduct)
router.route("/sku").get(getSingleSku)
router.route("/review").put(verifyJWT,addAReview)
router.route("/delete/review").delete(verifyJWT,deleteAReview)
router.route("/get/reviews").get(getAllReviews)
router.route("/get/cart/skus").post(getSkus)
//router.route("/user/get-no-of-products").get(verifyJWT,getProductsInCart)

export default router