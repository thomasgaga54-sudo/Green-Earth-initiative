import { useState } from 'react'
import axios from 'axios'
import styles from './ProfileTab.module.css'
import { getLevelInfo, getLevelProgress, pointsToNextLevel } from '../utils/levels'

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bangladesh",
  "Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo",
  "Croatia","Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France",
  "Germany","Ghana","Greece","Guatemala","Hungary","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Malaysia",
  "Mexico","Morocco","Mozambique","Myanmar","Netherlands","New Zealand","Nigeria","Norway",
  "Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia",
  "Senegal","Serbia","Singapore","Somalia","South Africa","South Korea","Spain","Sri Lanka",
  "Sudan","Sweden","Switzerland","Syria","Tanzania","Thailand","Tunisia","Turkey","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe"
]

const AVATAR_COLORS = [
  '#1b5e20','#2e7d32','#388e3c','#1565c0','#6a1b9a',
  '#e65100','#c62828','#37474f','#00695c','#4527a0'
]

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'sw', label: '🇰🇪 Swahili' },
  { code: 'yo', label: '🇳🇬 Yoruba' },
  { code: 'ha', label: '🇳🇬 Hausa' },
  { code: 'ig', label: '🇳🇬 Igbo' },
  { code: 'tw', label: '🇬🇭 Twi' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'zh', label: '🇨🇳 Chinese' },
]

