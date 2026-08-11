import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './SevenDayChallenge.module.css'

export default function SevenDayChallenge({ onPointsUpdate }) {
  const [data, setData] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState(true)

  const load = () => {
    axios.get('/api/seven-day-challenge')
      .then(r => setData(r.data))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const claimBonus = async () => {
    setClaiming(true)
    try {
      const { data: res } = await axios.post('/api/seven-day-challenge/claim-bonus')
      setMsg(res.msg)
      if (onPointsUpdate) onPointsUpdate()
      load()
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Failed to claim bonus.')
    } finally {
      setClaiming(false)
    }
  }

  if (!data) return null

  const { steps, completedSteps, bonusAwarded, allComplete } = data
  const doneCount = completedSteps.length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <div className={styles.headerLeft}>
          <span className={styles.globe}>🌍</span>
          <div>
            <p className={styles.label}>7-DAY CHALLENGE</p>
            <h3 className={styles.title}>Become a Green Champion</h3>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.progressCircle}>
            <svg viewBox="0 0 36 36" className={styles.svg}>
              <path
                className={styles.circleBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.circleProgress}
                strokeDasharray={`${pct}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={styles.circleText}>{doneCount}/{steps.length}</span>
          </div>
          <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <>
          {/* Progress bar */}
          <div className={styles.barWrap}>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.barLabel}>{pct}% complete</span>
          </div>

          {/* Steps checklist */}
          <ul className={styles.steps}>
            {steps.map(step => {
              const done = completedSteps.includes(step.key)
              return (
                <li key={step.key} className={`${styles.step} ${done ? styles.done : ''}`}>
                  <span className={styles.stepIcon}>{done ? '✅' : step.icon}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {done && <span className={styles.tick}>Done</span>}
                </li>
              )
            })}
          </ul>

          {/* Bonus section */}
          <div className={styles.bonus}>
            <div className={styles.bonusInfo}>
              <span className={styles.bonusIcon}>🏆</span>
              <div>
                <p className={styles.bonusTitle}>Complete all 7 steps</p>
                <p className={styles.bonusPts}>+200 Bonus Points</p>
              </div>
            </div>

            {bonusAwarded ? (
              <div className={styles.claimed}>🎉 Bonus Claimed!</div>
            ) : allComplete ? (
              <button className={styles.claimBtn} onClick={claimBonus} disabled={claiming}>
                {claiming ? '⏳ Claiming...' : '🏆 Claim +200 pts'}
              </button>
            ) : (
              <p className={styles.remaining}>
                {steps.length - doneCount} step{steps.length - doneCount !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}
        </>
      )}
    </div>
  )
}
