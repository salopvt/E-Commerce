import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; //to access cookie
import cors from "cors";
import session from "express-session";          // ✅ Required for passport
import passport from "passport";  


import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoutes from "./routes/analytics.route.js";


import {connectDB} from "./lib/db.js";
dotenv.config({ path: './backend/.env' }); // ensures .env is loaded from backend folder

const app =express();
const PORT =process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());
app.use(session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()); //allows you to parse the body of request


app.use("/api/auth",authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/coupons",couponRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/analytics",analyticsRoutes)


app.listen(PORT,() =>{
    console.log("Server is running on port" + PORT);

    connectDB();
});

