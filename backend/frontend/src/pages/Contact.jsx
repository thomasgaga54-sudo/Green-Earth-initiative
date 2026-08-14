import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import styles from './PublicPage.module.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Opens the user's mail client with pre-filled content
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    const subject = encodeURIComponent(form.subject || 'Green Earth Initiative Enquiry')
    window.location.href = `mailto:admin@greenearthinitiative.online?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title="Contact Us — Green Earth Initiative"
        description="Get in touch with the Green Earth Initiative team. Questions about eco tasks, rewards, your account, or partnerships — we're here to help."
        canonical="https://greenearthinitiative.online/contact"
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
        <span className={styles.heroBadge}>📬 Get In Touch</span>
        <h1>Contact Green Earth Initiative</h1>
        <p>Questions, feedback, partnership enquiries, or reward support — we're here to help.</p>
      </header>

      <main className={styles.content}>

        <section className={styles.section}>
          <h2>Send Us a Message</h2>
          {sent ? (
            <div className={styles.successMsg}>
              ✅ Your message has been prepared. Your email client should open shortly.
              If it doesn't, email us directly at <a href="mailto:admin@greenearthinitiative.online">admin@greenearthinitiative.online</a>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Your Name</label>
                <input id="name" type="text" required placeholder="John Smith"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input id="subject" type="text" placeholder="e.g. Reward redemption enquiry"
                  value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea id="message" rows={5} required placeholder="Describe your question or issue..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button type="submit" className={styles.submitBtn}>Send Message →</button>
            </form>
          )}
        </section>

        <section className={styles.section}>
          <h2>Other Ways to Reach Us</h2>
          <div className={styles.grid}>
            {[
              { icon: '📧', title: 'Email', desc: 'admin@greenearthinitiative.online — we aim to respond within 5 business days.' },
              { icon: '🌐', title: 'Website', desc: 'greenearthinitiative.online — browse, register, or log in to access your dashboard.' },
              { icon: '⏱️', title: 'Response Time', desc: 'We typically respond to all enquiries within 5 business days.' },
            ].map((item, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.internalLinks}>
          <p>EXPLORE MORE</p>
          <Link to="/about">About Us</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/eco-tasks">Eco Tasks</Link>
          <Link to="/rewards">Rewards</Link>
          <Link to="/privacy">Privacy Policy</Link>
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
