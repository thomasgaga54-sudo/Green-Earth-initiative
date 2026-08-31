import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './RewardsTab.module.css'

// Extract dollar amount from title e.g. "$5 PayPal Cash" → "$5"
const getDollarValue = (title) => {
  const m = title.match(/\$[\d,]+/)
  return m ? m[0] : null
}

export default function RewardsTab({ currentUser, onPointsUpdate }) {
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('catalogue')

  useEffect(() => {
    axios.get('/api/rewards').then(r => setRewards(r.data)).catch(() => {})
    axios.get('/api/my-redemptions').then(r => setRedemptions(r.data)).catch(() => {})
  }, [])

  const handleRedeem = async () => {
    if (!paypalEmail.trim()) { setError('Please enter your PayPal email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) { setError('Please enter a valid email address.'); return }
    setLoading(true); setError(''); setMsg('')
    try {
      const { data } = await axios.post(`/api/rewards/${selected._id}/redeem`, { deliveryInfo: paypalEmail })
      setMsg(data.msg)
      onPointsUpdate(data.remainingPoints)
      setSelected(null)
      setPaypalEmail('')
      const r = await axios.get('/api/my-redemptions')
      setRedemptions(r.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Redemption failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const userPoints = currentUser.points || 0

  return (
    <div className={styles.wrap}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.pointsInfo}>
          <span className={styles.pointsNum}>{userPoints}</span>
          <span className={styles.pointsLabel}>pts available</span>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.toggleBtn} ${view === 'catalogue' ? styles.active : ''}`} onClick={() => setView('catalogue')}>💵 Cash Rewards</button>
          <button className={`${styles.toggleBtn} ${view === 'history' ? styles.active : ''}`} onClick={() => setView('history')}>📦 My Redemptions</button>
        </div>
      </div>

      {msg && <div className={styles.success}>{msg}</div>}

      {/* Rate banner */}
      {view === 'catalogue' && (
        <div className={styles.rateBanner}>
          <span className={styles.rateIcon}>💱</span>
          <span><strong>100 points = $1</strong> — paid directly to your PayPal account within 24–48 hours</span>
        </div>
      )}

      {/* Catalogue */}
      {view === 'catalogue' && (
        <div className={styles.paypalGrid}>
          {rewards.map(reward => {
            const canAfford = userPoints >= reward.pointsCost
            const dollarVal = getDollarValue(reward.title)
            const needed = reward.pointsCost - userPoints
            return (
              <div
                key={reward._id}
                className={`${styles.paypalCard} ${!canAfford ? styles.locked : ''}`}
                onClick={() => canAfford && (setSelected(reward), setError(''), setPaypalEmail(''))}
              >
                {/* Dollar value — the hero element */}
                <div className={styles.dollarBadge}>{dollarVal || reward.title}</div>
                <div className={styles.ptsCost}>{reward.pointsCost.toLocaleString()} pts</div>
                <div className={styles.paypalLabel}>💳 PayPal Transfer</div>
                {canAfford
                  ? <button className={styles.redeemBtn} onClick={() => { setSelected(reward); setError(''); setPaypalEmail('') }}>Redeem Now</button>
                  : <div className={styles.lockedMsg}>Need {needed.toLocaleString()} more pts</div>
                }
              </div>
            )
          })}
          {rewards.length === 0 && <div className={styles.empty}>No rewards available yet. Check back soon!</div>}
        </div>
      )}

      {/* Redemption history */}
      {view === 'history' && (
        <div className={styles.historyList}>
          {redemptions.length === 0
            ? <div className={styles.empty}>You haven't redeemed any rewards yet.</div>
            : redemptions.map(r => (
              <div key={r._id} className={styles.historyRow}>
                <div className={styles.historyInfo}>
                  <p className={styles.historyTitle}>{r.rewardId?.title || 'Reward'}</p>
                  <p className={styles.historyDate}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  <p className={styles.historyPaypal}>📧 PayPal: {r.deliveryInfo}</p>
                  {r.fulfilmentNote && <p className={styles.fulfilmentNote}>📩 {r.fulfilmentNote}</p>}
                </div>
                <div className={styles.historyRight}>
                  <span className={styles.historyPoints}>-{r.pointsSpent} pts</span>
                  <span className={`${styles.historyStatus} ${styles[r.status]}`}>
                    {r.status === 'pending'   && '⏳ Processing'}
                    {r.status === 'fulfilled' && '✅ Paid'}
                    {r.status === 'cancelled' && '❌ Cancelled'}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Redemption modal */}
      {selected && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>💵 Redeem for {getDollarValue(selected.title) || selected.title}</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Summary */}
            <div className={styles.modalSummary}>
              <div className={styles.modalSumRow}>
                <span>You receive</span>
                <strong className={styles.modalDollar}>{getDollarValue(selected.title) || selected.title}</strong>
              </div>
              <div className={styles.modalSumRow}>
                <span>Points spent</span>
                <strong>{selected.pointsCost.toLocaleString()} pts</strong>
              </div>
              <div className={styles.modalSumRow}>
                <span>Balance after</span>
                <strong>{(userPoints - selected.pointsCost).toLocaleString()} pts</strong>
              </div>
            </div>

            {/* PayPal email */}
            <div className={styles.field}>
              <label>💳 Your PayPal Email Address</label>
              <input
                type="email"
                placeholder="your-paypal@email.com"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                autoFocus
              />
              <p className={styles.fieldHint}>Make sure this is your correct PayPal email. The payment will be sent here within 24–48 hours.</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleRedeem} disabled={loading}>
                {loading ? 'Processing...' : `Confirm — ${selected.pointsCost.toLocaleString()} pts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
