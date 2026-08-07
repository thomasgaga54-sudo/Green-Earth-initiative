import { useState, useRef } from 'react'
import axios from 'axios'
import styles from './SubmitModal.module.css'

export default function SubmitModal({ task, onClose, onSuccess }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!image) { setError('Please upload a photo as proof.'); return }
    setUploading(true)
    setError('')
    try {
      // 1. Upload image
      const formData = new FormData()
      formData.append('image', image)
      const { data: uploadData } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // 2. Submit task with image URL
      const token = localStorage.getItem('token')
      await axios.post(
        '/api/submit',
        { taskId: task._id, imageUrl: uploadData.imageUrl, note },
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={styles.fileInput}
            />
          </div>

          {preview && (
            <button type="button" className={styles.changeBtn} onClick={() => fileRef.current.click()}>
              📷 Change photo
            </button>
          )}

          {/* Optional note */}
          <div className={styles.field}>
            <label>Add a note <span className={styles.optional}>(optional)</span></label>
            <textarea
              rows={3}
              placeholder="Describe what you did, where, how long it took..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={uploading}>
              {uploading ? '⏳ Submitting...' : '✅ Submit for Approval'}
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
