# 🌍 Green Earth Initiative

**An interactive eco gamification platform that rewards users for completing real-world environmental tasks.**

🌐 **Live:** [greenearthinitiative.online](https://greenearthinitiative.online)

---

## What is Green Earth Initiative?

Green Earth Initiative turns everyday environmental actions into a rewarding game. Users complete verified eco tasks — planting trees, recycling, saving water, running community cleanups, and more — to earn **Green Points** redeemable for real rewards delivered worldwide.

Built for individuals, families, students, and communities who want to make a measurable positive impact on the planet while being recognised and rewarded for it.

---

## ✨ Features

### 🎮 Gamification
- **5-Level progression system** — Seedling → Green Helper → Eco Guardian → Earth Champion → 👑 Green Earth Hero
- **Daily Challenge** — a featured task every day with 1.5× bonus points
- **Green Streaks** — consecutive day milestones: 3-day (+50 pts), 7-day (+300 pts), 14-day (+700 pts), 30-day (+2,000 pts)
- **7-Day Green Champion Challenge** — complete 7 specific tasks for a +200 pt bonus
- **Global Leaderboard** — compete with eco-warriors worldwide

### 🌱 100+ Eco Tasks across 12 Categories
| Category | Examples |
|----------|---------|
| 🌿 Environmental | Plant trees, community cleanup, compost |
| 🏠 Domestic | Sweep, clean bathroom, help elderly family |
| 💧 Water Saving | Fix leaking taps, shorter showers, collect rainwater |
| ⚡ Energy Saving | Unplug appliances, use natural light, solar lighting |
| 🚮 Waste Management | Separate plastic, collect bottles, e-waste disposal |
| 🌳 Community | Street cleanup, awareness events, donate items |
| 👨‍👩‍👧‍👦 Family Challenges | Family tree planting, family cleanup challenge |
| 🎓 School Tasks | School eco club, environmental poster, school cleanup |
| 📚 Educational Quizzes | Climate change, recycling, renewable energy (auto-graded) |
| 🏃 Healthy Living | Walk 5,000 steps, cycle, 30 mins outdoors |
| 🧒 Kids Tasks | Bird feeder, litter pickup, draw eco poster |
| 🔥 Hard Challenges | Rainwater harvesting, 30-day zero waste, go car-free |

### 🎁 Global Rewards
- eVouchers (£5–£50 value) via PayPal or mobile money — available in 190+ countries
- Google Play gift cards, Amazon vouchers
- Tree planting certificates 🌳
- Eco merchandise shipped worldwide

### 🛡️ Anti-Fraud & Security
- Photo + written proof required for higher-value tasks
- **Proof tiers:** basic / enhanced (note required) / verified (admin review)
- Daily earning cap (500 pts) and weekly cap (1,500 pts)
- Minimum Level 2 + 7-day account age to redeem rewards
- IP tracking, duplicate detection, fraud flagging
- Admin ban/unflag tools

### 💳 Payments (Stripe)
- Buy points packages ($1–$15)
- Premium subscription ($4.99/month — bonus points + premium badge)
- Direct reward purchase with real money

### 📧 Email System (Resend)
- Task approval notification emails
- Reminder emails for inactive users

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router 6, Framer Motion |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas, Mongoose 9 |
| **Auth** | JWT, bcrypt |
| **Payments** | Stripe |
| **Email** | Resend |
| **Hosting** | Render (full-stack) |
| **Security** | Helmet, express-rate-limit, NoSQL injection prevention |

---

## 📁 Project Structure

```
Green Earth Initiative/
├── backend/
│   ├── src/
│   │   ├── controllers/      # auth
│   │   ├── middleware/        # auth, fraud detection
│   │   ├── models/            # User, Task, Submission, Reward, etc.
│   │   ├── routes/            # user.route.js, payment.route.js
│   │   ├── services/          # email.service.js
│   │   ├── utils/             # levels.js
│   │   ├── seed.js            # DB seeding
│   │   └── index.js           # Express app entry
│   └── frontend/
│       ├── public/            # manifest, sitemap, robots.txt
│       └── src/
│           ├── components/    # DailyChallenge, StreakCard, QuizModal, ShopTab, etc.
│           ├── pages/         # Dashboard, AdminDashboard, Landing, SEO pages
│           └── utils/         # levels.js
├── render-build.sh
└── package.json
```

---

## 🚀 Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/thomasgaga54-sudo/Green-Earth-initiative.git
cd Green-Earth-initiative

# 2. Install dependencies
npm install
npm install --prefix backend/frontend

# 3. Set up environment variables
# Copy and fill in backend/.env:
# MONGO_URI, JWT_SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY, etc.

# 4. Seed the database
node backend/src/seed.js

# 5. Build and start
npm run build   # builds frontend
npm start       # starts Express server (serves frontend + API)
```

Server runs on `http://localhost:3000`

---

## 🌐 SEO Pages

| URL | Purpose |
|-----|---------|
| `/` | Homepage |
| `/about` | About Green Earth Initiative |
| `/how-it-works` | How the platform works |
| `/eco-tasks` | All 12 task categories |
| `/rewards` | Rewards catalogue |
| `/game` | Eco game overview |
| `/contact` | Contact form |
| `/privacy` | Privacy Policy |
| `/terms` | Terms & Conditions |

---

## 📊 Admin Dashboard

Full admin panel at `/admin`:
- Review and approve/reject task submissions with photo proof
- View user profiles with full submission history, streak, level
- Adjust user points (add or deduct)
- Ban / unflag users
- Create and delete tasks
- Send reminder emails to inactive users
- Manage rewards and redemptions

---

## 📄 Licence

MIT — free to use, fork, and build upon.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

*Built with 💚 to make environmental action rewarding.*
