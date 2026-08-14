import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

export default function RewardsPage() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="Rewards — Redeem Green Points for Real Prizes | Green Earth Initiative"
        description="Redeem your Green Points for eVouchers, merchandise, tree planting certificates, Google Play gift cards, Amazon vouchers and more. Available in 190+ countries."
        canonical="https://greenearthinitiative.online/rewards"
      />

      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>🌍 Green Earth Initiative</Link>
        <div className={styles.navLinks}>
          <Link to="/about" className={styles.navLink}>About</Link>
          <Link to="/how-it-works" className={styles.navLink}>How It Works</Link>
          <Link to="/eco-tasks" className={styles.navLink}>Eco Tasks</Link>
          <Link to="/rewards" className={styles.navLink}>Rewards</Link>
          <Link to="/register" className={styles.navCta}>Get Started</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <span className={styles.heroBadge}>🎁 Real Rewards</span>
        <h1>Earn Green Points. Redeem Real Rewards.</h1>
        <p>Every eco task you complete earns Green Points redeemable for vouchers, merchandise, and more — delivered worldwide.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>What Can You Redeem?</h2>
          <p>
            Green Earth Initiative offers a global rewards catalogue available in 190+ countries.
            Points are redeemed for tangible rewards delivered to your email or postal address.
          </p>

          <div className={styles.grid}>
            {[
              { icon: '🌍', title: 'Global eVoucher — Starter', desc: '100 pts · Approx. £5 / $6 / €6. Delivered as PayPal or mobile money transfer to your registered email.' },
              { icon: '🌍', title: 'Global eVoucher — Explorer', desc: '250 pts · Approx. £12 / $15 / €14. Available in all countries.' },
              { icon: '🌍', title: 'Global eVoucher — Champion', desc: '500 pts · Approx. £25 / $30 / €28. Delivered worldwide.' },
              { icon: '🌍', title: 'Global eVoucher — Legend', desc: '1,000 pts · Approx. £50 / $60 / €55. The ultimate reward tier.' },
              { icon: '🎮', title: 'Google Play Gift Card $5', desc: '150 pts · Redeemable in 190+ countries for apps, games, and digital content.' },
              { icon: '🎮', title: 'Google Play Gift Card $10', desc: '300 pts · Delivered to your email worldwide.' },
              { icon: '🛒', title: 'Amazon Gift Card $10', desc: '300 pts · Redeemable on Amazon.com and international Amazon stores.' },
              { icon: '🌳', title: 'Tree Planting Certificate', desc: '150 pts · We plant a real tree in your name. Digital certificate by email.' },
              { icon: '🎁', title: 'Green Earth Eco Tote Bag', desc: '100 pts · Reusable cotton tote bag shipped to your address worldwide.' },
            ].map((item, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Redemption Rules</h2>
          <p>To keep the rewards system fair and prevent abuse, the following rules apply:</p>
          <ul>
            <li>You must reach <strong>Level 2 (Green Helper — 501 pts)</strong> before redeeming any reward.</li>
            <li>Your account must be at least <strong>7 days old</strong> to redeem.</li>
            <li>One redemption every <strong>14 days</strong> per account.</li>
            <li>Daily earning cap: <strong>500 pts/day</strong>. Weekly cap: <strong>1,500 pts/week</strong>.</li>
            <li>Rewards are fulfilled within <strong>14–28 business days</strong>.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>How to Earn Points Faster</h2>
          <div className={styles.steps}>
            {[
              { title: 'Complete the Daily Challenge', desc: 'Every day a featured challenge earns 1.5× bonus points.' },
              { title: 'Build a Streak', desc: 'Complete a task every day. Reach 7 days for +300 pts, 30 days for +2,000 pts.' },
              { title: 'Complete the 7-Day Green Champion Challenge', desc: 'Finish all 7 challenge steps to claim a +200 bonus.' },
              { title: 'Take Educational Quizzes', desc: 'Quick quizzes that award points instantly — no photo or admin review needed.' },
            ].map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepBody}><h3>{s.title}</h3><p>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.ctaBox}>
          <h2>Start Earning Rewards Today</h2>
          <p>Free to join. Complete eco tasks, earn points, and redeem real rewards worldwide.</p>
          <Link to="/register" className={styles.ctaBtn}>Join for Free</Link>
          <Link to="/eco-tasks" className={styles.ctaSecondary}>Browse tasks →</Link>
        </div>

        <div className={styles.internalLinks}>
          <p>EXPLORE MORE</p>
          <Link to="/about">About Us</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/eco-tasks">Eco Tasks</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>🌍 Green Earth Initiative &copy; {new Date().getFullYear()} · greenearthinitiative.online</p>
        <div className={styles.footerLinks}>
          <Link to="/">Home</Link><span>·</span>
          <Link to="/about">About</Link><span>·</span>
          <Link to="/privacy">Privacy Policy</Link><span>·</span>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
      </footer>
    </div>
  )
}
