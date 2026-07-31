import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Terms() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>🌍 Green Earth</Link>
        <Link to="/" className={styles.backBtn}>← Back to Home</Link>
      </nav>

      <div className={styles.container}>
        <div className={styles.hero}>
          <span className={styles.badge}>📄 Legal</span>
          <h1>Terms &amp; Conditions</h1>
          <p>Please read these terms carefully before using the platform.</p>
        </div>

        <p className={styles.updated}>Last updated: July 2026</p>

        <div className={styles.card}>
          <h2>✅ 1. Acceptance of Terms</h2>
          <p>By accessing or using the Green Earth Initiative platform ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the Platform.</p>
        </div>

        <div className={styles.card}>
          <h2>👤 2. Account Registration</h2>
          <ul>
            <li>You must provide accurate, current, and complete information when registering.</li>
            <li>You are responsible for maintaining the confidentiality of your password.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must notify us immediately of any unauthorised use of your account.</li>
            <li>One account per person is permitted. Duplicate accounts may be removed.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🌱 3. Platform Use and Tasks</h2>
          <ul>
            <li>Tasks on the Platform are designed to encourage genuine environmental actions.</li>
            <li>All task submissions must be honest and accurate. Fraudulent submissions are strictly prohibited.</li>
            <li>Submitted photos must be original and taken by you during the completion of the task.</li>
            <li>Points are awarded at the sole discretion of the Platform administrators.</li>
            <li>Approved submissions cannot be reversed once points have been awarded.</li>
            <li>The Platform reserves the right to reject any submission that does not meet task requirements.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🧒 4. Children's Use</h2>
          <ul>
            <li>Children's tasks are designed to be completed with adult supervision.</li>
            <li>Users under 13 years of age must have explicit parental or guardian consent to register.</li>
            <li>Parents and guardians are responsible for monitoring their child's activity on the Platform.</li>
            <li>The Platform is not liable for any unsupervised activities undertaken by children.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🏆 5. Points, Levels, and Rewards</h2>
          <ul>
            <li>Points are awarded for approved task completions only.</li>
            <li>Points have no monetary value and cannot be exchanged for cash.</li>
            <li>The Platform reserves the right to adjust, suspend, or terminate the points system at any time.</li>
            <li>Leaderboard rankings are updated in real time and are based solely on accumulated points.</li>
            <li>Any abuse of the points system (e.g. fake submissions) will result in account suspension.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>📷 6. User-Generated Content</h2>
          <ul>
            <li>By submitting photos or content, you grant Green Earth Initiative a non-exclusive, royalty-free licence to display that content on the Platform.</li>
            <li>You confirm that you own or have the right to use any content you submit.</li>
            <li>Content must not contain offensive, harmful, or inappropriate material.</li>
            <li>The Platform may remove any content that violates these terms without notice.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🚫 7. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit false, misleading, or fabricated task completions.</li>
            <li>Attempt to hack, disrupt, or gain unauthorised access to the Platform.</li>
            <li>Use automated scripts or bots to earn points or interact with the Platform.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Post spam, advertisements, or irrelevant content.</li>
            <li>Impersonate another person or entity.</li>
          </ul>
          <p>Violation of these rules may result in immediate account suspension or permanent ban.</p>
        </div>

        <div className={styles.card}>
          <h2>⚖️ 8. Disclaimer of Warranties</h2>
          <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee that the Platform will be available at all times, error-free, or free of viruses. We are not responsible for any harm resulting from the use of the Platform or completion of tasks.</p>
        </div>

        <div className={styles.card}>
          <h2>🛡️ 9. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Green Earth Initiative shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to personal injury, property damage, or loss of data.</p>
        </div>

        <div className={styles.card}>
          <h2>🔄 10. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms and Conditions at any time. Changes will be effective upon posting to the Platform. Continued use after changes are posted constitutes your acceptance of the revised terms.</p>
        </div>

        <div className={styles.card}>
          <h2>📬 11. Contact Us</h2>
          <p>If you have questions about these Terms and Conditions, please contact us:</p>
          <ul>
            <li>Email: <a href="mailto:admin@greenearth.com">admin@greenearth.com</a></li>
            <li>Platform: <a href="https://green-earth-initiative-f04d.onrender.com">green-earth-initiative-f04d.onrender.com</a></li>
          </ul>
        </div>

        <div className={styles.footer}>
          <p>🌍 Green Earth Initiative &copy; {new Date().getFullYear()}</p>
          <p>
            <Link to="/">Home</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
