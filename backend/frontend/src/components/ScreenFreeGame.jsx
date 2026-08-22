import { useState } from 'react'
import axios from 'axios'
import styles from './ScreenFreeGame.module.css'

const ACTIVITIES = [
  {
    id: 'walk',
    icon: '🚶',
    label: 'Take a Walk Outside',
    desc: 'Step away from all screens and walk around your neighborhood, a park, or any outdoor space.',
    reflection: 'What did you notice around you that you usually miss when you\'re on a screen?',
    points: 20,
  },
  {
    id: 'explore',
    icon: '🌱',
    label: 'Observe Nature',
    desc: 'Spend time finding and looking closely at plants, insects, birds, or anything living in your surroundings.',
    reflection: 'Describe one living thing you found. What was it doing?',
    points: 20,
  },
  {
    id: 'clean',
    icon: '🧹',
    label: 'Care for Your Environment',
    desc: 'Pick up litter you find outside and dispose of it properly. Leave your space cleaner than you found it.',
    reflection: 'How did it feel to take care of a shared space?',
    points: 30,
  },
  {
    id: 'play',
    icon: '🏃',
    label: 'Move Your Body',
    desc: 'Play football, ride a bike, jump rope, garden, or do any physical activity without a screen.',
    reflection: 'What activity did you do, and how did your body feel afterwards?',
    points: 30,
  },
  {
    id: 'social',
    icon: '👨‍👩‍👧',
    label: 'Connect with People',
    desc: 'Have a real conversation, play a board game, cook together, or share a meal — all without screens.',
    reflection: 'Who did you connect with, and what did you talk about or do together?',
    points: 20,
  },
]

const TOTAL_POINTS = ACTIVITIES.reduce((s, a) => s + a.points, 0)

