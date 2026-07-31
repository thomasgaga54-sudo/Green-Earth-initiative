import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>🌍 Green Earth</Link>
        <Link to="/" className={styles.backBtn}>← Back to Home</Link>
      </nav>

      <div className={styles.container}>
        <div className={styles.hero}>
          <span className={styles.badge}>🔒 Legal</span>
          <h1>Privacy Policy</h1>
          <p>How we collect, use, and protect your personal information.</p>
        </div>

        <p className={styles.updated}>Last updated: July 2026</p>

        <div className={styles.card}>
          <h2>📋 1. Information We Collect</h2>
          <p>When you register or use the Green Earth Initiative platform, we may collect the following information:</p>
          <ul>
            <li><strong>Account information:</strong> your name, email address, and password (stored securely as a hash).</li>
            <li><strong>Activity data:</strong> tasks you complete, points earned, and submissions uploaded.</li>
            <li><strong>Usage data:</strong> pages visited, time spent on the platform, and browser/device type.</li>
            <li><strong>Uploaded content:</strong> photos or images submitted as proof of completed tasks.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🎯 2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account on the platform.</li>
            <li>Track your eco task progress and award points.</li>
            <li>Display your name and points on the public leaderboard.</li>
            <li>Send you important account notifications (if email is configured).</li>
            <li>Improve the platform based on usage patterns.</li>
            <li>Ensure the security and integrity of the platform.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>👥 3. Sharing Your Information</h2>
          <p>We do not sell, rent, or trade your personal information to third parties. We may share limited data only in the following circumstances:</p>
          <ul>
            <li><strong>Leaderboard:</strong> your name and points are visible to other users on the public leaderboard.</li>
            <li><strong>Legal obligations:</strong> if required by law or to protect the rights and safety of our users.</li>
            <li><strong>Service providers:</strong> trusted third-party services (e.g. database hosting via MongoDB Atlas) that help us operate the platform, bound by confidentiality agreements.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🔐 4. Data Security</h2>
          <p>We take your data security seriously:</p>
          <ul>
            <li>Passwords are hashed using industry-standard bcrypt encryption and never stored in plain text.</li>
            <li>Authentication is handled via JSON Web Tokens (JWT) with expiry.</li>
            <li>All data is transmitted over HTTPS.</li>
            <li>Access to admin functions is restricted to authorised administrators only.</li>
          </ul>
          <p>However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but take all reasonable precautions.</p>
        </div>

        <div className={styles.card}>
          <h2>🧒 5. Children's Privacy</h2>
          <p>Green Earth Initiative includes tasks designed for children. We are committed to protecting children's privacy:</p>
          <ul>
            <li>Children under 13 must have parental or guardian consent before registering.</li>
            <li>We do not knowingly collect personal information from children under 13 without parental consent.</li>
            <li>Parents may contact us to request deletion of their child's account and data at any time.</li>
            <li>Children's submissions are reviewed by an administrator before being approved.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>🍪 6. Cookies and Local Storage</h2>
          <p>We use browser local storage (not cookies) to store your authentication token and session data. This data remains on your device and is used solely to keep you logged in. You can clear this at any time by logging out or clearing your browser storage.</p>
        </div>

        <div className={styles.card}>
          <h2>✏️ 7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent at any time by deleting your account.</li>
          </ul>
          <p>To exercise any of these rights, please contact us at <a href="mailto:admin@greenearth.com">admin@greenearth.com</a>.</p>
        </div>

        <div className={styles.card}>
          <h2>🔄 8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date at the top of this page. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </div>

        <div className={styles.card}>
          <h2>📬 9. Contact Us</h2>
          <p>If you have any questions or concerns about this Privacy Policy, please contact us:</p>
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
