import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

export default function About() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="About Green Earth Initiative — Eco Gamification Platform"
        description="Learn about Green Earth Initiative — the eco gamification platform that rewards people for completing real environmental tasks. Our mission, vision, and how we work."
        canonical="https://greenearthinitiative.online/about"
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
        <span className={styles.heroBadge}>🌿 Our Story</span>
        <h1>About Green Earth Initiative</h1>
        <p>A global platform turning everyday environmental actions into rewards — and real change.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>What is Green Earth Initiative?</h2>
          <p>
            <strong>Green Earth Initiative</strong> is an interactive eco-friendly rewards platform that motivates
            individuals, families, students, and communities to take positive environmental action every day.
            Members complete verified eco tasks — from planting trees and picking up litter to saving water and
            running community cleanups — and earn <strong>Green Points</strong> that can be redeemed for real rewards.
          </p>
          <p>
            We believe that environmental change starts at home, in schools, and in communities. By turning
            sustainable habits into a rewarding game, we make it easier — and more fun — for people everywhere
            to live greener lives.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Our Mission</h2>
          <p>
            To empower people worldwide to take meaningful environmental action by making eco-friendly
            activities engaging, measurable, and rewarding. Green Earth Initiative bridges the gap between
            good intentions and consistent action.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Why We Built This</h2>
          <p>
            Climate change, pollution, and environmental degradation are global problems — but they require
            local solutions. Most people want to help but don't know where to start, or feel that individual
            actions don't matter. Green Earth Initiative was built to change that narrative.
          </p>
          <p>
            By providing a structured, gamified system of eco tasks, points, streaks, levels, and rewards, we
            give everyone a clear, tangible way to contribute — and see the results of their actions.
          </p>
        </section>

        <div className={styles.grid}>
          {[
            { icon: '🌍', title: 'Global Impact', desc: 'Members from over 50 countries completing real environmental tasks every day.' },
            { icon: '🎁', title: 'Real Rewards', desc: 'Green Points redeemable for vouchers, merchandise, and digital rewards worldwide.' },
            { icon: '📚', title: 'Education First', desc: 'Environmental quizzes and educational challenges alongside physical tasks.' },
            { icon: '👨‍👩‍👧‍👦', title: 'Community Driven', desc: 'Family challenges, school tasks, and community cleanups for collective impact.' },
          ].map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaBox}>
          <h2>Join the Green Earth Initiative</h2>
          <p>Start earning points for your eco actions today. Free to join, available worldwide.</p>
          <Link to="/register" className={styles.ctaBtn}>Create Free Account</Link>
          <Link to="/how-it-works" className={styles.ctaSecondary}>How it works →</Link>
        </div>

        <div className={styles.internalLinks}>
          <p>EXPLORE MORE</p>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/eco-tasks">Eco Tasks</Link>
          <Link to="/rewards">Rewards</Link>
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
