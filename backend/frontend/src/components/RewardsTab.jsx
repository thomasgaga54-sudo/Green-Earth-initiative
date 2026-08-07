import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './RewardsTab.module.css'

const REGIONS = ['All', 'United Kingdom', 'United States', 'Brazil', 'South Africa', 'Europe', 'Nigeria', 'Ghana', 'Kenya', 'Global']

export default function RewardsTab({ currentUser, onPointsUpdate }) {
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('catalogue')
  const [regionFilter, setRegionFilter] = useState('All')

  useEffect(() => {
    axios.get('/api/rewards').then(r => setRewards(r.data)).catch(() => {})
    axios.get('/api/my-redemptions').then(r => setRedemptions(r.data)).catch(() => {})
  }, [])

  const filteredRewards = regionFilter === 'All'
    ? rewards
    : rewards.filter(r => r.region === regionFilter)
  const handleRedeem = async () => {
    if (!deliveryInfo.trim()) { setError('Please enter your email or delivery address.'); return }
    setLoading(true); setError(''); setMsg('')
    try {
      const { data } = await axios.post(`/api/rewards/${selected._id}/redeem`, { deliveryInfo })
      setMsg(data.msg)
      onPointsUpdate(data.remainingPoints)
      setSelected(null)
      setDeliveryInfo('')
      const r = await axios.get('/api/my-redemptions')
      setRedemptions(r.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Redemption failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categoryIcon = c => ({ voucher: '🎟️', merchandise: '🎁', digital: '💎' }[c] || '🎁')

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.pointsInfo}>
          <span className={styles.pointsNum}>{currentUser.points || 0}</span>
          <span className={styles.pointsLabel}>pts available</span>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.toggleBtn} ${view === 'catalogue' ? styles.active : ''}`} onClick={() => setView('catalogue')}>🎁 Rewards</button>
          <button className={`${styles.toggleBtn} ${view === 'history' ? styles.active : ''}`} onClick={() => setView('history')}>📦 My Redemptions</button>
        </div>
      </div>

      {msg && <div className={styles.success}>{msg}</div>}

      {view === 'catalogue' && (
        <>
          <p className={styles.hint}>Redeem your points for global rewards — available in every country. Points are deducted instantly on redemption.</p>

          <div className={styles.grid}>
            {rewards.map(reward => {
              const canAfford = (currentUser.points || 0) >= reward.pointsCost
              return (
                <div key={reward._id} className={`${styles.card} ${!canAfford ? styles.locked : ''}`}>
                  {reward.imageUrl && <img src={reward.imageUrl} alt={reward.title} className={styles.cardImg} />}
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardFlag}>{reward.flag}</span>
                      <span className={styles.cardRegion}>{reward.region}</span>
                      <span className={styles.cardCurrency}>{reward.currency}</span>
                    </div>
                    <div className={styles.cardCategory}>{categoryIcon(reward.category)} {reward.category}</div>
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cost}>{reward.pointsCost} pts</span>
                      <button
                        className={styles.redeemBtn}
                        onClick={() => { setSelected(reward); setError(''); setDeliveryInfo('') }}
                        disabled={!canAfford}
                      >
                        {canAfford ? 'Redeem' : `Need ${reward.pointsCost - (currentUser.points || 0)} more pts`}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {rewards.length === 0 && <div className={styles.empty}>No rewards available yet. Check back soon!</div>}
          </div>
        </>
      )}

      {view === 'history' && (
        <div className={styles.historyList}>
          {redemptions.length === 0
            ? <div className={styles.empty}>You haven't redeemed any rewards yet.</div>
            : redemptions.map(r => (
              <div key={r._id} className={styles.historyRow}>
                <div className={styles.historyInfo}>
                  <p className={styles.historyTitle}>{r.rewardId?.title || 'Reward'}</p>
                  <p className={styles.historyDate}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  {r.fulfilmentNote && <p className={styles.fulfilmentNote}>📩 {r.fulfilmentNote}</p>}
                </div>
                <div className={styles.historyRight}>
                  <span className={styles.historyPoints}>-{r.pointsSpent} pts</span>
                  <span className={`${styles.historyStatus} ${styles[r.status]}`}>
                    {r.status === 'pending' && '⏳ Processing'}
                    {r.status === 'fulfilled' && '✅ Fulfilled'}
                    {r.status === 'cancelled' && '❌ Cancelled'}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {selected && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{selected.flag} Redeem: {selected.title}</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            <p className={styles.modalDesc}>{selected.description}</p>
            <div className={styles.modalCost}>
              <span>Points required:</span>
              <strong>{selected.pointsCost} pts</strong>
            </div>
            <div className={styles.modalCost}>
              <span>Your balance after:</span>
              <strong>{(currentUser.points || 0) - selected.pointsCost} pts</strong>
            </div>
            <div className={styles.field}>
              <label>
                {selected.category === 'merchandise' ? '📦 Delivery Address' : '📧 Email Address for eVoucher'}
              </label>
              <input
                type="text"
                placeholder={selected.category === 'merchandise' ? 'Your full postal address' : 'your@email.com'}
                value={deliveryInfo}
                onChange={e => setDeliveryInfo(e.target.value)}
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <p className={styles.modalHint}>⏱ eVoucher codes are delivered by email within 14–28 business days. Points are deducted immediately on confirmation.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleRedeem} disabled={loading}>
                {loading ? 'Processing...' : `Confirm — ${selected.pointsCost} pts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
