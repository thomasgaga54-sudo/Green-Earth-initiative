import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

export default function HowItWorks() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="How It Works — Green Earth Initiative Eco Rewards Platform"
        description="Learn how Green Earth Initiative works. Complete eco tasks, submit photo proof, earn Green Points, and redeem real rewards. Free to join, available worldwide."
        canonical="https://greenearthinitiative.online/how-it-works"
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
        <span className={styles.heroBadge}>🎯 Simple Process</span>
        <h1>How Green Earth Initiative Works</h1>
        <p>Four simple steps to start earning rewards for your eco-friendly actions.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>From Sign-Up to Reward in 4 Steps</h2>
          <div className={styles.steps}>
            {[
              { title: 'Create a Free Account', desc: 'Sign up for free at greenearthinitiative.online. No payment required. Available on any device — desktop, tablet, or mobile.' },
              { title: 'Browse & Choose an Eco Task', desc: 'Explore 100+ tasks across 12 categories — environmental, domestic, water-saving, energy, waste management, community, family challenges, school tasks, educational quizzes, and more.' },
              { title: 'Complete the Task & Submit Proof', desc: 'Complete your chosen task and submit a photo as proof. For educational quizzes, answer the questions directly in the app. Higher-value tasks require a detailed description alongside your photo.' },
              { title: 'Earn Points & Redeem Rewards', desc: 'Once your submission is approved by our admin team, Green Points are added to your balance. Redeem them for eVouchers, merchandise, and digital rewards — delivered worldwide.' },
            ].map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepBody}>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>The Points & Levels System</h2>
          <p>Every approved task earns you Green Points. As you accumulate points, you level up through five achievement tiers:</p>
          <table className={styles.table}>
            <thead>
              <tr><th>Level</th><th>Title</th><th>Points Required</th></tr>
            </thead>
            <tbody>
              {[
                ['1', '🌱 Seedling', '0 – 500 pts'],
                ['2', '🌿 Green Helper', '501 – 1,500 pts'],
                ['3', '🌳 Eco Guardian', '1,501 – 3,000 pts'],
                ['4', '🌍 Earth Champion', '3,001 – 5,000 pts'],
                ['5', '👑 Green Earth Hero', '5,001+ pts'],
              ].map(([l, t, p]) => (
                <tr key={l}><td>{l}</td><td>{t}</td><td>{p}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2>Daily Challenges & Streak Bonuses</h2>
          <p>
            Every day a new <strong>Daily Challenge</strong> is featured — completing it earns <strong>1.5× bonus points</strong>.
            Build a daily streak to unlock milestone bonuses:
          </p>
          <div className={styles.grid}>
            {[
              { icon: '🌱', title: '3-Day Streak', desc: '+50 bonus points' },
              { icon: '🔥', title: '7-Day Streak', desc: '+300 bonus points' },
              { icon: '🌿', title: '14-Day Streak', desc: '+700 bonus points' },
              { icon: '🌍', title: '30-Day Streak', desc: '+2,000 bonus points' },
            ].map((item, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.ctaBox}>
          <h2>Ready to Start?</h2>
          <p>Join thousands of eco-warriors earning rewards for making a difference. Free to join, no payment required.</p>
          <Link to="/register" className={styles.ctaBtn}>Create Free Account</Link>
          <Link to="/eco-tasks" className={styles.ctaSecondary}>See all tasks →</Link>
        </div>

        <div className={styles.internalLinks}>
          <p>EXPLORE MORE</p>
          <Link to="/about">About Us</Link>
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