export default function ScreenFreeGame({ onClose, onComplete, token }) {
  const [step, setStep]                   = useState('intro')       // intro | checkin | reflect | done
  const [completed, setCompleted]         = useState(new Set())
  const [activeReflect, setActiveReflect] = useState(null)          // activity id being reflected on
  const [reflections, setReflections]     = useState({})            // id -> text
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState('')

  const earned = ACTIVITIES.filter(a => completed.has(a.id)).reduce((s, a) => s + a.points, 0)

  const toggleDone = (id) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openReflect = (id) => setActiveReflect(id)
  const closeReflect = () => setActiveReflect(null)
  const saveReflection = (id, text) => {
    setReflections(prev => ({ ...prev, [id]: text }))
    setActiveReflect(null)
  }

  const handleSubmit = async () => {
    if (completed.size === 0) { setError('Please mark at least one activity you actually did.'); return }
    setSubmitting(true)
    setError('')
    try {
      const lines = ACTIVITIES
        .filter(a => completed.has(a.id))
        .map(a => {
          const r = reflections[a.id]
          return `${a.icon} ${a.label}${r ? ` — "${r}"` : ''}`
        })
        .join(' | ')
      const note = `Screen-Free Outdoor Day. Activities completed: ${lines}. Points: ${earned}/${TOTAL_POINTS}.`
      await axios.post('/api/submit-screenfree', { note, earnedPoints: earned }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStep('done')
      onComplete && onComplete(earned)
    } catch (e) {
      setError(e.response?.data?.msg || 'Could not save your entry. Please try again.')
    }
    setSubmitting(false)
  }

  /* ── Reflection overlay ── */
  if (activeReflect) {
    const act = ACTIVITIES.find(a => a.id === activeReflect)
    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeReflect()}>
        <div className={styles.modal}>
          <div className={styles.reflectHeader}>
            <span className={styles.reflectIcon}>{act.icon}</span>
            <h3 className={styles.reflectTitle}>{act.label}</h3>
          </div>
          <div className={styles.reflectBody}>
            <p className={styles.reflectPrompt}>{act.reflection}</p>
            <textarea
              className={styles.reflectInput}
              placeholder="Write a few words — even one sentence is enough."
              defaultValue={reflections[act.id] || ''}
              id={`reflect-${act.id}`}
              rows={5}
              autoFocus
            />
            <div className={styles.reflectActions}>
              <button className={styles.skipBtn} onClick={closeReflect}>Skip for now</button>
              <button
                className={styles.saveBtn}
                onClick={() => {
                  const val = document.getElementById(`reflect-${act.id}`).value.trim()
                  saveReflection(act.id, val)
                }}
              >
                Save reflection
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Done screen ── */
  if (step === 'done') {
    const completedActs = ACTIVITIES.filter(a => completed.has(a.id))
    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          <div className={styles.doneHeader}>
            <span className={styles.doneLeaf}>🌿</span>
            <h2 className={styles.doneTitle}>Well done.</h2>
            <p className={styles.doneSubtitle}>
              You spent real time outdoors today. That's a habit worth building.
            </p>
          </div>
          <div className={styles.doneSummary}>
            <p className={styles.doneSummaryLabel}>What you did today</p>
            {completedActs.map(a => (
              <div key={a.id} className={styles.doneLine}>
                <span>{a.icon}</span>
                <span className={styles.doneLineText}>
                  {a.label}
                  {reflections[a.id] && (
                    <span className={styles.doneReflect}>"{reflections[a.id]}"</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.donePoints}>
            +{earned} eco points quietly added to your account.
          </p>
          <button className={styles.doneBtn} onClick={onClose}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  /* ── Intro screen ── */
  if (step === 'intro') {
    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal}>
          <button className={styles.closeX} onClick={onClose}>✕</button>
          <div className={styles.introWrap}>
            <span className={styles.introLeaf}>🌳</span>
            <h2 className={styles.introTitle}>Screen-Free Outdoor Day</h2>
            <p className={styles.introBody}>
              This isn't a game. It's a simple invitation to step outside, move your body,
              and pay attention to the world around you — without a screen.
            </p>
            <p className={styles.introBody}>
              When you come back, log what you actually did. There are no wrong answers
              and nothing to win — just a record of time well spent.
            </p>
            <div className={styles.introActivities}>
              {ACTIVITIES.map(a => (
                <div key={a.id} className={styles.introRow}>
                  <span className={styles.introIcon}>{a.icon}</span>
                  <span className={styles.introRowText}>{a.label}</span>
                </div>
              ))}
            </div>
            <button className={styles.beginBtn} onClick={() => setStep('checkin')}>
              I'm ready — show me the activities
            </button>
            <button className={styles.laterBtn} onClick={onClose}>Maybe later</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Check-in screen ── */
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.checkinHeader}>
          <button className={styles.closeX} onClick={onClose}>✕</button>
          <h2 className={styles.checkinTitle}>🌳 Screen-Free Outdoor Day</h2>
          <p className={styles.checkinSub}>
            Tick each activity you genuinely completed. Add a reflection if you'd like — it's for you, not a score.
          </p>
        </div>

        {/* Activity list */}
        <div className={styles.actList}>
          {ACTIVITIES.map(a => {
            const isDone = completed.has(a.id)
            const hasNote = !!reflections[a.id]
            return (
              <div key={a.id} className={`${styles.actRow} ${isDone ? styles.actDone : ''}`}>
                <button
                  className={styles.actCheck}
                  onClick={() => toggleDone(a.id)}
                  aria-label={isDone ? `Unmark ${a.label}` : `Mark ${a.label} as done`}
                >
                  {isDone ? '✅' : <span className={styles.emptyCheck} />}
                </button>
                <div className={styles.actInfo}>
                  <span className={styles.actIcon}>{a.icon}</span>
                  <div>
                    <p className={styles.actLabel}>{a.label}</p>
                    <p className={styles.actDesc}>{a.desc}</p>
                    {isDone && (
                      <button className={styles.reflectBtn} onClick={() => openReflect(a.id)}>
                        {hasNote ? `✏️ Edit reflection` : `💬 Add a reflection`}
                      </button>
                    )}
                    {hasNote && (
                      <p className={styles.previewNote}>"{reflections[a.id]}"</p>
                    )}
                  </div>
                </div>
                <span className={styles.actPts}>+{a.points}</span>
              </div>
            )
          })}
        </div>

        {completed.size > 0 && (
          <p className={styles.tally}>
            {completed.size} of {ACTIVITIES.length} activities · {earned} eco points
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.checkinFooter}>
          <button
            className={styles.logBtn}
            onClick={handleSubmit}
            disabled={submitting || completed.size === 0}
          >
            {submitting ? 'Saving...' : 'Log my outdoor time'}
          </button>
          <p className={styles.footerHint}>
            Only log what you actually did. Honest tracking is what makes this meaningful.
          </p>
        </div>
      </div>
    </div>
  )
}
