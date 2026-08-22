import { useState } from 'react'
import axios from 'axios'
import styles from './ScreenFreeGame.module.css'

const ACTIVITIES = [
  { id: 'walk',    icon: '🚶', label: 'WALK',   desc: 'Walk around your neighborhood or a safe outdoor area.',          points: 20 },
  { id: 'explore', icon: '🌱', label: 'EXPLORE',desc: 'Find 3 different plants in nature.',                             points: 20 },
  { id: 'clean',   icon: '🧹', label: 'CLEAN',  desc: 'Pick up safe litter and dispose of it properly.',                points: 30 },
  { id: 'play',    icon: '🏃', label: 'PLAY',   desc: 'Play football, jump rope, ride a bicycle, garden, or exercise.', points: 30 },
  { id: 'social',  icon: '👨‍👩‍👧', label: 'CONNECT',desc: 'Talk, play a board game, or have a picnic without screens.',   points: 20 },
]

const TOTAL_POINTS = ACTIVITIES.reduce((s, a) => s + a.points, 0)

export default function ScreenFreeGame({ onClose, onComplete, token }) {
  const [completed, setCompleted]   = useState(new Set())
  const [started, setStarted]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const earned     = ACTIVITIES.filter(a => completed.has(a.id)).reduce((s, a) => s + a.points, 0)
  const progress   = Math.round((earned / TOTAL_POINTS) * 100)
  const allDone    = completed.size === ACTIVITIES.length

  const toggle = (id) => {
    if (!started) return
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (completed.size === 0) { setError('Complete at least one activity first!'); return }
    setSubmitting(true)
    setError('')
    try {
      const completedList = ACTIVITIES.filter(a => completed.has(a.id)).map(a => `${a.icon} ${a.label} (+${a.points} pts)`).join(', ')
      const note = `Screen-Free Outdoor Day game completed. Activities: ${completedList}. Total earned: ${earned}/${TOTAL_POINTS} pts.`
      await axios.post('/api/submit-screenfree', { note, earnedPoints: earned }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDone(true)
      onComplete && onComplete(earned)
    } catch (e) {
      setError(e.response?.data?.msg || 'Submission failed. Try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          <div className={styles.badge}>🏆</div>
          <h2 className={styles.badgeTitle}>Screen-Free Eco Champion!</h2>
          <p className={styles.badgeDesc}>You earned <strong>{earned} Eco Points</strong> by completing real outdoor activities without a screen!</p>
          {allDone && <p className={styles.badgeFull}>🌟 Full completion! All activities done!</p>}
          <button className={styles.closeBtn} onClick={onClose}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.gameTag}>🎮 MINI GAME</span>
            <button className={styles.closeBtn2} onClick={onClose}>✕</button>
          </div>
          <h2 className={styles.title}>🌳 Screen-Free Outdoor Day</h2>
          <p className={styles.subtitle}>Put your phone away and earn up to <strong>{TOTAL_POINTS} Eco Points</strong> by completing outdoor activities!</p>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressLabel}>
            <span>Eco Day Progress</span>
            <span>{earned}/{TOTAL_POINTS} pts</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressPct}>{progress}%</div>
        </div>

        {/* Start banner */}
        {!started && (
          <div className={styles.startBanner}>
            <p>🌞 Ready to go screen-free? Put your phone away and start the challenge!</p>
            <button className={styles.startBtn} onClick={() => setStarted(true)}>
              🚀 Start the Challenge
            </button>
          </div>
        )}

        {/* Activity cards */}
        <div className={styles.cards}>
          {ACTIVITIES.map(a => {
            const isDone = completed.has(a.id)
            return (
              <button
                key={a.id}
                className={`${styles.card} ${isDone ? styles.cardDone : ''} ${!started ? styles.cardLocked : ''}`}
                onClick={() => toggle(a.id)}
                disabled={!started}
              >
                <span className={styles.cardIcon}>{a.icon}</span>
                <span className={styles.cardLabel}>{a.label}</span>
                <span className={styles.cardDesc}>{a.desc}</span>
                <span className={styles.cardPts}>+{a.points} pts</span>
                {isDone && <span className={styles.cardCheck}>✅</span>}
              </button>
            )
          })}
        </div>

        {allDone && (
          <div className={styles.allDoneBanner}>
            🌟 Amazing! You completed all outdoor activities! Submit to claim your <strong>Screen-Free Eco Champion 🏆</strong> badge!
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {started && (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || completed.size === 0}
          >
            {submitting ? '⏳ Submitting...' : `✅ Submit & Claim ${earned} Eco Points`}
          </button>
        )}

        <p className={styles.hint}>Tap each card when you've completed that activity outside.</p>
      </div>
    </div>
  )
}
