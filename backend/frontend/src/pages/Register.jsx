import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/register', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>🌍 Green Earth</Link>
        <h1>Join the movement</h1>
        <p className={styles.sub}>Create your free account and start earning</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input
              type="text" name="name" required
              placeholder="Jane Doe"
              value={form.name} onChange={handleChange}
            />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email" name="email" required
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password" name="password" required
              placeholder="Min. 6 characters"
              minLength={6}
              value={form.password} onChange={handleChange}
            />
          </div>
          <div className={styles.checkField}>
            <input type="checkbox" id="agree" required />
            <label htmlFor="agree">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </label>
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
