import Coupon from "../models/coupon.model.js";
import { stripe } from "../lib/stripe.js";
import dotenv from "dotenv";
import Order from "../models/order.model.js";

dotenv.config();

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // convert to cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image], // ensure it's a valid URL
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    let stripeCouponId = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
        // Create coupon in Stripe
        const stripeCoupon = await stripe.coupons.create({
          percent_off: coupon.discountPercentage,
          duration: "once",
        });
        stripeCouponId = stripeCoupon.id;
      }
    }

    console.log("✅ Stripe session creation start");
    console.log("Total amount (in cents):", totalAmount);
    console.log("Coupon object:", coupon);
    console.log("User:", req.user);
    console.log("Line items:", lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Generate new coupon if eligible
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("❌ Error in createCheckoutSession controller:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function createNewCoupon(userId) {
  const code = "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const stripeCoupon = await stripe.coupons.create({
    percent_off: 10,
    duration: "once",
  });

  const newCoupon = new Coupon({
    code,
    discountPercentage: 10,
    expirationDate: expiration,
    userId,
    stripeCouponId: stripeCoupon.id,
  });

  await newCoupon.save();
  return newCoupon;
}

export const checkoutsuccess = async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.query.session_id;
    console.log("📦 Session ID:", sessionId);

    if (!sessionId) {
      return res.status(400).json({ message: "Missing session ID" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const stripeSessionId = session.id;


    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      const products = JSON.parse(session.metadata.products);
      const existingOrder = await Order.findOne({ stripeSessionId });
if (existingOrder) {
  return res.status(200).json({
    success: true,
    message: "Order already processed.",
    orderId: existingOrder._id,
  });
}
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((p) => ({
          product: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      return res.status(200).json({
        success: true,
        message: "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
      });
    }

    return res.status(400).json({ message: "Payment not completed." });

  } catch (error) {
    console.error("❌ Error in checkoutsuccess controller:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
};
