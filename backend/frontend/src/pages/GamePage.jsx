import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

export default function GamePage() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="Green Earth Initiative Game — Eco Gamification & Challenges"
        description="Green Earth Initiative is an eco gamification game where you complete real environmental challenges, earn points, level up, and win rewards. Join the game today."
        canonical="https://greenearthinitiative.online/game"
      />

      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>🌍 Green Earth Initiative</Link>
        <div className={styles.navLinks}>
          <Link to="/about" className={styles.navLink}>About</Link>
          <Link to="/how-it-works" className={styles.navLink}>How It Works</Link>
          <Link to="/eco-tasks" className={styles.navLink}>Eco Tasks</Link>
          <Link to="/rewards" className={styles.navLink}>Rewards</Link>
          <Link to="/register" className={styles.navCta}>Play Now</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <span className={styles.heroBadge}>🎮 Eco Gamification</span>
        <h1>The Green Earth Initiative Game</h1>
        <p>A real-world eco game where your environmental actions earn points, unlock levels, and win prizes.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>What Makes Green Earth Initiative a Game?</h2>
          <p>
            Unlike traditional games played on a screen, <strong>Green Earth Initiative</strong> is played in the
            real world. Your actions — planting a tree, picking up litter, saving water, completing an
            environmental quiz — are your moves. Every verified action earns you Green Points, the game's
            currency.
          </p>
          <p>
            The more you play, the more you level up, unlock streak bonuses, complete challenges, and climb
            the global leaderboard — all while making a genuine positive impact on the environment.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Game Features</h2>
          <div className={styles.grid}>
            {[
              { icon: '🌱', title: 'Level System', desc: 'Progress from Seedling (Level 1) all the way to Green Earth Hero (Level 5) as you earn more points.' },
              { icon: '🔥', title: 'Daily Streaks', desc: 'Complete a task every day to build your streak. Reach 7, 14, or 30 days for massive bonus points.' },
              { icon: '🌍', title: 'Daily Challenge', desc: 'A new featured challenge every day — complete it for 1.5× bonus points.' },
              { icon: '🏆', title: 'Leaderboard', desc: 'Compete with eco-warriors worldwide. See who is earning the most Green Points.' },
              { icon: '🎯', title: '7-Day Challenge', desc: 'Complete 7 specific eco tasks to claim a +200 bonus. A mini-campaign within the game.' },
              { icon: '📚', title: 'Quiz Challenges', desc: 'Test your environmental knowledge with quizzes. Auto-graded, instant points — no admin wait.' },
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
          <h2>The 5 Levels of Green Earth Initiative</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Level</th><th>Title</th><th>Points Range</th></tr>
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

        <div className={styles.ctaBox}>
          <h2>Play the Green Earth Initiative Game</h2>
          <p>Free to join. Real eco actions. Real rewards. Start your game today.</p>
          <Link to="/register" className={styles.ctaBtn}>🎮 Start Playing</Link>
          <Link to="/how-it-works" className={styles.ctaSecondary}>How it works →</Link>
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
