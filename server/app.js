import express from "express";
import errorMiddleware from "./middleware/error.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv"
import { webhook } from "./controllers/orderContoroller.js";
dotenv.config({ path: './.env' });
const app = express();
app.post("/api/v1/webhook",express.raw({ type: 'application/json' }),webhook)
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONT_URL_PRODUCTION,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

//routes imports
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"


app.use("/api/v1", userRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", reviewRoutes);
app.get("/api/v1/config/paypal",(req,res)=>{
  res.send(process.env.PAYPAL_CLINET_ID)
})
//error midlerware
app.use(errorMiddleware);
export { app };
