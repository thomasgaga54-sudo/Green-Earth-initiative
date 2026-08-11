import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './ShopTab.module.css'

const PREMIUM_PERKS = [
  '⚡ 200 bonus points on activation',
  '🏅 Exclusive Premium badge on your profile',
  '🚀 Priority task approval',
  '🎁 Access to premium-only rewards',
  '💬 Early access to new features',
]

export default function ShopTab({ currentUser, onPointsUpdate }) {
  const [packages, setPackages] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(null) // tracks which button is loading
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState('points')

  useEffect(() => {
    axios.get('/api/payment/packages').then(r => setPackages(r.data)).catch(() => {})
    axios.get('/api/rewards').then(r => setRewards(r.data.filter(r => r.priceMoney > 0))).catch(() => {})
  }, [])

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const buyPoints = async (pkg) => {
    setLoading(pkg.id)
    try {
      const { data } = await axios.post('/api/payment/buy-points', { packageId: pkg.id })
      window.location.href = data.url
    } catch (err) {
      toast(err.response?.data?.msg || 'Payment failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const subscribe = async () => {
    setLoading('premium')
    try {
      const { data } = await axios.post('/api/payment/subscribe')
      window.location.href = data.url
    } catch (err) {
      toast(err.response?.data?.msg || 'Subscription failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const buyReward = async (reward) => {
    const deliveryInfo = prompt(
      reward.category === 'merchandise'
        ? 'Enter your delivery address:'
        : 'Enter your email address for the voucher:'
    )
    if (!deliveryInfo) return
    setLoading(reward._id)
    try {
      const { data } = await axios.post(`/api/payment/buy-reward/${reward._id}`, { deliveryInfo })
      window.location.href = data.url
    } catch (err) {
      toast(err.response?.data?.msg || 'Purchase failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className={styles.wrap}>
      {/* Section tabs */}
      <div className={styles.sectionTabs}>
        <button
          className={`${styles.sectionTab} ${activeSection === 'points' ? styles.active : ''}`}
          onClick={() => setActiveSection('points')}
        >
          ⚡ Buy Points
        </button>
        <button
          className={`${styles.sectionTab} ${activeSection === 'premium' ? styles.active : ''}`}
          onClick={() => setActiveSection('premium')}
        >
          👑 Premium
        </button>
        <button
          className={`${styles.sectionTab} ${activeSection === 'rewards' ? styles.active : ''}`}
          onClick={() => setActiveSection('rewards')}
        >
          🛍️ Buy Rewards
        </button>
      </div>

      {msg && <div className={styles.toast}>{msg}</div>}

      {/* ── A) Buy Points ── */}
      {activeSection === 'points' && (
        <div>
          <div className={styles.sectionHeader}>
            <h2>⚡ Top Up Your Points</h2>
            <p>Instantly add points to your balance and unlock more rewards.</p>
          </div>

          <div className={styles.currentBalance}>
            <span className={styles.balanceNum}>{currentUser.points || 0}</span>
            <span className={styles.balanceLabel}>current points balance</span>
          </div>

          <div className={styles.packagesGrid}>
            {packages.map(pkg => (
              <div key={pkg.id} className={`${styles.packageCard} ${pkg.id === 'points_1000' ? styles.popular : ''}`}>
                {pkg.id === 'points_1000' && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.packagePoints}>⚡ {pkg.points.toLocaleString()}</div>
                <div className={styles.packageLabel}>{pkg.label}</div>
                <div className={styles.packagePrice}>{formatPrice(pkg.price)}</div>
                <div className={styles.packageRate}>{(pkg.points / (pkg.price / 100)).toFixed(0)} pts / $1</div>
                <button
                  className={styles.buyBtn}
                  onClick={() => buyPoints(pkg)}
                  disabled={loading === pkg.id}
                >
                  {loading === pkg.id ? '⏳ Redirecting...' : `Buy ${pkg.points} pts`}
                </button>
              </div>
            ))}
          </div>

          <p className={styles.secureNote}>🔒 Secure payments via Stripe · All major cards accepted · Instant delivery</p>
        </div>
      )}

      {/* ── B) Premium Subscription ── */}
      {activeSection === 'premium' && (
        <div>
          <div className={styles.sectionHeader}>
            <h2>👑 Go Premium</h2>
            <p>Unlock the full Green Earth experience.</p>
          </div>

          <div className={styles.premiumCard}>
            <div className={styles.premiumHeader}>
              <div className={styles.premiumCrown}>👑</div>
              <div className={styles.premiumTitle}>Premium Member</div>
              <div className={styles.premiumPrice}>
                <span className={styles.premiumAmount}>$4.99</span>
                <span className={styles.premiumPer}>/month</span>
              </div>
            </div>

            {currentUser.isPremium ? (
              <div className={styles.premiumActive}>
                ✅ You are a Premium member!
                {currentUser.premiumUntil && (
                  <p>Renews: {new Date(currentUser.premiumUntil).toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <>
                <ul className={styles.perksList}>
                  {PREMIUM_PERKS.map((perk, i) => (
                    <li key={i} className={styles.perkItem}>{perk}</li>
                  ))}
                </ul>
                <button
                  className={styles.premiumBtn}
                  onClick={subscribe}
                  disabled={loading === 'premium'}
                >
                  {loading === 'premium' ? '⏳ Redirecting...' : '👑 Subscribe for $4.99/month'}
                </button>
                <p className={styles.cancelNote}>Cancel anytime · No hidden fees</p>
              </>
            )}
          </div>

          <p className={styles.secureNote}>🔒 Secure payments via Stripe · Recurring billing · Cancel anytime</p>
        </div>
      )}

      {/* ── C) Buy Rewards Directly ── */}
      {activeSection === 'rewards' && (
        <div>
          <div className={styles.sectionHeader}>
            <h2>🛍️ Buy Rewards Directly</h2>
            <p>Don't have enough points? Purchase rewards directly with real money.</p>
          </div>

          {rewards.length === 0 ? (
            <div className={styles.empty}>
              No rewards available for direct purchase yet. Check back soon, or earn points to redeem them for free!
            </div>
          ) : (
            <div className={styles.rewardsGrid}>
              {rewards.map(reward => (
                <div key={reward._id} className={styles.rewardCard}>
                  {reward.imageUrl && (
                    <img src={reward.imageUrl} alt={reward.title} className={styles.rewardImg} />
                  )}
                  <div className={styles.rewardBody}>
                    <div className={styles.rewardMeta}>
                      <span>{reward.flag}</span>
                      <span className={styles.rewardRegion}>{reward.region}</span>
                    </div>
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                    <div className={styles.rewardFooter}>
                      <div className={styles.rewardPricing}>
                        <span className={styles.rewardMoney}>{formatPrice(reward.priceMoney)}</span>
                        <span className={styles.rewardOr}>or</span>
                        <span className={styles.rewardPts}>{reward.pointsCost} pts</span>
                      </div>
                      <button
                        className={styles.buyRewardBtn}
                        onClick={() => buyReward(reward)}
                        disabled={loading === reward._id}
                      >
                        {loading === reward._id ? '⏳...' : `Buy — ${formatPrice(reward.priceMoney)}`}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={styles.secureNote}>🔒 Secure payments via Stripe · Fulfilled within 14–28 business days</p>
        </div>
      )}
    </div>
  )
}
