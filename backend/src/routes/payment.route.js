const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { User, Reward } = require("../models/user.model");
const { protect } = require("../middleware/auth.middleware");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE_URL = process.env.SITE_URL || "https://greenearthinitiative.online";

// ── Points packages available for purchase ─────────────────
const POINTS_PACKAGES = [
  { id: "points_100",  points: 100,  price: 100,  label: "Starter Pack"   }, // $1.00
  { id: "points_500",  points: 500,  price: 400,  label: "Explorer Pack"  }, // $4.00
  { id: "points_1000", points: 1000, price: 700,  label: "Champion Pack"  }, // $7.00
  { id: "points_2500", points: 2500, price: 1500, label: "Legend Pack"    }, // $15.00
];

// ── Subscription plan ──────────────────────────────────────
// Premium: $4.99/month — 200 bonus pts on signup + premium badge
const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID; // set in .env

// ── GET available points packages ──────────────────────────
router.get("/packages", (req, res) => {
  res.json(POINTS_PACKAGES);
});

// ── A) Buy points — Stripe Checkout ────────────────────────
router.post("/buy-points", protect, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = POINTS_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ msg: "Invalid package" });

    const user = await User.findById(req.user.id);

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: pkg.price,
          product_data: {
            name: `🌱 ${pkg.label} — ${pkg.points} Points`,
            description: `Top up your Green Earth Initiative balance with ${pkg.points} eco points`,
            images: [`${SITE_URL}/icons.svg`],
          },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user._id.toString(),
        type: "points",
        points: pkg.points.toString(),
      },
      success_url: `${SITE_URL}/dashboard?payment=success&points=${pkg.points}`,
      cancel_url: `${SITE_URL}/dashboard?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Buy points error:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ── B) Subscribe to Premium ────────────────────────────────
router.post("/subscribe", protect, async (req, res) => {
  try {
    if (!PREMIUM_PRICE_ID) {
      return res.status(503).json({ msg: "Subscription not configured yet. Please add STRIPE_PREMIUM_PRICE_ID to .env" });
    }

    const user = await User.findById(req.user.id);

    if (user.isPremium && user.premiumUntil && user.premiumUntil > new Date()) {
      return res.status(400).json({ msg: "You already have an active Premium subscription." });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price: PREMIUM_PRICE_ID,
        quantity: 1,
      }],
      metadata: {
        userId: user._id.toString(),
        type: "subscription",
      },
      subscription_data: {
        metadata: { userId: user._id.toString() },
      },
      success_url: `${SITE_URL}/dashboard?payment=premium_success`,
      cancel_url: `${SITE_URL}/dashboard?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Subscribe error:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ── C) Purchase reward directly with real money ─────────────
router.post("/buy-reward/:rewardId", protect, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    if (!reward || !reward.available) {
      return res.status(404).json({ msg: "Reward not available" });
    }
    if (!reward.priceMoney || reward.priceMoney <= 0) {
      return res.status(400).json({ msg: "This reward is not available for direct purchase." });
    }

    const user = await User.findById(req.user.id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: reward.currency?.toLowerCase() || "usd",
          unit_amount: reward.priceMoney, // in cents
          product_data: {
            name: `${reward.flag || ""} ${reward.title}`,
            description: reward.description,
            ...(reward.imageUrl && !reward.imageUrl.startsWith("data:") && {
              images: [reward.imageUrl],
            }),
          },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user._id.toString(),
        type: "reward",
        rewardId: reward._id.toString(),
        deliveryInfo: req.body.deliveryInfo || "",
      },
      success_url: `${SITE_URL}/dashboard?payment=reward_success`,
      cancel_url: `${SITE_URL}/dashboard?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Buy reward error:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

// ── Stripe Webhook — fulfil payments ───────────────────────
// Must be mounted with express.raw() — see index.js
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { userId, type, points, rewardId, deliveryInfo } = session.metadata;

      // A) Points top-up
      if (type === "points" && userId && points) {
        await User.findByIdAndUpdate(userId, { $inc: { points: parseInt(points) } });
        console.log(`✅ Credited ${points} points to user ${userId}`);
      }

      // C) Direct reward purchase — create a Redemption record
      if (type === "reward" && userId && rewardId) {
        const { Redemption } = require("../models/user.model");
        const reward = await Reward.findById(rewardId);
        if (reward) {
          await Redemption.create({
            userId,
            rewardId,
            pointsSpent: 0, // paid with money, not points
            deliveryInfo: deliveryInfo || "",
            status: "pending",
            fulfilmentNote: `Paid via Stripe — session ${session.id}`,
          });
          // Reduce stock
          if (reward.stock > 0) {
            reward.stock -= 1;
            if (reward.stock === 0) reward.available = false;
            await reward.save();
          }
          console.log(`✅ Reward ${rewardId} purchased by user ${userId}`);
        }
      }
    }

    // B) Subscription activated
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (userId && subscription.status === "active") {
        const periodEnd = new Date(subscription.current_period_end * 1000);
        await User.findByIdAndUpdate(userId, {
          isPremium: true,
          premiumUntil: periodEnd,
          $inc: { points: 200 }, // bonus points on premium activation
        });
        console.log(`✅ Premium activated for user ${userId} until ${periodEnd}`);
      }
    }

    // B) Subscription cancelled / expired
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, { isPremium: false, premiumUntil: null });
        console.log(`❌ Premium cancelled for user ${userId}`);
      }
    }

  } catch (err) {
    console.error("Webhook processing error:", err.message);
  }

  res.json({ received: true });
});

module.exports = router;
