import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './Landing.module.css'

const features = [
  { icon: '🌱', title: 'Complete Eco Tasks', desc: 'Plant trees, reduce waste, save energy — earn points for real actions.' },
  { icon: '🏆', title: 'Climb the Leaderboard', desc: 'Compete with your community and rise through green achievement levels.' },
  { icon: '🎁', title: 'Earn Rewards', desc: 'Redeem your points for vouchers, merchandise, and exclusive perks.' },
]

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.logo}>🌍 Green Earth</div>
        <div className={styles.navLinks}>
          <Link to="/login" className={styles.navLogin}>Log in</Link>
          <Link to="/register" className={styles.navCta}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.badge}>🌿 Eco Gamification Platform</span>
          <h1>Turn Green Actions<br />into Real Rewards</h1>
          <p>Join thousands of eco-warriors completing environmental tasks, earning points, and making a measurable impact on the planet.</p>
          <div className={styles.heroBtns}>
            <Link to="/register" className={styles.btnPrimary}>Start Earning Points</Link>
            <Link to="/login" className={styles.btnOutline}>I have an account</Link>
          </div>
          <div className={styles.heroStats}>
            <div><strong>12,400+</strong><span>Members</span></div>
            <div><strong>3,200+</strong><span>Tasks Done</span></div>
            <div><strong>850+</strong><span>Trees Planted</span></div>
          </div>
        </motion.div>
        <motion.div
          className={styles.heroVisual}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className={styles.earthEmoji}>🌍</div>
        </motion.div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2>How It Works</h2>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Ready to make a difference?</h2>
          <p>Join the Green Earth Initiative today and start your eco journey.</p>
          <Link to="/register" className={styles.btnPrimary}>Create Free Account</Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>🌍 Green Earth Initiative &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
