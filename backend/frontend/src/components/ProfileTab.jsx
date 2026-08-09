import { useState } from 'react'
import axios from 'axios'
import styles from './ProfileTab.module.css'

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

export default function ProfileTab({ currentUser, onUpdate }) {
  const level = Math.floor((currentUser.points || 0) / 100) + 1

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
    } finally {
      setSaving(false)
    }
  }

  const initial = (currentUser.name || 'U')[0].toUpperCase()
  const avatarBg = currentUser.avatarColor || '#1b5e20'

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>👤 My Profile</h2>

      {msg && <div className={styles.success}>{msg}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {/* Profile Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} style={{ background: avatarBg }}>{initial}</div>
          {editing && (
            <div className={styles.colorPicker}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
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
          <div><strong>Level {level}</strong><span>Rank</span></div>
        </div>
      </div>

      {/* Info Grid (view mode) */}
      {!editing && (
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>📧 Email</div>
            <div className={styles.infoValue}>{currentUser.email}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>📱 Phone</div>
            <div className={styles.infoValue}>{currentUser.phone || <span className={styles.empty}>Not set</span>}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>🌍 Country</div>
            <div className={styles.infoValue}>{currentUser.country || <span className={styles.empty}>Not set</span>}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>🏙️ City</div>
            <div className={styles.infoValue}>{currentUser.city || <span className={styles.empty}>Not set</span>}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>🎂 Date of Birth</div>
            <div className={styles.infoValue}>
              {currentUser.dateOfBirth
                ? new Date(currentUser.dateOfBirth).toLocaleDateString()
                : <span className={styles.empty}>Not set</span>}
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>👤 Gender</div>
            <div className={styles.infoValue}>{currentUser.gender || <span className={styles.empty}>Not set</span>}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>🌐 Language</div>
            <div className={styles.infoValue}>{currentUser.preferredLanguage === 'en' ? '🇬🇧 English' : currentUser.preferredLanguage || 'English'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>📅 Member Since</div>
            <div className={styles.infoValue}>{new Date(currentUser.createdAt).toLocaleDateString()}</div>
          </div>
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
            <div className={styles.field}>
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
            </div>
            <div className={styles.field}>
              <label>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+44 7700 900000" type="tel" />
            </div>
            <div className={styles.field}>
              <label>Country</label>
              <select name="country" value={form.country} onChange={handleChange}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Your city" />
            </div>
            <div className={styles.field}>
              <label>Date of Birth</label>
              <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" />
            </div>
            <div className={styles.field}>
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Preferred Language</label>
              <select name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange}>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 French</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="pt">🇧🇷 Portuguese</option>
                <option value="ar">🇸🇦 Arabic</option>
                <option value="sw">🇰🇪 Swahili</option>
                <option value="yo">🇳🇬 Yoruba</option>
                <option value="ha">🇳🇬 Hausa</option>
                <option value="ig">🇳🇬 Igbo</option>
                <option value="tw">🇬🇭 Twi</option>
                <option value="de">🇩🇪 German</option>
                <option value="zh">🇨🇳 Chinese</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Bio <span className={styles.optional}>(optional)</span></label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us a bit about yourself and your eco journey..."
              maxLength={200}
            />
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
    </section>
  )
}