export default function ProfileTab({ currentUser, onUpdate }) {
  const levelInfo  = getLevelInfo(currentUser.points || 0)
  const levelPct   = getLevelProgress(currentUser.points || 0)
  const ptsToNext  = pointsToNextLevel(currentUser.points || 0)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    country: currentUser.country || '',
    city: currentUser.city || '',
    dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.substring(0, 10) : '',
    gender: currentUser.gender || '',
    bio: currentUser.bio || '',
    avatarColor: currentUser.avatarColor || '#1b5e20',
    preferredLanguage: currentUser.preferredLanguage || 'en',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showPwSection, setShowPwSection] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteSection, setShowDeleteSection] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true); setError(''); setMsg('')
    try {
      const { data } = await axios.patch('/api/me', form)
      onUpdate(data)
      setMsg('✅ Profile updated successfully!')
      setEditing(false)
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile.')
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async e => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match.'); return }
    setPwSaving(true); setPwError(''); setPwMsg('')
    try {
      const { data } = await axios.post('/api/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      setPwMsg('✅ ' + data.msg)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => { setPwMsg(''); setShowPwSection(false) }, 3000)
    } catch (err) {
      setPwError(err.response?.data?.msg || 'Failed to change password.')
    } finally { setPwSaving(false) }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password to confirm.'); return }
    if (!window.confirm('Are you absolutely sure? This will permanently delete your account and all your points.')) return
    try {
      await axios.delete('/api/me', { data: { password: deletePassword } })
      localStorage.clear()
      window.location.href = '/'
    } catch (err) {
      setDeleteError(err.response?.data?.msg || 'Failed to delete account.')
    }
  }

  const initial = (currentUser.name || 'U')[0].toUpperCase()
  const avatarBg = currentUser.avatarColor || '#1b5e20'
  const langLabel = LANGUAGES.find(l => l.code === currentUser.preferredLanguage)?.label || '🇬🇧 English'

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>👤 My Profile</h2>

      {msg && <div className={styles.success}>{msg}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {/* Profile Header */}
      <div className={styles.headerCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} style={{ background: avatarBg }}>{initial}</div>
          {editing && (
            <div className={styles.colorPicker}>
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button"
                  className={`${styles.colorDot} ${form.avatarColor === c ? styles.colorSelected : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, avatarColor: c })}
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles.headerInfo}>
          <h3>{currentUser.name}</h3>
          <p className={styles.email}>{currentUser.email}</p>
          {currentUser.country && <p className={styles.location}>📍 {currentUser.city ? `${currentUser.city}, ` : ''}{currentUser.country}</p>}
          {currentUser.bio && <p className={styles.bio}>{currentUser.bio}</p>}
        </div>
        <div className={styles.statsPill}>
          <div><strong>{currentUser.points || 0}</strong><span>Points</span></div>
          <div
            className={styles.levelPill}
            style={{ background: levelInfo.bg, color: levelInfo.color }}
          >
            <strong>{levelInfo.icon} {levelInfo.title}</strong>
            <span>Level {levelInfo.level}</span>
          </div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className={styles.levelProgress}>
        <div className={styles.levelProgressHeader}>
          <span style={{ color: levelInfo.color, fontWeight: 700 }}>
            {levelInfo.icon} Level {levelInfo.level} — {levelInfo.title}
          </span>
          <span className={styles.levelProgressRight}>
            {ptsToNext ? `${ptsToNext} pts to Level ${levelInfo.level + 1}` : '👑 Max Level!'}
          </span>
        </div>
        <div className={styles.levelBar}>
          <div
            className={styles.levelBarFill}
            style={{ width: `${levelPct}%`, background: levelInfo.color }}
          />
        </div>
      </div>

      {/* Info Grid */}
      {!editing && (
        <div className={styles.infoGrid}>
          {[
            { icon: '📧', label: 'Email', value: currentUser.email },
            { icon: '📱', label: 'Phone', value: currentUser.phone },
            { icon: '🌍', label: 'Country', value: currentUser.country },
            { icon: '🏙️', label: 'City', value: currentUser.city },
            { icon: '🎂', label: 'Date of Birth', value: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toLocaleDateString() : null },
            { icon: '👤', label: 'Gender', value: currentUser.gender },
            { icon: '🌐', label: 'Language', value: langLabel },
            { icon: '📅', label: 'Member Since', value: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : null },
          ].map(({ icon, label, value }) => (
            <div key={label} className={styles.infoCard}>
              <div className={styles.infoLabel}>{icon} {label}</div>
              <div className={styles.infoValue}>{value || <span className={styles.empty}>Not set</span>}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Button */}
      {!editing && (
        <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit Profile</button>
      )}

      {/* Edit Form */}
      {editing && (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required /></div>
            <div className={styles.field}><label>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+44 7700 900000" type="tel" /></div>
            <div className={styles.field}><label>Country</label>
              <select name="country" value={form.country} onChange={handleChange}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className={styles.field}><label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Your city" /></div>
            <div className={styles.field}><label>Date of Birth</label>
              <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" /></div>
            <div className={styles.field}><label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select></div>
            <div className={styles.field}><label>Preferred Language</label>
              <select name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select></div>
          </div>
          <div className={styles.field}>
            <label>Bio <span className={styles.optional}>(optional)</span></label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
              placeholder="Tell us a bit about yourself and your eco journey..." maxLength={200} />
            <span className={styles.charCount}>{form.bio.length}/200</span>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Security Section ── */}
      <div className={styles.securitySection}>
        <h3 className={styles.securityTitle}>🔐 Security</h3>

        {/* Change Password */}
        <div className={styles.securityCard}>
          <div className={styles.securityCardHeader}>
            <div>
              <strong>🔑 Change Password</strong>
              <p>Update your password regularly to keep your account safe.</p>
            </div>
            <button className={styles.secToggleBtn} onClick={() => setShowPwSection(!showPwSection)}>
              {showPwSection ? 'Cancel' : 'Change'}
            </button>
          </div>
          {showPwSection && (
            <form className={styles.secForm} onSubmit={handlePasswordChange}>
              {pwMsg && <div className={styles.success}>{pwMsg}</div>}
              {pwError && <div className={styles.error}>{pwError}</div>}
              <div className={styles.field}><label>Current Password</label>
                <input type="password" placeholder="••••••••" value={pwForm.currentPassword}
                  onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required /></div>
              <div className={styles.field}><label>New Password</label>
                <input type="password" placeholder="Min. 6 characters" value={pwForm.newPassword}
                  onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} minLength={6} required /></div>
              <div className={styles.field}><label>Confirm New Password</label>
                <input type="password" placeholder="Repeat new password" value={pwForm.confirmPassword}
                  onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} required /></div>
              <button type="submit" className={styles.saveBtn} disabled={pwSaving}>
                {pwSaving ? 'Updating...' : '🔑 Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Last Login */}
        <div className={styles.securityCard}>
          <strong>📅 Last Login</strong>
          <p>{currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Not recorded'}</p>
        </div>

        {/* Delete Account */}
        <div className={`${styles.securityCard} ${styles.dangerCard}`}>
          <div className={styles.securityCardHeader}>
            <div>
              <strong>🗑️ Delete Account</strong>
              <p>Permanently delete your account. All points and data will be lost forever.</p>
            </div>
            <button className={styles.dangerToggleBtn} onClick={() => setShowDeleteSection(!showDeleteSection)}>
              {showDeleteSection ? 'Cancel' : 'Delete'}
            </button>
          </div>
          {showDeleteSection && (
            <div className={styles.secForm}>
              {deleteError && <div className={styles.error}>{deleteError}</div>}
              <div className={styles.field}><label>Enter your password to confirm</label>
                <input type="password" placeholder="Your password" value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)} /></div>
              <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
                ⚠️ Yes, permanently delete my account
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
