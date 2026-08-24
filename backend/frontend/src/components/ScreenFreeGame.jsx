import { useState } from 'react'
import axios from 'axios'
import styles from './ScreenFreeGame.module.css'

const ACTIVITIES = [
  {
    id: 'walk',
    icon: '🚶',
    label: 'Take a Walk Outside',
    desc: 'Step away from all screens and walk around your neighborhood, a park, or any outdoor space.',
    challenge: 'What did you notice around you that you usually miss when you\'re on a screen? Describe where you walked, what you saw, heard, or felt, and one thing that surprised or caught your attention.',
    points: 20,
    challengePoints: 5,
  },
  {
    id: 'explore',
    icon: '🌱',
    label: 'Observe Nature',
    desc: 'Spend time finding and looking closely at plants, insects, birds, or anything living in your surroundings.',
    challenge: 'Describe one living thing you found. What was it doing? How did it look up close? What did observing it make you think or feel?',
    points: 20,
    challengePoints: 5,
  },
  {
    id: 'clean',
    icon: '🧹',
    label: 'Care for Your Environment',
    desc: 'Pick up litter you find outside and dispose of it properly. Leave your space cleaner than you found it.',
    challenge: 'How did it feel to take care of a shared space? Describe what you cleaned, how much you collected, and what you thought about while doing it.',
    points: 30,
    challengePoints: 5,
  },
  {
    id: 'play',
    icon: '🏃',
    label: 'Move Your Body',
    desc: 'Play football, ride a bike, jump rope, garden, or do any physical activity without a screen.',
    challenge: 'What activity did you do? Describe exactly what you did physically, how your body felt before and after, and one physical change you noticed in yourself.',
    points: 30,
    challengePoints: 5,
  },
  {
    id: 'social',
    icon: '👨‍👩‍👧',
    label: 'Connect with People',
    desc: 'Have a real conversation, play a board game, cook together, or share a meal — all without screens.',
    challenge: 'Who did you connect with, and what did you talk about or do together? How was the conversation different without phones around?',
    points: 20,
    challengePoints: 5,
  },
]

const BASE_TOTAL   = ACTIVITIES.reduce((s, a) => s + a.points, 0)
const BONUS_TOTAL  = ACTIVITIES.reduce((s, a) => s + a.challengePoints, 0)
const TOTAL_POINTS = BASE_TOTAL + BONUS_TOTAL

const MIN_WORDS = 30

