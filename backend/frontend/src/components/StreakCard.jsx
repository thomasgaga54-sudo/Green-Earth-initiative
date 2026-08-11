import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './StreakCard.module.css'

export default function StreakCard() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    axios.get('/api/streak').then(r => setData(r.data)).catch(() => {})
  }, [])

  if (!data) return null

  const { streakDays, milestones, lastSubmissionDate } = data

  // Check if streak is at risk (last submission was yesterday — still OK, or 2+ days ago — broken)
  const now = new Date()
  const last = lastSubmissionDate ? new Date(lastSubmissionDate) : null
  const daysSinceLast = last
    ? Math.floor((now.setHours(0,0,0,0) - new Date(last).setHours(0,0,0,0)) / 86400000)
    : null
  const streakAtRisk = daysSinceLast === 1  // haven't submitted today
  const streakBroken = daysSinceLast > 1

  // Next milestone
  const nextMilestone = milestones.find(m => !m.claimed)

  return (
    <div className={`${styles.card} ${streakBroken ? styles.broken : ''}`}>
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <div className={styles.left}>
          <div className={styles.flameWrap}>
            <span className={`${styles.flame} ${streakBroken ? styles.flameDead : streakAtRisk ? styles.flameWarn : ''}`}>
              🔥
            </span>
            <div className={styles.streakNum}>{streakDays}</div>
          </div>
          <div>
            <p className={styles.label}>DAY STREAK</p>
            <p className={styles.sub}>
              {streakBroken
                ? '💔 Streak broken — start again today!'
                : streakAtRisk
                  ? '⚠️ Complete a task today to keep your streak!'
                  : streakDays === 0
                    ? 'Complete a task to start your streak!'
                    : `Keep it up! You're on a ${streakDays}-day streak 🎉`
              }
            </p>
          </div>
        </div>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className={styles.body}>
          {/* Milestone track */}
          <div className={styles.track}>
            {milestones.map((m, i) => (
              <div key={m.days} className={styles.milestone}>
                {/* Connector line */}
                {i > 0 && (
                  <div className={`${styles.line} ${milestones[i-1].claimed ? styles.lineActive : ''}`} />
                )}
                <div className={`${styles.node} ${m.claimed ? styles.nodeDone : m.achieved ? styles.nodeReady : ''}`}>
                  {m.claimed ? '✅' : m.icon}
                </div>
                <div className={styles.mInfo}>
                  <span className={styles.mDays}>{m.days} days</span>
                  <span className={styles.mLabel}>{m.label}</span>
                  <span className={`${styles.mBonus} ${m.claimed ? styles.mBonusDone : ''}`}>
                    {m.claimed ? 'Earned!' : `+${m.bonus.toLocaleString()} pts`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next milestone hint */}
          {nextMilestone && !streakBroken && (
            <div className={styles.hint}>
              {streakDays < nextMilestone.days
                ? `🎯 ${nextMilestone.days - streakDays} more day${nextMilestone.days - streakDays !== 1 ? 's' : ''} until ${nextMilestone.icon} ${nextMilestone.label} (+${nextMilestone.bonus.toLocaleString()} pts)`
                : `${nextMilestone.icon} You've reached ${nextMilestone.label}! Bonus awarded automatically.`
              }
            </div>
          )}

          {milestones.every(m => m.claimed) && (
            <div className={styles.allDone}>
              🏆 All streak milestones completed! You're a true Green Earth Hero!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
