/**
 * stripe-backfill.js
 *
 * One-time script that pulls all completed Stripe checkout sessions
 * from the Stripe API and inserts them into the Payment collection.
 *
 * Run from the backend/ directory:
 *   node src/stripe-backfill.js
 *
 * Safe to run multiple times — uses stripeSessionId as a unique key
 * so existing records are never duplicated.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Stripe = require("stripe");

// ── Config ────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not set in .env");
  process.exit(1);
}
if (!STRIPE_SECRET_KEY) {
  console.error("❌  STRIPE_SECRET_KEY is not set in .env");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ── Points packages (mirrors payment.route.js) ────────────
const POINTS_PACKAGES = [
  { id: "points_100",  points: 100,  price: 100,  label: "Starter Pack"  },
  { id: "points_500",  points: 500,  price: 400,  label: "Explorer Pack" },
  { id: "points_1000", points: 1000, price: 700,  label: "Champion Pack" },
  { id: "points_2500", points: 2500, price: 1500, label: "Legend Pack"   },
];

// Lazy-load models after mongoose connects
let User, Payment, Reward;

// ── Helpers ───────────────────────────────────────────────

/**
 * Build a human-readable description for a session.
 * Falls back to raw metadata fields when the nice name can't be derived.
 */
function buildDescription(session, reward) {
  const { type, points, rewardId } = session.metadata || {};
  if (type === "points" && points) {
    const pkg = POINTS_PACKAGES.find(p => p.points === parseInt(points));
    return pkg ? `${pkg.label} — ${pkg.points} Points` : `${points} Points Top-up`;
  }
  if (type === "subscription") return "Premium Subscription";
  if (type === "reward") {
    if (reward) return `Reward: ${reward.flag || ""} ${reward.title}`.trim();
    return `Reward Purchase`;
  }
  // Fallback: use Stripe line item descriptions if available
  return session.display_items
    ? session.display_items.map(i => i.description || i.custom?.name).filter(Boolean).join(", ")
    : "Payment";
}

/**
 * Resolve a MongoDB userId from:
 * 1. session.metadata.userId  (standard — set on all our sessions)
 * 2. session.customer_email   (fallback — look up user by email)
 */
async function resolveUserId(session) {
  const { userId } = session.metadata || {};
  if (userId && mongoose.isValidObjectId(userId)) return userId;

  // Try to match by Stripe customer id
  if (session.customer) {
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (user) return user._id.toString();
  }

  // Try to match by email
  if (session.customer_details?.email) {
    const user = await User.findOne({ email: session.customer_details.email });
    if (user) return user._id.toString();
  }

  return null; // Unknown user — still store the payment, just without a userId link
}

// ── Main backfill logic ───────────────────────────────────

async function backfill() {
  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI);
  console.log("✅  MongoDB connected");

  // Load models after connection
  const models = require("./models/user.model");
  User    = models.User;
  Payment = models.Payment;
  Reward  = models.Reward;

  console.log("📡  Fetching completed checkout sessions from Stripe…");

  let totalFetched = 0;
  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  // Stripe auto-paginates — we iterate through ALL pages
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const params = {
      limit: 100,
      status: "complete",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    };

    let response;
    try {
      response = await stripe.checkout.sessions.list(params);
    } catch (err) {
      console.error("❌  Stripe API error:", err.message);
      break;
    }

    const sessions = response.data;
    totalFetched += sessions.length;
    hasMore = response.has_more;

    if (sessions.length > 0) {
      startingAfter = sessions[sessions.length - 1].id;
    }

    console.log(`   → Fetched ${sessions.length} sessions (total so far: ${totalFetched})`);

    for (const session of sessions) {
      try {
        const { type, points, rewardId, deliveryInfo } = session.metadata || {};

        // Only process sessions we created (must have a type in metadata)
        if (!type) {
          skipped++;
          continue;
        }

        // Resolve reward document if needed
        let reward = null;
        if (type === "reward" && rewardId && mongoose.isValidObjectId(rewardId)) {
          reward = await Reward.findById(rewardId).lean();
        }

        const userId = await resolveUserId(session);
        const description = buildDescription(session, reward);

        const doc = {
          stripeSessionId:  session.id,
          type:             type,
          amountTotal:      session.amount_total || 0,
          currency:         session.currency     || "usd",
          description,
          status:           "completed",
          stripeCustomerId: session.customer     || "",
          meta: {
            ...(points    ? { points: parseInt(points) } : {}),
            ...(rewardId  ? { rewardId, rewardTitle: reward?.title || "" } : {}),
            ...(deliveryInfo ? { deliveryInfo } : {}),
          },
        };

        if (userId) doc.userId = userId;

        const result = await Payment.findOneAndUpdate(
          { stripeSessionId: session.id },
          { $setOnInsert: doc },          // only write if NEW — never overwrite existing
          { upsert: true, new: true }
        );

        if (result) inserted++;

      } catch (err) {
        console.error(`   ⚠️  Error processing session ${session.id}:`, err.message);
        errors++;
      }
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅  Backfill complete!`);
  console.log(`   Sessions fetched from Stripe : ${totalFetched}`);
  console.log(`   Records upserted into DB     : ${inserted}`);
  console.log(`   Sessions skipped (no type)   : ${skipped}`);
  console.log(`   Errors                       : ${errors}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
  console.log("🔌  MongoDB disconnected. Done.");
}

backfill().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