export default function ScreenFreeGame({ onClose, onComplete, token }) {
  const [step, setStep]               = useState('intro')
  const [completed, setCompleted]     = useState(new Set())
  const [activeChallenge, setActiveChallenge] = useState(null) // activity id
  const [challenges, setChallenges]   = useState({})  // { id: { text, passed } }
  const [submitting, setSubmitting]   = useState(false)
  const [checking, setChecking]       = useState(false)
  const [draftText, setDraftText]     = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [error, setError]             = useState('')

  const earned = ACTIVITIES.filter(a => completed.has(a.id)).reduce((s, a) => {
    const bonus = challenges[a.id]?.passed ? a.challengePoints : 0
    return s + a.points + bonus
  }, 0)

  const toggleDone = (id) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openChallenge = (id) => {
    setDraftText(challenges[id]?.text || '')
    setCheckResult(null)
    setActiveChallenge(id)
  }

  const closeChallenge = () => {
    setActiveChallenge(null)
    setCheckResult(null)
    setDraftText('')
  }

  const handleCheckChallenge = async () => {
    const wordCount = draftText.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < MIN_WORDS) {
      setCheckResult({ pass: false, feedback: `Please write at least ${MIN_WORDS} words (you have ${wordCount}).` })
      return
    }
    setChecking(true)
    setCheckResult(null)
    try {
      const { data } = await axios.post('/api/check-reflection', { answer: draftText }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCheckResult(data)
      if (data.pass) {
        setChallenges(prev => ({ ...prev, [activeChallenge]: { text: draftText, passed: true } }))
      }
    } catch {
      // fallback: if API fails, accept answer if enough words
      const passed = wordCount >= MIN_WORDS
      setCheckResult({ pass: passed, feedback: passed ? 'Great answer!' : 'Please add more detail.' })
      if (passed) setChallenges(prev => ({ ...prev, [activeChallenge]: { text: draftText, passed: true } }))
    }
    setChecking(false)
  }

  const saveDraft = () => {
    setChallenges(prev => ({ ...prev, [activeChallenge]: { text: draftText, passed: challenges[activeChallenge]?.passed || false } }))
    closeChallenge()
  }

  const handleSubmit = async () => {
    if (completed.size === 0) { setError('Please tick at least one activity.'); return }
    setSubmitting(true)
    setError('')
    try {
      const lines = ACTIVITIES.filter(a => completed.has(a.id)).map(a => {
        const c = challenges[a.id]
        return `${a.icon} ${a.label}${c?.passed ? ` [Challenge passed] "${c.text.slice(0, 80)}…"` : ''}`
      })
      const note = `Screen-Free Outdoor Day. Activities: ${lines.join(' | ')}. Points: ${earned}/${TOTAL_POINTS}.`
      await axios.post('/api/submit-screenfree', { note, earnedPoints: earned }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStep('done')
      onComplete && onComplete(earned)
    } catch (e) {
      setError(e.response?.data?.msg || 'Could not save. Please try again.')
    }
    setSubmitting(false)
  }

  /* ── Reflection Challenge overlay ── */
  if (activeChallenge) {
    const act = ACTIVITIES.find(a => a.id === activeChallenge)
    const wordCount = draftText.trim().split(/\s+/).filter(Boolean).length
    const alreadyPassed = challenges[activeChallenge]?.passed

    return (
      <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeChallenge()}>
        <div className={styles.modal}>
          <div className={styles.rcHeader}>
            <button className={styles.closeX} onClick={closeChallenge}>✕</button>
            <div className={styles.rcHeaderTop}>
              <span className={styles.rcActIcon}>{act.icon}</span>
              <div>
                <p className={styles.rcActLabel}>{act.label}</p>
                <p className={styles.rcHardBadge}>🔥 Reflection Challenge — Hard</p>
              </div>
              <span className={styles.rcBonusPts}>+{act.challengePoints} pts</span>
            </div>
          </div>

          <div className={styles.rcBody}>
            <p className={styles.rcPrompt}>{act.challenge}</p>

            <div className={styles.rcRequirements}>
              <p className={styles.rcReqLabel}>To earn the bonus points, your answer must:</p>
              <ul className={styles.rcReqList}>
                <li>Be at least {MIN_WORDS} words</li>
                <li>Be specific about what you actually did</li>
                <li>Include how you felt or what you noticed</li>
              </ul>
            </div>

            {alreadyPassed ? (
              <div className={styles.rcPassedBanner}>
                ✅ Challenge passed! +{act.challengePoints} pts earned.
                <p className={styles.rcPassedPreview}>"{challenges[activeChallenge].text.slice(0, 120)}{challenges[activeChallenge].text.length > 120 ? '…' : ''}"</p>
                <button className={styles.rcEditBtn} onClick={() => setChallenges(prev => ({ ...prev, [activeChallenge]: { ...prev[activeChallenge], passed: false } }))}>
                  Edit answer
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className={styles.rcTextarea}
                  placeholder="Write your answer here. Be honest and specific."
                  value={draftText}
                  onChange={e => { setDraftText(e.target.value); setCheckResult(null) }}
                  rows={6}
                  autoFocus
                />
                <p className={styles.rcWordCount}>{wordCount} / {MIN_WORDS} words minimum</p>

                {checkResult && !checkResult.pass && (
                  <div className={styles.rcFeedback}>
                    <p className={styles.rcFeedbackText}>{checkResult.feedback}</p>
                  </div>
                )}
                {checkResult && checkResult.pass && (
                  <div className={styles.rcPassBanner}>✅ {checkResult.feedback || 'Great answer! Bonus points earned.'}</div>
                )}

                <div className={styles.rcActions}>
                  <button className={styles.rcSaveBtn} onClick={saveDraft}>Save without submitting</button>
                  <button
                    className={styles.rcCheckBtn}
                    onClick={handleCheckChallenge}
                    disabled={checking || wordCount < 5}
                  >
                    {checking ? '🔍 Checking…' : '🤖 Check & earn points'}
                  </button>
                </div>
              </>
            )}
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
            <p className={styles.doneSubtitle}>You spent real time outdoors today. That's a habit worth building.</p>
          </div>
          <div className={styles.doneSummary}>
            <p className={styles.doneSummaryLabel}>What you did today</p>
            {completedActs.map(a => (
              <div key={a.id} className={styles.doneLine}>
                <span>{a.icon}</span>
                <span className={styles.doneLineText}>
                  {a.label}
                  {challenges[a.id]?.passed && <span className={styles.doneBonusBadge}>+{a.challengePoints} pts challenge ✅</span>}
                  {challenges[a.id]?.text && !challenges[a.id]?.passed && (
                    <span className={styles.doneReflect}>"{challenges[a.id].text.slice(0, 80)}{challenges[a.id].text.length > 80 ? '…' : ''}"</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.donePoints}>+{earned} eco point{earned !== 1 ? 's' : ''} added to your account.</p>
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
              A simple invitation to step outside, move your body, and pay attention to the world
              around you — without a screen.
            </p>
            <p className={styles.introBody}>
              Tick each activity you complete. Each one has a <strong>🔥 Reflection Challenge</strong> —
              answer it well to earn bonus points.
            </p>
            <div className={styles.introActivities}>
              {ACTIVITIES.map(a => (
                <div key={a.id} className={styles.introRow}>
                  <span className={styles.introIcon}>{a.icon}</span>
                  <span className={styles.introRowText}>
                    {a.label}
                    <span className={styles.introPts}> +{a.points} pts</span>
                    <span className={styles.introBonusPts}> +{a.challengePoints} challenge bonus</span>
                  </span>
                </div>
              ))}
            </div>
            <button className={styles.beginBtn} onClick={() => setStep('checkin')}>
              I'm ready — let's go
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
        <div className={styles.checkinHeader}>
          <button className={styles.closeX} onClick={onClose}>✕</button>
          <h2 className={styles.checkinTitle}>🌳 Screen-Free Outdoor Day</h2>
          <p className={styles.checkinSub}>
            Tick each activity you genuinely completed. Each has a <strong>🔥 Reflection Challenge</strong> for bonus points.
          </p>
        </div>

        <div className={styles.actList}>
          {ACTIVITIES.map(a => {
            const isDone       = completed.has(a.id)
            const chalPassed   = challenges[a.id]?.passed
            const chalDraft    = !!challenges[a.id]?.text
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
                  <div className={styles.actInfoText}>
                    <p className={styles.actLabel}>{a.label}</p>
                    <p className={styles.actDesc}>{a.desc}</p>
                    {isDone && (
                      <button
                        className={`${styles.challengeBtn} ${chalPassed ? styles.challengeBtnPassed : ''}`}
                        onClick={() => openChallenge(a.id)}
                      >
                        {chalPassed
                          ? `✅ Challenge passed (+${a.challengePoints} pts)`
                          : chalDraft
                            ? `✏️ Edit Reflection Challenge 🔥`
                            : `🔥 Take Reflection Challenge (+${a.challengePoints} pts)`}
                      </button>
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
            {completed.size} activit{completed.size !== 1 ? 'ies' : 'y'} ·{' '}
            {Object.values(challenges).filter(c => c.passed).length} challenge{Object.values(challenges).filter(c => c.passed).length !== 1 ? 's' : ''} passed ·{' '}
            <strong>{earned} eco points</strong>
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
          <p className={styles.footerHint}>Only log what you actually did.</p>
        </div>
      </div>
    </div>
  )
}
