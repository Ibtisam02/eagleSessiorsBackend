import express from "express"
import { authorizeRole, verifyJWT } from "../middleware/auth.js";
import bodyParser from "body-parser";
import { cancelOrder, changeOrderStatus, getAllMyOrders, getAllOrders, newOdrer, stripePaymentCard, webhook } from "../controllers/orderContoroller.js";


const router=express.Router();


router.route("/place/order/with/cod").post(verifyJWT,newOdrer);
router.route("/stripe/payment/card").post(verifyJWT,stripePaymentCard);
router.route("/get/all/orders").get(verifyJWT,authorizeRole("admin"),getAllOrders);
router.route("/change/order/status").put(verifyJWT,authorizeRole("admin"),changeOrderStatus);
router.route("/cancle/order").put(verifyJWT,authorizeRole("admin"),cancelOrder);
router.route("/get/my/order").get(verifyJWT,getAllMyOrders);
export default router