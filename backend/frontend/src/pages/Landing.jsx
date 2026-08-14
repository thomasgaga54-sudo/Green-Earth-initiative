import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Landing.module.css'

const features = [
  { icon: '🌱', title: 'Complete Eco Tasks', desc: 'Plant trees, reduce waste, save energy — earn points for real environmental actions in your community.' },
  { icon: '🏆', title: 'Climb the Leaderboard', desc: 'Compete with eco-warriors worldwide and rise through achievement levels from Seedling to Green Earth Hero.' },
  { icon: '🎁', title: 'Earn Real Rewards', desc: 'Redeem your green points for eVouchers, merchandise, and exclusive perks delivered to your door.' },
  { icon: '📚', title: 'Learn & Grow', desc: 'Complete environmental quizzes, daily challenges, and 7-day streaks to deepen your eco knowledge.' },
  { icon: '👨‍👩‍👧‍👦', title: 'Family & Community', desc: 'Take on family challenges, school tasks, and community cleanups together for bigger impact and bigger rewards.' },
  { icon: '🌍', title: 'Make a Real Impact', desc: 'Every task you complete — from picking up litter to planting a tree — creates measurable positive change.' },
]

export default function Landing() {
  const [stats, setStats] = useState({ members: null, tasksDone: null })

  useEffect(() => {
    axios.get('/api/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
  }, [])

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
          <h1>Green Earth Initiative —<br />Earn Rewards for Eco-Friendly Activities</h1>
          <p className={styles.heroDesc}>
            Complete eco-friendly tasks, earn green points, and make a positive impact on the environment.
            Green Earth Initiative helps people turn everyday environmental actions into rewarding activities
            — from planting trees and reducing plastic to saving water and teaching others to recycle.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/register" className={styles.btnPrimary}>Start Earning Points</Link>
            <Link to="/login" className={styles.btnOutline}>I have an account</Link>
          </div>
          <div className={styles.heroStats}>
            <div>
              <strong>{stats.members !== null ? stats.members.toLocaleString() : '—'}</strong>
              <span>Members</span>
            </div>
            <div>
              <strong>{stats.tasksDone !== null ? stats.tasksDone.toLocaleString() : '—'}</strong>
              <span>Tasks Completed</span>
            </div>
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

      {/* About — SEO rich text */}
      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <h2>What is Green Earth Initiative?</h2>
          <p>
            <strong>Green Earth Initiative</strong> is an interactive eco-friendly rewards platform that turns
            everyday environmental actions into points you can redeem for real rewards. Whether you're sweeping
            your street, planting a tree, reducing plastic use, or completing an environmental quiz — every
            action counts and every action earns.
          </p>
          <p>
            Our platform is designed for individuals, families, students, and communities who want to make a
            positive difference for the planet while being recognised and rewarded for their efforts.
            Join thousands of eco-warriors worldwide and start your green journey today.
          </p>
          <div className={styles.aboutPoints}>
            {[
              '🌱 100+ eco tasks across 12 categories',
              '🔥 Daily challenges with streak bonuses',
              '🏆 5-level achievement system from Seedling to Green Earth Hero',
              '🎁 Real rewards redeemable in 190+ countries',
              '📚 Environmental quizzes and educational challenges',
              '👨‍👩‍👧‍👦 Family and community group challenges',
            ].map((p, i) => (
              <div key={i} className={styles.aboutPoint}>{p}</div>
            ))}
          </div>
        </div>
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
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <p className={styles.footerLogo}>🌍 Green Earth Initiative</p>
            <p className={styles.footerTagline}>Turning eco-friendly actions into real rewards since 2024.</p>
          </div>
          <div className={styles.footerDesc}>
            <p>
              Green Earth Initiative is a global eco gamification platform helping individuals and communities
              earn rewards for completing environmental tasks — from recycling and tree planting to energy
              saving and community cleanups. Available worldwide.
            </p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>🌍 Green Earth Initiative &copy; {new Date().getFullYear()} · greenearthinitiative.online</p>
          <div className={styles.footerLinks}>
            <Link to="/privacy">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <span>·</span>
            <a href="mailto:admin@greenearth.com">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
