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

        <p className={styles.updated}>Last updated: July 2026 · Version 2.0</p>

        {/* ── SECTION 1 ── */}
        <div className={styles.card}>
          <h2>✅ 1. Acceptance of Terms</h2>
          <p>By accessing or using the Green Earth Initiative platform ("the Platform"), you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use the Platform.</p>
          <p style={{marginTop:'0.75rem'}}>These Terms constitute a legally binding agreement between you and Green Earth Initiative ("we", "us", "our"). We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes your acceptance.</p>
        </div>

        {/* ── SECTION 2 ── */}
        <div className={styles.card}>
          <h2>👤 2. Eligibility and Account Registration</h2>
          <ul>
            <li>You must be at least <strong>16 years of age</strong> to register an account independently.</li>
            <li>Users aged <strong>13–15</strong> may participate only with explicit written parental or guardian consent.</li>
            <li>Children under 13 are not permitted to register without a parent or guardian creating and managing the account on their behalf.</li>
            <li>You must provide accurate, current, and complete information when registering.</li>
            <li>One account per person is permitted. Creating multiple accounts to gain additional points or rewards constitutes fraud and will result in permanent suspension.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </div>

        {/* ── SECTION 3 ── */}
        <div className={styles.card}>
          <h2>🌱 3. Tasks and Submissions</h2>
          <ul>
            <li>Tasks must be completed genuinely and in the spirit of the environmental challenge described.</li>
            <li>All photographic proof submitted must be original, unedited, and taken by the submitting user during completion of the task.</li>
            <li>AI-generated images, stock photos, or photos taken by others are strictly prohibited and constitute fraud.</li>
            <li>You may submit each individual task only once per account.</li>
            <li>Submissions are reviewed by an administrator before points are awarded. We do not guarantee a specific review timeframe.</li>
            <li>We reserve the right to reject any submission that does not, in our sole judgment, meet the task requirements.</li>
            <li>Approved submissions are final. Points awarded following approval cannot be reversed except in cases of confirmed fraud.</li>
          </ul>
        </div>

        {/* ── SECTION 4 — PAYOUT RULES (COMPREHENSIVE) ── */}
        <div className={styles.card}>
          <h2>💰 4. Points, Rewards, and Payout Rules</h2>

          <h3 style={{color:'#2e7d32', margin:'1rem 0 0.5rem', fontSize:'1rem'}}>4.1 Nature of Points</h3>
          <ul>
            <li>Points are a <strong>non-monetary, virtual reward</strong> awarded solely for approved eco task completions.</li>
            <li>Points have <strong>no cash value</strong> and cannot under any circumstances be exchanged, redeemed, or converted into cash, cryptocurrency, or any other form of legal tender.</li>
            <li>Points are non-transferable between accounts and expire if an account is inactive for more than <strong>12 consecutive months</strong>.</li>
          </ul>

          <h3 style={{color:'#2e7d32', margin:'1rem 0 0.5rem', fontSize:'1rem'}}>4.2 Rewards and Redemption</h3>
          <ul>
            <li>Points may be redeemed for non-cash rewards including but not limited to: eco-friendly merchandise, discount vouchers for partner organisations, and digital badges.</li>
            <li>All rewards are subject to availability and may be changed, withdrawn, or substituted at our sole discretion without prior notice.</li>
            <li>Rewards have no guaranteed monetary value and are provided on a best-efforts basis.</li>
            <li>Minimum redemption thresholds apply and will be displayed in the rewards section of the Platform.</li>
            <li>Redemptions are processed within <strong>14–28 business days</strong>. We are not liable for delays caused by third-party suppliers.</li>
            <li>We reserve the right to cancel a redemption if fraud is detected before fulfilment.</li>
          </ul>

          <h3 style={{color:'#2e7d32', margin:'1rem 0 0.5rem', fontSize:'1rem'}}>4.3 No Gambling or Prize Draws</h3>
          <ul>
            <li>This Platform does not operate as a gambling service, lottery, prize draw, or sweepstake.</li>
            <li>No element of chance determines the award of points — points are earned solely through verified task completion.</li>
            <li>No purchase is required to participate. The Platform is free to join and use.</li>
          </ul>

          <h3 style={{color:'#2e7d32', margin:'1rem 0 0.5rem', fontSize:'1rem'}}>4.4 Tax Obligations</h3>
          <ul>
            <li>In certain jurisdictions, rewards received through promotional platforms may be considered taxable income or benefits in kind.</li>
            <li><strong>You are solely responsible</strong> for determining and fulfilling any tax obligations that may arise from rewards received through this Platform in your country of residence.</li>
            <li>We are not responsible for advising on, collecting, or remitting any taxes on your behalf.</li>
            <li>Where required by applicable law, we may be obligated to report reward distributions to relevant tax authorities. By using the Platform, you consent to such reporting.</li>
            <li>Users in the United States should note that rewards with a fair market value exceeding <strong>$600 USD</strong> in a calendar year may require us to issue a Form 1099 or equivalent reporting document.</li>
            <li>Users in the United Kingdom should note that rewards may be subject to Income Tax if received in connection with employment or a trade. HMRC guidance should be consulted.</li>
            <li>Users in the European Union should be aware that reward programmes may be subject to VAT and consumer protection regulations under the EU Digital Services Act and applicable national law.</li>
            <li>Users in other jurisdictions are responsible for complying with their local laws regarding promotional rewards and prize taxation.</li>
          </ul>

          <h3 style={{color:'#2e7d32', margin:'1rem 0 0.5rem', fontSize:'1rem'}}>4.5 Forfeiture of Points and Rewards</h3>
          <ul>
            <li>Points and pending rewards will be immediately forfeited if your account is suspended or terminated for fraud, abuse, or violation of these Terms.</li>
            <li>Points earned through fraudulent submissions will be clawed back, and pending reward redemptions will be cancelled.</li>
            <li>We reserve the right to conduct retrospective audits and adjust point balances where fraudulent activity is identified.</li>
          </ul>
        </div>

        {/* ── SECTION 5 ── */}
        <div className={styles.card}>
          <h2>🧒 5. Children's Use and COPPA / GDPR-K Compliance</h2>
          <ul>
            <li>We are committed to compliance with the <strong>Children's Online Privacy Protection Act (COPPA)</strong> for US users under 13 and <strong>GDPR for children</strong> for EU/UK users under 16.</li>
            <li>Children under 13 must have a parent or guardian register on their behalf. We do not knowingly collect personal data from children under 13 without verifiable parental consent.</li>
            <li>Parents may request deletion of their child's account and all associated data by contacting <a href="mailto:admin@greenearth.com">admin@greenearth.com</a>.</li>
            <li>Children's task submissions are subject to additional review. Photos submitted by or on behalf of children must not contain identifying information (e.g. faces, school names, home addresses).</li>
            <li>All children's tasks are designed to be completed under adult supervision. Green Earth Initiative accepts no liability for unsupervised activities.</li>
          </ul>
        </div>

        {/* ── SECTION 6 ── */}
        <div className={styles.card}>
          <h2>📷 6. User-Generated Content</h2>
          <ul>
            <li>By submitting photos or written content, you grant Green Earth Initiative a worldwide, royalty-free, non-exclusive licence to use, display, and reproduce that content on the Platform and in promotional materials.</li>
            <li>You confirm that you own or have the legal right to use any content you submit, and that it does not infringe any third-party rights.</li>
            <li>Content must not contain faces of individuals without their explicit consent, especially children.</li>
            <li>Content must not contain offensive, harmful, defamatory, or inappropriate material.</li>
            <li>We may remove any content that violates these Terms without notice.</li>
          </ul>
        </div>

        {/* ── SECTION 7 ── */}
        <div className={styles.card}>
          <h2>🚫 7. Prohibited Conduct and Fraud Prevention</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit false, fabricated, AI-generated, or duplicate task completions.</li>
            <li>Create multiple accounts to circumvent per-account submission limits.</li>
            <li>Use automated scripts, bots, or any software to interact with the Platform or earn points.</li>
            <li>Manipulate, exploit, or attempt to reverse-engineer the points or rewards system.</li>
            <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
            <li>Harass, threaten, or abuse other users or administrators.</li>
            <li>Impersonate another person, organisation, or entity.</li>
            <li>Post spam, advertisements, malicious links, or irrelevant content.</li>
          </ul>
          <p style={{marginTop:'0.75rem'}}>Violations will result in immediate account suspension, forfeiture of all points and rewards, and may be reported to relevant authorities where required by law.</p>
          <p style={{marginTop:'0.5rem'}}>We employ automated fraud detection systems including IP tracking, submission rate monitoring, and duplicate account detection. Flagged accounts are reviewed by administrators before suspension.</p>
        </div>

        {/* ── SECTION 8 ── */}
        <div className={styles.card}>
          <h2>🌍 8. Applicable Law and Jurisdiction</h2>
          <ul>
            <li>These Terms are governed by and construed in accordance with the laws of <strong>England and Wales</strong>, without regard to conflict of law principles.</li>
            <li>Users in the <strong>European Union</strong> retain all rights afforded under EU consumer protection law, including the EU Consumer Rights Directive and GDPR.</li>
            <li>Users in the <strong>United States</strong> agree to binding arbitration for disputes, waiving the right to a jury trial, except where prohibited by law.</li>
            <li>Users in <strong>Australia</strong> are protected by the Australian Consumer Law (ACL) and nothing in these Terms limits those statutory rights.</li>
            <li>We make no representation that the Platform is appropriate or available for use in all jurisdictions. Users access the Platform at their own risk and are responsible for compliance with local laws.</li>
          </ul>
        </div>

        {/* ── SECTION 9 ── */}
        <div className={styles.card}>
          <h2>🛡️ 9. Data Protection and GDPR Compliance</h2>
          <ul>
            <li>We process personal data in accordance with our <Link to="/privacy">Privacy Policy</Link> and applicable data protection law including the <strong>UK GDPR</strong>, <strong>EU GDPR</strong>, and <strong>CCPA</strong> (California).</li>
            <li>You have the right to access, rectify, erase, restrict, and port your personal data. Requests should be directed to <a href="mailto:admin@greenearth.com">admin@greenearth.com</a>.</li>
            <li>We do not sell personal data to third parties.</li>
            <li>Data is retained for as long as your account is active. Upon account deletion, personal data is removed within 30 days except where retention is required by law.</li>
          </ul>
        </div>

        {/* ── SECTION 10 ── */}
        <div className={styles.card}>
          <h2>⚖️ 10. Disclaimer of Warranties</h2>
          <p>The Platform is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted, error-free, or secure access to the Platform.</p>
        </div>

        {/* ── SECTION 11 ── */}
        <div className={styles.card}>
          <h2>🔒 11. Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law, Green Earth Initiative shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of data, loss of points, personal injury, or property damage.</p>
          <p style={{marginTop:'0.75rem'}}>Our total liability to you for any claims arising under these Terms shall not exceed the value of rewards actually received by you in the 12 months preceding the claim.</p>
          <p style={{marginTop:'0.75rem'}}>Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.</p>
        </div>

        {/* ── SECTION 12 ── */}
        <div className={styles.card}>
          <h2>📬 12. Contact and Complaints</h2>
          <p>For questions, complaints, data requests, or reward enquiries:</p>
          <ul>
            <li>Email: <a href="mailto:admin@greenearth.com">admin@greenearth.com</a></li>
            <li>Response time: within 5 business days</li>
            <li>Platform: <a href="https://green-earth-initiative-f04d.onrender.com" target="_blank" rel="noopener noreferrer">green-earth-initiative-f04d.onrender.com</a></li>
          </ul>
          <p style={{marginTop:'0.75rem'}}>EU users have the right to lodge a complaint with their national data protection supervisory authority. UK users may contact the ICO at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>
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
