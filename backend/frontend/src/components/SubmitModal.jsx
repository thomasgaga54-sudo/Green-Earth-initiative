import { useState, useRef } from 'react'
import axios from 'axios'
import styles from './SubmitModal.module.css'

const REFLECTION_BONUS = 5
const MIN_WORDS = 30

export default function SubmitModal({ task, onClose, onSuccess }) {
  const [image, setImage]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [note, setNote]           = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  // Reflection Challenge state
  const [showReflection, setShowReflection]   = useState(false)
  const [reflectionText, setReflectionText]   = useState('')
  const [rcChecking, setRcChecking]           = useState(false)
  const [rcResult, setRcResult]               = useState(null)
  const [rcPassed, setRcPassed]               = useState(false)

  const wordCount = reflectionText.trim().split(/\s+/).filter(Boolean).length

  // Generate a reflection prompt based on the task
  const reflectionPrompt = `Describe what you did for "${task.title}". Include where you did it, how it felt, what you noticed, and why it matters to you or your environment.`

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1200
        let w = img.width, h = img.height
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          setImage(blob)
          setPreview(URL.createObjectURL(blob))
          setError('')
        }, 'image/jpeg', 0.8)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleCheckReflection = async () => {
    if (wordCount < MIN_WORDS) {
      setRcResult({ pass: false, feedback: `Please write at least ${MIN_WORDS} words (you have ${wordCount}).` })
      return
    }
    setRcChecking(true)
    setRcResult(null)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.post('/api/check-reflection', { answer: reflectionText }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRcResult(data)
      if (data.pass) setRcPassed(true)
    } catch {
      // fallback: accept if enough words
      const passed = wordCount >= MIN_WORDS
      setRcResult({ pass: passed, feedback: passed ? 'Good answer!' : 'Please add more detail.' })
      if (passed) setRcPassed(true)
    }
    setRcChecking(false)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!image) { setError('Please upload a photo as proof.'); return }
    if ((task.proofLevel === 'enhanced' || task.proofLevel === 'verified') && !note.trim()) {
      setError('A detailed description is required for this task.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', image)
      const { data: uploadData } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const token = localStorage.getItem('token')
      const { data } = await axios.post(
        '/api/submit',
        {
          taskId: task._id,
          imageUrl: uploadData.imageUrl,
          note,
          reflectionAnswer: rcPassed ? reflectionText : '',
          reflectionBonusPoints: rcPassed ? REFLECTION_BONUS : 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.msg || 'Submission failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Submit Proof</h2>
            <p className={styles.taskName}>{task.title}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Photo upload */}
          <div
            className={`${styles.dropZone} ${preview ? styles.hasPreview : ''}`}
            onClick={() => fileRef.current.click()}
          >
            {preview
              ? <img src={preview} alt="preview" className={styles.preview} />
              : <>
                  <div className={styles.dropIcon}>📷</div>
                  <p className={styles.dropText}>Tap to upload your proof photo</p>
                  <p className={styles.dropHint}>JPG, PNG, WEBP — max 10MB</p>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className={styles.fileInput} />
          </div>

          {preview && (
            <button type="button" className={styles.changeBtn} onClick={() => fileRef.current.click()}>
              📷 Change photo
            </button>
          )}

          {/* Note / description */}
          <div className={styles.field}>
            <label>
              {task.proofLevel === 'enhanced' || task.proofLevel === 'verified'
                ? <>📝 Description <span className={styles.required}>Required</span></>
                : <>Add a note <span className={styles.optional}>(optional)</span></>
              }
            </label>
            <textarea
              rows={3}
              placeholder={
                task.proofLevel === 'enhanced' || task.proofLevel === 'verified'
                  ? 'Describe in detail what you did, where, when, and how...'
                  : 'Describe what you did, where, how long it took...'
              }
              value={note}
              onChange={e => setNote(e.target.value)}
              className={styles.textarea}
              required={task.proofLevel === 'enhanced' || task.proofLevel === 'verified'}
            />
          </div>

          {task.proofLevel === 'verified' && (
            <div className={styles.verifiedNotice}>
              🔍 <strong>High-value task:</strong> This submission will be carefully reviewed by an admin before points are awarded.
            </div>
          )}

          {/* ── Reflection Challenge ── */}
          <div className={styles.rcSection}>
            <div className={styles.rcSectionHeader}>
              <div>
                <p className={styles.rcSectionTitle}>
                  🔥 Reflection Challenge
                  <span className={styles.rcHardBadge}>Hard</span>
                  {rcPassed && <span className={styles.rcPassedTag}>✅ +{REFLECTION_BONUS} pts earned</span>}
                </p>
                <p className={styles.rcSectionSub}>
                  Answer the reflection question to earn <strong>+{REFLECTION_BONUS} bonus points</strong> when approved.
                </p>
              </div>
              {!rcPassed && (
                <button
                  type="button"
                  className={`${styles.rcToggleBtn} ${showReflection ? styles.rcToggleOpen : ''}`}
                  onClick={() => setShowReflection(v => !v)}
                >
                  {showReflection ? 'Hide ▲' : 'Try it ▼'}
                </button>
              )}
            </div>

            {(showReflection || rcPassed) && (
              <div className={styles.rcBody}>
                <p className={styles.rcPrompt}>{reflectionPrompt}</p>

                {rcPassed ? (
                  <div className={styles.rcPassedBanner}>
                    ✅ Challenge passed! +{REFLECTION_BONUS} bonus points will be awarded on approval.
                    <p className={styles.rcPassedPreview}>"{reflectionText.slice(0, 120)}{reflectionText.length > 120 ? '…' : ''}"</p>
                    <button type="button" className={styles.rcEditBtn} onClick={() => setRcPassed(false)}>Edit answer</button>
                  </div>
                ) : (
                  <>
                    <textarea
                      className={styles.rcTextarea}
                      placeholder="Write your answer here. Be honest and specific — at least 30 words."
                      value={reflectionText}
                      onChange={e => { setReflectionText(e.target.value); setRcResult(null) }}
                      rows={5}
                    />
                    <p className={styles.rcWordCount}>{wordCount} / {MIN_WORDS} words minimum</p>

                    {rcResult && !rcResult.pass && (
                      <div className={styles.rcFeedback}>
                        <p>{rcResult.feedback}</p>
                      </div>
                    )}
                    {rcResult && rcResult.pass && (
                      <div className={styles.rcPassBanner}>✅ {rcResult.feedback || 'Great answer!'}</div>
                    )}

                    <button
                      type="button"
                      className={styles.rcCheckBtn}
                      onClick={handleCheckReflection}
                      disabled={rcChecking || wordCount < 5}
                    >
                      {rcChecking ? '🔍 Checking…' : '🤖 Check & earn bonus'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={uploading}>
              {uploading ? '⏳ Submitting...' : '📷 Submit for Approval'}
            </button>
          </div>

          <p className={styles.hint}>
            🔍 Your submission will be reviewed by an admin before points are awarded.
          </p>
        </form>
      </div>
    </div>
  )
}
