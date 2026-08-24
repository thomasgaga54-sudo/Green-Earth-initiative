import { useState, useRef } from 'react'
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
    // Standard reflection — no special challenge
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

// ── The special 1-point Reflection Challenge ──────────────────────────────
const REFLECTION_CHALLENGE = {
  id: 'reflection_challenge',
  icon: '🧠',
  label: 'Reflection Challenge',
  points: 1,
  minWords: 40,
  requiredElements: [
    { key: 'activity',       label: 'The specific activity you did' },
    { key: 'what_did',       label: 'What you physically did (step-by-step)' },
    { key: 'before_feeling', label: 'How you felt before' },
    { key: 'after_feeling',  label: 'How you felt after' },
    { key: 'physical_change',label: 'At least one physical change you noticed' },
    { key: 'reason',         label: 'A reason explaining that change' },
  ],
}

const TOTAL_POINTS = ACTIVITIES.reduce((s, a) => s + a.points, 0) + REFLECTION_CHALLENGE.points

// ── Client-side AI checker — replaced by backend GPT call ──
// (kept as fallback only — real check happens server-side)
function quickWordCheck(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words >= 40
}

export default function ScreenFreeGame({ onClose, onComplete, token }) {
  const [step, setStep]                   = useState('intro')
  const [completed, setCompleted]         = useState(new Set())
  const [activeReflect, setActiveReflect] = useState(null)
  const [reflections, setReflections]     = useState({})
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState('')

  // Reflection Challenge state
  const [rcText, setRcText]               = useState('')
  const [rcChecking, setRcChecking]       = useState(false)
  const [rcResult, setRcResult]           = useState(null)   // { pass, wordCount, missing[] }
  const [rcPassed, setRcPassed]           = useState(false)
  const [showRcChallenge, setShowRcChallenge] = useState(false)
  const rcRef = useRef(null)

  const rcEarned = rcPassed ? REFLECTION_CHALLENGE.points : 0
  const earned = ACTIVITIES.filter(a => completed.has(a.id)).reduce((s, a) => s + a.points, 0) + rcEarned

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

  // Check the reflection challenge answer via GPT-4o-mini
  const handleCheckReflection = async () => {
    setRcChecking(true)
    setRcResult(null)
    try {
      const { data } = await axios.post('/api/check-reflection', { answer: rcText }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRcResult(data)
      if (data.pass) setRcPassed(true)
    } catch (e) {
      setRcResult({
        pass: false,
        wordCount: rcText.trim().split(/\s+/).filter(Boolean).length,
        feedback: e.response?.data?.msg || 'Could not check your answer right now. Please try again.',
        missing: [],
      })
    }
    setRcChecking(false)
  }

  const handleSubmit = async () => {
    if (completed.size === 0 && !rcPassed) {
      setError('Please complete at least one activity or the Reflection Challenge.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const lines = ACTIVITIES
        .filter(a => completed.has(a.id))
        .map(a => {
          const r = reflections[a.id]
          return `${a.icon} ${a.label}${r ? ` — "${r}"` : ''}`
        })
      if (rcPassed) lines.push(`🧠 Reflection Challenge — "${rcText.slice(0, 120)}..."`)
      const note = `Screen-Free Outdoor Day. Activities: ${lines.join(' | ')}. Points: ${earned}/${TOTAL_POINTS}.`
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

  /* ── Standard Reflection overlay (for regular activities) ── */
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
            {rcPassed && (
              <div className={styles.doneLine}>
                <span>🧠</span>
                <span className={styles.doneLineText}>
                  Reflection Challenge
                  <span className={styles.doneReflect}>"{rcText.slice(0, 100)}{rcText.length > 100 ? '…' : ''}"</span>
                </span>
              </div>
            )}
          </div>
          <p className={styles.donePoints}>
            +{earned} eco point{earned !== 1 ? 's' : ''} quietly added to your account.
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
              <div className={styles.introRow}>
                <span className={styles.introIcon}>🧠</span>
                <span className={styles.introRowText}>Reflection Challenge <span className={styles.introBadge}>+1 pt</span></span>
              </div>
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

          {/* ── Reflection Challenge card ── */}
          <div className={`${styles.actRow} ${styles.rcCard} ${rcPassed ? styles.actDone : ''}`}>
            <div className={styles.rcCardInner}>
              <div className={styles.rcCardTop}>
                <span className={styles.rcIcon}>🧠</span>
                <div className={styles.rcCardMeta}>
                  <p className={styles.rcCardTitle}>
                    Reflection Challenge
                    <span className={styles.rcBadge}>🔥 Hard</span>
                  </p>
                  <p className={styles.rcCardSub}>Answer deeply to earn 1 bonus Eco Point</p>
                </div>
                <span className={styles.actPts}>+1 🪙</span>
              </div>

              {!showRcChallenge && !rcPassed && (
                <button
                  className={styles.rcOpenBtn}
                  onClick={() => setShowRcChallenge(true)}
                >
                  Take the challenge →
                </button>
              )}

              {rcPassed && (
                <div className={styles.rcPassedBanner}>
                  ✅ Challenge passed! +1 Eco Point earned.
                  <p className={styles.rcPassedPreview}>"{rcText.slice(0, 100)}{rcText.length > 100 ? '…' : ''}"</p>
                </div>
              )}

              {showRcChallenge && !rcPassed && (
                <div className={styles.rcExpanded}>
                  {/* Question */}
                  <div className={styles.rcQuestion}>
                    <p className={styles.rcQuestionLabel}>❓ Question</p>
                    <p className={styles.rcQuestionText}>
                      What activity did you complete? Describe exactly what you did, how your
                      body felt before and after the activity, and explain one physical change
                      you noticed. Why do you think your body felt that way?
                    </p>
                  </div>

                  {/* Requirements */}
                  <div className={styles.rcRequirements}>
                    <p className={styles.rcReqLabel}>To earn the point, your answer must include:</p>
                    <ul className={styles.rcReqList}>
                      {REFLECTION_CHALLENGE.requiredElements.map(el => {
                        const checked = rcResult?.elements?.[el.key] === true
                        return (
                          <li key={el.key} className={styles.rcReqItem}>
                            <span className={styles.rcReqTick}>{checked ? '✅' : '☐'}</span>
                            {el.label}
                          </li>
                        )
                      })}
                      <li className={styles.rcReqItem}>
                        <span className={styles.rcReqTick}>
                          {rcResult ? (rcResult.wordCount >= REFLECTION_CHALLENGE.minWords ? '✅' : '☐') : '☐'}
                        </span>
                        Minimum {REFLECTION_CHALLENGE.minWords} words
                        {rcResult && <span className={styles.rcWordCount}> ({rcResult.wordCount} written)</span>}
                      </li>
                    </ul>
                  </div>

                  {/* Example */}
                  <details className={styles.rcExample}>
                    <summary className={styles.rcExampleToggle}>💡 See an example strong answer</summary>
                    <p className={styles.rcExampleText}>
                      "I planted a seed by preparing the soil, making a small hole, placing the seed inside,
                      covering it and watering it. Before starting, I felt normal, but afterwards I felt slightly
                      tired because I was bending and working with the soil. I also felt satisfied because I
                      completed something useful for nature."
                    </p>
                  </details>

                  {/* Textarea */}
                  <textarea
                    ref={rcRef}
                    className={styles.rcTextarea}
                    placeholder="Write your answer here. Be specific — describe the activity, what you did physically, how you felt before and after, a physical change, and why it happened."
                    value={rcText}
                    onChange={e => { setRcText(e.target.value); setRcResult(null) }}
                    rows={7}
                  />

                  {/* Word count live */}
                  <p className={styles.rcLiveCount}>
                    {rcText.trim().split(/\s+/).filter(Boolean).length} / {REFLECTION_CHALLENGE.minWords} words minimum
                  </p>

                  {/* Feedback from GPT */}
                  {rcResult && !rcResult.pass && (
                    <div className={styles.rcFeedback}>
                      <p className={styles.rcFeedbackTitle}>✏️ Not quite — here's what to improve:</p>
                      {rcResult.feedback && (
                        <p className={styles.rcFeedbackText}>{rcResult.feedback}</p>
                      )}
                      {rcResult.missing && rcResult.missing.length > 0 && (
                        <ul className={styles.rcFeedbackList}>
                          {rcResult.missing.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {rcResult && rcResult.pass && (
                    <div className={styles.rcPassBanner}>
                      ✅ {rcResult.feedback || 'Great answer! You earned the point.'}
                    </div>
                  )}

                  <div className={styles.rcActions}>
                    <button
                      className={styles.rcCancelBtn}
                      onClick={() => { setShowRcChallenge(false); setRcResult(null) }}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.rcCheckBtn}
                      onClick={handleCheckReflection}
                      disabled={rcChecking || rcText.trim().split(/\s+/).filter(Boolean).length < 10}
                    >
                      {rcChecking ? '🔍 Checking…' : '🤖 Check my answer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {(completed.size > 0 || rcPassed) && (
          <p className={styles.tally}>
            {completed.size} activit{completed.size !== 1 ? 'ies' : 'y'}{rcPassed ? ' + Reflection Challenge' : ''} · {earned} eco point{earned !== 1 ? 's' : ''}
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.checkinFooter}>
          <button
            className={styles.logBtn}
            onClick={handleSubmit}
            disabled={submitting || (completed.size === 0 && !rcPassed)}
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
