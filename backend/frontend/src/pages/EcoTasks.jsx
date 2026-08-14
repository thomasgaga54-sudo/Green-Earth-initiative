import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

const CATEGORIES = [
  { icon: '🌿', name: 'Environmental Tasks', desc: 'Plant trees, remove weeds, create a home garden, clean public areas, report illegal dumping, create a compost pile.', points: '20–100 pts' },
  { icon: '🏠', name: 'Domestic Chores', desc: 'Sweep the house, mop floors, clean the bathroom, wash clothes, help prepare a meal, clean household appliances.', points: '10–50 pts' },
  { icon: '💧', name: 'Water-Saving Tasks', desc: 'Turn off taps, repair leaking taps, take shorter showers, collect rainwater, reuse household water.', points: '10–50 pts' },
  { icon: '⚡', name: 'Energy-Saving Tasks', desc: 'Turn off unnecessary lights, unplug appliances, use natural light, reduce fan/AC usage, use solar lighting.', points: '10–40 pts' },
  { icon: '🚮', name: 'Waste Management', desc: 'Separate plastic waste, collect bottles for recycling, recycle paper, create useful things from waste, dispose of e-waste properly.', points: '20–100 pts' },
  { icon: '🌳', name: 'Community Tasks', desc: 'Clean your street, plant trees in community spaces, help maintain a community garden, organise an environmental awareness event.', points: '60–200 pts' },
  { icon: '👨‍👩‍👧‍👦', name: 'Family Challenges', desc: 'Help a parent with chores, clean the family compound, plant a family tree, complete a family cleanup challenge together.', points: '40–150 pts' },
  { icon: '🎓', name: 'School Tasks', desc: 'Clean your classroom, plant a school tree, create a recycling box, give an environmental presentation, start an eco club.', points: '20–150 pts' },
  { icon: '📚', name: 'Educational Quizzes', desc: 'Climate change quiz, recycling quiz, water-saving quiz, renewable energy, environmental safety, and more — auto-graded for instant points.', points: '20–40 pts' },
  { icon: '🏃', name: 'Healthy Living Tasks', desc: 'Walk instead of driving, complete 5,000 steps, ride a bicycle, spend 30 minutes outdoors, drink water instead of sugary drinks.', points: '15–40 pts' },
  { icon: '🧒', name: "Kids' Tasks", desc: 'Draw a save-the-Earth poster, water a plant every day, pick up litter, make a bird feeder, teach a friend about recycling.', points: '10–25 pts' },
  { icon: '🔥', name: 'Challenge Tasks', desc: 'Install rainwater harvesting, run a 30-day zero waste challenge, go car-free for a month, plant and harvest a vegetable garden.', points: '75–250 pts' },
]

export default function EcoTasks() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="Eco Tasks — 100+ Environmental Challenges | Green Earth Initiative"
        description="Browse 100+ eco-friendly tasks across 12 categories on Green Earth Initiative. Complete environmental tasks, submit photo proof, and earn Green Points for real rewards."
        canonical="https://greenearthinitiative.online/eco-tasks"
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
        <span className={styles.heroBadge}>🌱 100+ Tasks Available</span>
        <h1>Eco Tasks — Complete, Submit, Earn</h1>
        <p>From planting trees to educational quizzes — every eco action earns Green Points redeemable for real rewards.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>12 Task Categories</h2>
          <p>
            Green Earth Initiative features over 100 verified eco tasks across 12 categories — designed for
            individuals of all ages, families, students, and communities worldwide. Each task has a clear
            description, point value, and proof requirement.
          </p>
        </section>

        <div className={styles.grid}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{cat.desc}</p>
              <p style={{ marginTop: '0.5rem', fontWeight: 700, color: '#2e7d32', fontSize: '0.82rem' }}>
                {cat.points} per task
              </p>
            </div>
          ))}
        </div>

        <section className={styles.section}>
          <h2>How Task Verification Works</h2>
          <p>
            All photo-based task submissions are reviewed by a human administrator before points are awarded.
            This ensures every point earned represents a genuine, completed eco action.
          </p>
          <p>
            Higher-value tasks (50+ pts) require a detailed written description alongside your photo.
            Tasks worth 100+ pts are marked as <strong>Admin Verified</strong> and receive careful manual review.
          </p>
          <p>
            Educational quizzes are auto-graded — answer 3 out of 5 questions correctly to earn points
            instantly, with no admin review required.
          </p>
        </section>

        <div className={styles.ctaBox}>
          <h2>Start Completing Eco Tasks Today</h2>
          <p>Create a free account and access all 100+ tasks immediately. No payment required.</p>
          <Link to="/register" className={styles.ctaBtn}>Join for Free</Link>
          <Link to="/rewards" className={styles.ctaSecondary}>See rewards →</Link>
        </div>

        <div className={styles.internalLinks}>
          <p>EXPLORE MORE</p>
          <Link to="/about">About Us</Link>
          <Link to="/how-it-works">How It Works</Link>
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
