import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './DailyChallenge.module.css'

export default function DailyChallenge({ currentUser, onStartTask }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    axios.get('/api/daily-challenge')
      .then(r => setChallenge(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight - now
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setTimeLeft(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (loading) return null
  if (!challenge) return null

  const bonusPoints = Math.round((challenge.points || 0) * 1.5)
  const streak = currentUser?.streakDays || 0

  return (
    <div className={styles.card}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.pulse}>🌱</span>
          <span className={styles.title}>Today's Green Challenge</span>
          <span className={styles.dailyBadge}>DAILY</span>
        </div>
        <div className={styles.countdown}>
          <span className={styles.countdownIcon}>⏱</span>
          <span>Resets in <strong>{timeLeft}</strong></span>
        </div>
      </div>

      {/* Challenge body */}
      <div className={styles.body}>
        {challenge.imageUrl && (
          <img src={challenge.imageUrl} alt={challenge.title} className={styles.img} />
        )}
        <div className={styles.info}>
          <p className={styles.category}>
            {challenge.category?.toUpperCase()} CHALLENGE
          </p>
          <h2 className={styles.challengeTitle}>{challenge.title}</h2>
          <p className={styles.desc}>{challenge.description}</p>

          <div className={styles.rewardRow}>
            <div className={styles.rewardBox}>
              <span className={styles.rewardIcon}>⚡</span>
              <div>
                <span className={styles.rewardPts}>+{bonusPoints} pts</span>
                <span className={styles.rewardLabel}>Daily Bonus (1.5×)</span>
              </div>
            </div>
            <div className={styles.rewardBox}>
              <span className={styles.rewardIcon}>🔥</span>
              <div>
                <span className={styles.rewardPts}>{streak} day{streak !== 1 ? 's' : ''}</span>
                <span className={styles.rewardLabel}>Current streak</span>
              </div>
            </div>
          </div>

          <button
            className={styles.btn}
            onClick={() => onStartTask(challenge)}
          >
            {challenge.taskType === 'quiz' ? '📚 Take Quiz' : '📷 Accept Challenge'}
          </button>
        </div>
      </div>

      {streak >= 3 && (
        <div className={styles.streakBanner}>
          🔥 You're on a <strong>{streak}-day streak!</strong> Keep it up to earn bonus points!
        </div>
      )}
    </div>
  )
}
