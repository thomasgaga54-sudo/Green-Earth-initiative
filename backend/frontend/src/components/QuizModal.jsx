import { useState } from 'react'
import axios from 'axios'
import styles from './QuizModal.module.css'

export default function QuizModal({ task, onClose, onSuccess }) {
  const [step, setStep] = useState('intro') // intro | quiz | result
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const questions = task.quiz || []
  const total = questions.length
  const passMark = task.passMark || 3

  const handleSelect = (idx) => {
    if (selected !== null) return // already answered this question
    setSelected(idx)
  }

  const handleNext = () => {
    const updated = [...answers, selected]
    setAnswers(updated)
    setSelected(null)

    if (current + 1 < total) {
      setCurrent(current + 1)
    } else {
      submitQuiz(updated)
    }
  }

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.post('/api/quiz-submit',
        { taskId: task._id, answers: finalAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(data)
      setStep('result')
      if (data.passed) onSuccess(data.pointsAwarded)
    } catch (err) {
      setError(err.response?.data?.msg || 'Submission failed. Please try again.')
      setStep('result')
    } finally {
      setSubmitting(false)
    }
  }

  const q = questions[current]

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* ── Intro ── */}
        {step === 'intro' && (
          <>
            <div className={styles.header}>
              <div>
                <h2>📚 {task.title}</h2>
                <p className={styles.sub}>{task.description}</p>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            <div className={styles.introBox}>
              <div className={styles.introIcon}>🎯</div>
              <p>Answer <strong>{total} questions</strong> about this topic.</p>
              <p>Get at least <strong>{passMark} out of {total}</strong> correct to earn</p>
              <div className={styles.points}>+{task.points} pts</div>
              <p className={styles.hint}>Points are awarded instantly — no admin approval needed!</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.startBtn} onClick={() => setStep('quiz')}>
                Start Quiz →
              </button>
            </div>
          </>
        )}

        {/* ── Quiz ── */}
        {step === 'quiz' && q && (
          <>
            <div className={styles.header}>
              <h2>📚 {task.title}</h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${((current) / total) * 100}%` }}
                />
              </div>
              <span className={styles.progressLabel}>Question {current + 1} of {total}</span>
            </div>

            <div className={styles.questionBox}>
              <p className={styles.question}>{q.question}</p>
              <div className={styles.options}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`${styles.option}
                      ${selected === i ? styles.selected : ''}
                      ${selected !== null && i === q.correctIndex ? styles.correct : ''}
                      ${selected !== null && selected === i && i !== q.correctIndex ? styles.wrong : ''}
                    `}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                  >
                    <span className={styles.optionLetter}>{['A','B','C','D'][i]}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {selected !== null && (
              <div className={styles.feedback}>
                {selected === q.correctIndex
                  ? <span className={styles.feedbackCorrect}>✅ Correct!</span>
                  : <span className={styles.feedbackWrong}>❌ The correct answer was: {q.options[q.correctIndex]}</span>
                }
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={selected === null || submitting}
              >
                {submitting ? '⏳ Submitting...' : current + 1 < total ? 'Next →' : 'Finish Quiz'}
              </button>
            </div>
          </>
        )}

        {/* ── Result ── */}
        {step === 'result' && result && (
          <>
            <div className={styles.header}>
              <h2>{result.passed ? '🎉 You Passed!' : '😔 Not Quite'}</h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <div className={`${styles.resultBox} ${result.passed ? styles.resultPass : styles.resultFail}`}>
              <div className={styles.resultScore}>
                {result.score}<span>/{result.total}</span>
              </div>
              <p>{result.passed
                ? `Great job! You've earned +${result.pointsAwarded} points.`
                : `You needed ${passMark} correct to pass. Try a different quiz!`}
              </p>
            </div>

            <div className={styles.resultDetails}>
              {questions.map((q, i) => (
                <div key={i} className={`${styles.resultRow} ${result.results[i]?.correct ? styles.rowCorrect : styles.rowWrong}`}>
                  <span className={styles.resultIcon}>{result.results[i]?.correct ? '✅' : '❌'}</span>
                  <span className={styles.resultQ}>{q.question}</span>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.startBtn} onClick={onClose}>
                {result.passed ? 'Collect Points →' : 'Close'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
