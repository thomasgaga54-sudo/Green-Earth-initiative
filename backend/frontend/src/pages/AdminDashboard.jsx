import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './AdminDashboard.module.css'
import { getLevelInfo } from '../utils/levels'

const api = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
})

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [activeTab, setActiveTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')
  const [redemptions, setRedemptions] = useState([])
  const [redemptionFilter, setRedemptionFilter] = useState('all')
  const [fulfilNote, setFulfilNote] = useState({}) // { [id]: string }
  const [fulfillingId, setFulfillingId] = useState(null)
  const [newTask, setNewTask] = useState({ title: '', description: '', points: '' })
  const [editingImageTaskId, setEditingImageTaskId] = useState(null)
  const [editImageUrl, setEditImageUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)

  // User profile modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSubs, setUserSubs] = useState([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  useEffect(() => {
    if (!user.isAdmin) { navigate('/dashboard'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [s, t, u, p, r] = await Promise.all([
        axios.get('/api/admin/submissions', api(token)),
        axios.get('/api/tasks'),
        axios.get('/api/admin/users', api(token)),
        axios.get('/api/admin/payments', api(token)),
        axios.get('/api/admin/redemptions', api(token)),
      ])
      setSubmissions(s.data)
      setTasks(t.data)
      setUsers(u.data)
      setPayments(p.data)
      setRedemptions(r.data)
    } catch { navigate('/login') }
  }

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const openUserProfile = async (u) => {
    setSelectedUser(u)
    setProfileLoading(true)
    setUserSubs([])
    setAdjustPoints('')
    setAdjustNote('')
    try {
      const { data } = await axios.get(`/api/admin/users/${u._id}/submissions`, api(token))
      setUserSubs(data)
    } catch (err) {
      console.error('Failed to load user submissions', err)
    }
    setProfileLoading(false)
  }

  const closeProfile = () => setSelectedUser(null)

  const handleBan = async () => {
    if (!confirm(`Ban ${selectedUser.name}? They will be flagged and unable to earn points.`)) return
    try {
      await axios.patch(`/api/admin/users/${selectedUser._id}/ban`, {}, api(token))
      toast(`🚫 ${selectedUser.name} has been banned.`)
      fetchAll()
      setSelectedUser(prev => ({ ...prev, flaggedForReview: true, flagReason: 'banned_by_admin' }))
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const handleUnflag = async () => {
    try {
      await axios.patch(`/api/admin/users/${selectedUser._id}/unflag`, {}, api(token))
      toast(`✅ ${selectedUser.name} has been unflagged.`)
      fetchAll()
      setSelectedUser(prev => ({ ...prev, flaggedForReview: false, flagReason: null }))
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const handleAdjustPoints = async (e) => {
    e.preventDefault()
    const pts = parseInt(adjustPoints)
    if (isNaN(pts) || pts === 0) { toast('Enter a non-zero number (use negative to deduct)'); return }
    try {
      await axios.patch(`/api/admin/users/${selectedUser._id}/adjust-points`,
        { points: pts, note: adjustNote }, api(token))
      toast(`✅ Points ${pts > 0 ? 'added' : 'deducted'}: ${pts > 0 ? '+' : ''}${pts} pts`)
      setAdjustPoints('')
      setAdjustNote('')
      fetchAll()
      setSelectedUser(prev => ({ ...prev, points: (prev.points || 0) + pts }))
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const approveSubmission = async (id) => {
    try {
      await axios.patch(`/api/admin/submissions/${id}/approve`, {}, api(token))
      toast('✅ Submission approved — points awarded!')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const rejectSubmission = async (id) => {
    try {
      await axios.patch(`/api/admin/submissions/${id}/reject`, {}, api(token))
      toast('❌ Submission rejected.')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const createTask = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/admin/tasks', { ...newTask, points: Number(newTask.points) }, api(token))
      setNewTask({ title: '', description: '', points: '' })
      toast('✅ Task created successfully!')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
    setLoading(false)
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await axios.delete(`/api/admin/tasks/${id}`, api(token))
      toast('🗑️ Task deleted.')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const updateTaskImage = async (id) => {
    if (!editImageUrl.trim()) return
    try {
      await axios.patch(`/api/admin/tasks/${id}`, { imageUrl: editImageUrl.trim() }, api(token))
      toast('✅ Task image updated!')
      setEditingImageTaskId(null)
      setEditImageUrl('')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error') }
  }

  const patchLocalImages = async () => {
    try {
      const { data } = await axios.post('/api/admin/tasks/patch-images', {}, api(token))
      const summary = data.results.map(r => `${r.title}: ${r.status}`).join('\n')
      toast('✅ Image patch complete — check console for details')
      console.log('Patch results:\n' + summary)
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Patch failed') }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  const sendReminders = async () => {
    if (!confirm('Send reminder emails to all users who have not completed any tasks?')) return
    setSendingReminders(true)
    try {
      const { data } = await axios.post('/api/admin/send-reminders', {}, api(token))
      toast(`📧 ${data.msg}`)
    } catch (e) {
      toast(e.response?.data?.msg || 'Failed to send reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  const fulfil = async (id) => {
    setFulfillingId(id)
    try {
      await axios.patch(`/api/admin/redemptions/${id}/fulfil`,
        { fulfilmentNote: fulfilNote[id] || '' }, api(token))
      toast('✅ Redemption fulfilled — confirmation email sent to user.')
      setFulfilNote(prev => { const n = { ...prev }; delete n[id]; return n })
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error fulfilling redemption') }
    setFulfillingId(null)
  }

  const cancelRedemption = async (id) => {
    if (!confirm('Cancel this redemption and refund the points to the user?')) return
    try {
      await axios.patch(`/api/admin/redemptions/${id}/cancel`, {}, api(token))
      toast('↩ Redemption cancelled — points refunded to user.')
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error cancelling redemption') }
  }

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending')
  const replaceRewards = async () => {
    if (!confirm('This will DELETE all existing rewards and replace them with 6 PayPal cash tiers ($1–$50). This cannot be undone. Continue?')) return
    try {
      const { data } = await axios.post('/api/admin/replace-rewards', {}, api(token))
      toast(data.msg)
      fetchAll()
    } catch (e) { toast(e.response?.data?.msg || 'Error replacing rewards') }
  }

  const pending = submissions.filter(s => s.status === 'pending' || s.status === 'flagged')
  const approved = submissions.filter(s => s.status === 'approved')
  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>🌍 Green Earth<br /><span>Admin Panel</span></div>
        <nav className={styles.nav}>
          {[
            { key: 'submissions', label: '📋 Submissions', badge: pending.length },
            { key: 'tasks', label: '🌱 Tasks' },
            { key: 'users', label: '👥 Users' },
            { key: 'payments', label: '💳 Payments' },
            { key: 'redemptions', label: '🎁 Redemptions', badge: pendingRedemptions.length },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              className={`${styles.navItem} ${activeTab === key ? styles.active : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {badge > 0 && <span className={styles.badge}>{badge}</span>}
            </button>
          ))}
        </nav>
        <button className={styles.logout} onClick={logout}>🚪 Logout</button>
        <button
          className={styles.reminderBtn}
          onClick={sendReminders}
          disabled={sendingReminders}
          title="Send email reminders to users with no task submissions"
        >
          {sendingReminders ? '⏳ Sending...' : '📧 Send Reminders'}
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>
              {activeTab === 'submissions' && '📋 Submissions'}
              {activeTab === 'tasks' && '🌱 Manage Tasks'}
              {activeTab === 'users' && '👥 All Users'}
              {activeTab === 'payments' && '💳 Payment Transactions'}
              {activeTab === 'redemptions' && '🎁 Reward Redemptions'}
            </h1>
            <p>Welcome, {user.name} · Admin</p>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}><strong>{pending.length}</strong><span>Pending</span></div>
            <div className={styles.stat}><strong>{tasks.length}</strong><span>Tasks</span></div>
            <div className={styles.stat}><strong>{users.length}</strong><span>Users</span></div>
          </div>
          <button
            className={styles.reminderEmailBtn}
            onClick={sendReminders}
            disabled={sendingReminders}
            title="Send reminder emails to inactive users"
          >
            {sendingReminders ? '📧 Sending...' : '📧 Send Reminders'}
          </button>
        </header>

        {msg && <div className={styles.toast}>{msg}</div>}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <section>
            <h2 className={styles.sectionTitle}>Pending Review ({pending.length})</h2>
            {pending.length === 0
              ? <div className={styles.empty}>No pending submissions 🎉</div>
              : <div className={styles.submissionCards}>
                  {pending.map(s => (
                    <div key={s._id} className={`${styles.subCard} ${s.status === 'flagged' ? styles.flaggedCard : ''}`}>
                      {/* Proof Photo */}
                      <div className={styles.subPhotoWrap}>
                        {s.imageUrl
                          ? <img
                              src={s.imageUrl}
                              alt="proof"
                              className={styles.subPhoto}
                              onClick={() => {
                                const w = window.open()
                                w.document.write(`<img src="${s.imageUrl}" style="max-width:100%;height:auto;" />`)
                              }}
                            />
                          : <div className={styles.noPhoto}>📷 No photo</div>
                        }
                        {s.status === 'flagged' && <span className={styles.flagBadge}>🚩 Flagged</span>}
                      </div>

                      {/* Info */}
                      <div className={styles.subInfo}>
                        <div className={styles.subMeta}>
                          <div>
                            <p className={styles.subUser}><strong>{s.userId?.name}</strong></p>
                            <p className={styles.subEmail}>{s.userId?.email}</p>
                          </div>
                          <div className={styles.subPoints}>+{s.taskId?.points || 0} pts</div>
                        </div>

                        <p className={styles.subTask}>📌 Task: <strong>{s.taskId?.title || '—'}</strong></p>

                        {s.note && (
                          <div className={styles.subNote}>
                            <p className={styles.subNoteLabel}>📝 User's note:</p>
                            <p className={styles.subNoteText}>{s.note}</p>
                          </div>
                        )}

                        <p className={styles.subDate}>Submitted: {new Date(s.createdAt).toLocaleString()}</p>

                        <div className={styles.subActions}>
                          <button className={styles.approveBtn} onClick={() => approveSubmission(s._id)}>✅ Approve & Award Points</button>
                          <button className={styles.rejectBtn} onClick={() => rejectSubmission(s._id)}>❌ Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }

            <h2 className={styles.sectionTitle} style={{ marginTop: '2.5rem' }}>
              Approved ({approved.length})
            </h2>
            {approved.length === 0
              ? <div className={styles.empty}>No approved submissions yet.</div>
              : <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>User</span><span>Task</span><span>Points</span><span>Date</span>
                  </div>
                  {approved.map(s => (
                    <div key={s._id} className={`${styles.tableRow} ${styles.approvedRow}`}>
                      <span>{s.userId?.name}</span>
                      <span>{s.taskId?.title || '—'}</span>
                      <span className={styles.pts}>+{s.taskId?.points || 0} pts</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
            }
          </section>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <section>
            <h2 className={styles.sectionTitle}>Create New Task</h2>
            <form className={styles.taskForm} onSubmit={createTask}>
              <input
                placeholder="Task title" required
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              />
              <textarea
                placeholder="Description" required rows={3}
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              />
              <input
                type="number" placeholder="Points" required min={1}
                value={newTask.points}
                onChange={e => setNewTask({ ...newTask, points: e.target.value })}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : '+ Create Task'}
              </button>
            </form>

            <h2 className={styles.sectionTitle} style={{ marginTop: '2.5rem' }}>
              All Tasks ({tasks.length})
            </h2>
            <button
              className={styles.patchImagesBtn}
              onClick={patchLocalImages}
              title="Convert local upload files to base64 and save in DB"
            >
              🖼️ Patch Local Images → DB
            </button>
            <button
              className={styles.replaceRewardsBtn}
              onClick={replaceRewards}
              title="Replace all rewards with PayPal cash tiers"
            >
              💵 Replace Rewards with PayPal Tiers
            </button>
            <div className={styles.taskGrid}>
              {tasks.map(t => (
                <div key={t._id} className={styles.taskCard}>
                  {t.imageUrl && (
                    <img
                      src={t.imageUrl}
                      alt={t.title}
                      className={styles.taskCardImg}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div className={styles.taskPts}>+{t.points} pts</div>
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>

                  {editingImageTaskId === t._id ? (
                    <div className={styles.editImageRow}>
                      <input
                        type="text"
                        placeholder="/uploads/filename.jpg or https://..."
                        value={editImageUrl}
                        onChange={e => setEditImageUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateTaskImage(t._id)}
                        autoFocus
                      />
                      <button className={styles.saveBtn} onClick={() => updateTaskImage(t._id)}>💾 Save</button>
                      <button className={styles.cancelBtn} onClick={() => { setEditingImageTaskId(null); setEditImageUrl('') }}>✕</button>
                    </div>
                  ) : (
                    <button
                      className={styles.editImageBtn}
                      onClick={() => { setEditingImageTaskId(t._id); setEditImageUrl(t.imageUrl || '') }}
                    >
                      🖼️ Edit Image
                    </button>
                  )}

                  <button className={styles.deleteBtn} onClick={() => deleteTask(t._id)}>🗑️ Delete</button>
                </div>
              ))}
              {tasks.length === 0 && <div className={styles.empty}>No tasks yet. Create one above.</div>}
            </div>
          </section>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <section>
            <h2 className={styles.sectionTitle}>All Users ({users.length})</h2>
            <p className={styles.hint}>Click any user to view their full profile.</p>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Name</span><span>Email</span><span>Points</span><span>Level</span><span>Streak</span><span>Role</span>
              </div>
              {users.map(u => {
                const lvl = getLevelInfo(u.points || 0)
                return (
                  <div
                    key={u._id}
                    className={`${styles.tableRow} ${styles.clickableRow} ${u.flaggedForReview ? styles.flaggedRow : ''}`}
                    onClick={() => openUserProfile(u)}
                  >
                    <span><strong>{u.name}</strong>{u.flaggedForReview && <span className={styles.flagIcon}> 🚩</span>}</span>
                    <span>{u.email}</span>
                    <span className={styles.pts}>{u.points || 0} pts</span>
                    <span style={{ color: lvl.color, fontWeight: 700 }}>{lvl.icon} {lvl.title}</span>
                    <span>{u.streakDays || 0} 🔥</span>
                    <span>
                      {u.isAdmin
                        ? <span className={styles.adminBadge}>Admin</span>
                        : <span className={styles.userBadge}>User</span>
                      }
                    </span>
                  </div>
                )
              })}
              {users.length === 0 && <div className={styles.empty}>No users yet.</div>}
            </div>
          </section>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (() => {
          // Format amount from cents to readable string
          const fmt = (cents, currency) => {
            const major = (cents / 100).toFixed(2)
            const sym = currency === 'gbp' ? '£' : currency === 'eur' ? '€' : currency === 'ngn' ? '₦' : '$'
            return `${sym}${major}`
          }

          const filtered = paymentTypeFilter === 'all'
            ? payments
            : payments.filter(p => p.type === paymentTypeFilter)

          // Summary totals
          const totalRevenue = payments.reduce((sum, p) => sum + (p.amountTotal || 0), 0)
          const totalPoints = payments.filter(p => p.type === 'points').length
          const totalSubs   = payments.filter(p => p.type === 'subscription').length
          const totalRewards = payments.filter(p => p.type === 'reward').length

          const typeMeta = {
            points:       { label: '🌱 Points',       cls: styles.typePoints },
            subscription: { label: '👑 Premium',      cls: styles.typeSubscription },
            reward:       { label: '🎁 Reward',       cls: styles.typeReward },
          }

          return (
            <section>
              {/* Summary cards */}
              <div className={styles.paymentsSummary}>
                <div className={styles.paymentSumCard}>
                  <strong>{payments.length}</strong>
                  <span>Total Transactions</span>
                </div>
                <div className={styles.paymentSumCard}>
                  <strong>${(totalRevenue / 100).toFixed(2)}</strong>
                  <span>Total Revenue</span>
                </div>
                <div className={styles.paymentSumCard}>
                  <strong>{totalPoints}</strong>
                  <span>Points Sales</span>
                </div>
                <div className={styles.paymentSumCard}>
                  <strong>{totalSubs}</strong>
                  <span>Subscriptions</span>
                </div>
                <div className={styles.paymentSumCard}>
                  <strong>{totalRewards}</strong>
                  <span>Reward Purchases</span>
                </div>
              </div>

              {/* Filter bar */}
              <div className={styles.paymentsToolbar}>
                {['all', 'points', 'subscription', 'reward'].map(f => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${paymentTypeFilter === f ? styles.filterActive : ''}`}
                    onClick={() => setPaymentTypeFilter(f)}
                  >
                    {f === 'all' ? '🗂 All' : f === 'points' ? '🌱 Points' : f === 'subscription' ? '👑 Premium' : '🎁 Rewards'}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#888' }}>
                  {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              {filtered.length === 0
                ? <div className={styles.empty}>No payment transactions found.</div>
                : <div className={styles.paymentsTable}>
                    <div className={styles.paymentsHead}>
                      <span>User</span>
                      <span>Description</span>
                      <span>Type</span>
                      <span>Amount</span>
                      <span>Status</span>
                      <span>Date</span>
                    </div>
                    {filtered.map(p => (
                      <div key={p._id} className={styles.paymentsRow}>
                        <div>
                          <div className={styles.paymentUser}>{p.userId?.name || '—'}</div>
                          <div className={styles.paymentEmail}>{p.userId?.email || ''}</div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#424242' }}>{p.description || '—'}</span>
                        <span>
                          <span className={`${styles.paymentTypeBadge} ${typeMeta[p.type]?.cls || ''}`}>
                            {typeMeta[p.type]?.label || p.type}
                          </span>
                        </span>
                        <span className={styles.paymentAmount}>
                          {fmt(p.amountTotal || 0, p.currency || 'usd')}
                        </span>
                        <span>
                          <span className={`${styles.paymentStatusBadge} ${p.status === 'refunded' ? styles.statusRefunded : styles.statusCompleted}`}>
                            {p.status === 'refunded' ? '↩ Refunded' : '✓ Completed'}
                          </span>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#9e9e9e' }}>
                          {new Date(p.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </section>
          )
        })()}

        {/* Redemptions Tab */}
        {activeTab === 'redemptions' && (
          <section>
            {/* Summary row */}
            <div className={styles.redemptionSummary}>
              {[
                { label: 'Total', value: redemptions.length, cls: '' },
                { label: 'Pending', value: redemptions.filter(r => r.status === 'pending').length, cls: styles.rdSumPending },
                { label: 'Fulfilled', value: redemptions.filter(r => r.status === 'fulfilled').length, cls: styles.rdSumFulfilled },
                { label: 'Cancelled', value: redemptions.filter(r => r.status === 'cancelled').length, cls: styles.rdSumCancelled },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`${styles.rdSumCard} ${cls}`}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className={styles.paymentsToolbar}>
              {['all', 'pending', 'fulfilled', 'cancelled'].map(f => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${redemptionFilter === f ? styles.filterActive : ''}`}
                  onClick={() => setRedemptionFilter(f)}
                >
                  {f === 'all' ? '🗂 All' : f === 'pending' ? '⏳ Pending' : f === 'fulfilled' ? '✅ Fulfilled' : '↩ Cancelled'}
                </button>
              ))}
            </div>

            {/* Cards */}
            {(() => {
              const filtered = redemptionFilter === 'all'
                ? redemptions
                : redemptions.filter(r => r.status === redemptionFilter)

              if (filtered.length === 0) return (
                <div className={styles.empty}>No redemptions found.</div>
              )

              return (
                <div className={styles.rdList}>
                  {filtered.map(r => (
                    <div key={r._id} className={`${styles.rdCard} ${styles['rd_' + r.status]}`}>

                      {/* Top row: user + reward + status badge */}
                      <div className={styles.rdTop}>
                        <div className={styles.rdUserBlock}>
                          <div className={styles.rdAvatar}>
                            {(r.userId?.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className={styles.rdUserName}>{r.userId?.name || '—'}</p>
                            <p className={styles.rdUserEmail}>{r.userId?.email || ''}</p>
                          </div>
                        </div>
                        <span className={`${styles.rdStatusBadge} ${styles['rdStatus_' + r.status]}`}>
                          {r.status === 'pending'   && '⏳ Pending'}
                          {r.status === 'fulfilled' && '✅ Fulfilled'}
                          {r.status === 'cancelled' && '↩ Cancelled'}
                        </span>
                      </div>

                      {/* Reward details */}
                      <div className={styles.rdDetails}>
                        <div className={styles.rdDetailRow}>
                          <span className={styles.rdLabel}>🎁 Reward</span>
                          <span className={styles.rdValue}>{r.rewardId?.title || '—'}</span>
                        </div>
                        <div className={styles.rdDetailRow}>
                          <span className={styles.rdLabel}>💎 Points spent</span>
                          <span className={styles.rdValuePts}>{r.pointsSpent || 0} pts</span>
                        </div>
                        {r.deliveryInfo && (
                          <div className={styles.rdDetailRow}>
                            <span className={styles.rdLabel}>📬 Delivery info</span>
                            <span className={styles.rdValue}>{r.deliveryInfo}</span>
                          </div>
                        )}
                        <div className={styles.rdDetailRow}>
                          <span className={styles.rdLabel}>📅 Redeemed</span>
                          <span className={styles.rdValue}>{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        {r.fulfilmentNote && (
                          <div className={styles.rdNoteBox}>
                            <p className={styles.rdNoteLabel}>📋 Fulfilment note</p>
                            <p className={styles.rdNoteText}>{r.fulfilmentNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions — only for pending */}
                      {r.status === 'pending' && (
                        <div className={styles.rdActions}>
                          <div className={styles.rdFulfilRow}>
                            <input
                              className={styles.rdNoteInput}
                              placeholder="Voucher code / tracking number / payment ref…"
                              value={fulfilNote[r._id] || ''}
                              onChange={e => setFulfilNote(prev => ({ ...prev, [r._id]: e.target.value }))}
                            />
                          </div>
                          <div className={styles.rdBtnRow}>
                            <button
                              className={styles.rdFulfilBtn}
                              onClick={() => fulfil(r._id)}
                              disabled={fulfillingId === r._id}
                            >
                              {fulfillingId === r._id ? '⏳ Sending…' : '✅ Mark Fulfilled & Email User'}
                            </button>
                            <button
                              className={styles.rdCancelBtn}
                              onClick={() => cancelRedemption(r._id)}
                            >
                              ↩ Cancel & Refund Points
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )
            })()}
          </section>
        )}

        {/* User Profile Modal */}
        {selectedUser && (
          <div className={styles.profileOverlay} onClick={e => e.target === e.currentTarget && closeProfile()}>
            <div className={styles.profilePanel}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar} style={{ background: selectedUser.avatarColor || '#2e7d32' }}>
                  {(selectedUser.name || 'U')[0].toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <h2>{selectedUser.name}</h2>
                  <p>{selectedUser.email}</p>
                  {selectedUser.flaggedForReview && (
                    <span className={styles.flagBadge}>🚩 {selectedUser.flagReason === 'banned_by_admin' ? 'Banned' : 'Flagged'}</span>
                  )}
                </div>
                <button className={styles.profileClose} onClick={closeProfile}>✕</button>
              </div>

              {/* Stats */}
              <div className={styles.profileStats}>
                {(() => {
                  const lvl = getLevelInfo(selectedUser.points || 0)
                  return (
                    <>
                      <div className={styles.profileStat}>
                        <strong>{selectedUser.points || 0}</strong><span>Points</span>
                      </div>
                      <div className={styles.profileStat} style={{ color: lvl.color }}>
                        <strong>{lvl.icon} {lvl.title}</strong><span>Level {lvl.level}</span>
                      </div>
                      <div className={styles.profileStat}>
                        <strong>{selectedUser.streakDays || 0} 🔥</strong><span>Streak</span>
                      </div>
                      <div className={styles.profileStat}>
                        <strong>{selectedUser.isPremium ? '👑 Yes' : 'No'}</strong><span>Premium</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Details */}
              <div className={styles.profileDetails}>
                {[
                  { icon: '📱', label: 'Phone', value: selectedUser.phone },
                  { icon: '🌍', label: 'Country', value: selectedUser.country },
                  { icon: '🏙️', label: 'City', value: selectedUser.city },
                  { icon: '👤', label: 'Gender', value: selectedUser.gender },
                  { icon: '🎂', label: 'Date of Birth', value: selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : null },
                  { icon: '🌐', label: 'Language', value: selectedUser.preferredLanguage },
                  { icon: '📅', label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString() },
                  { icon: '🖥️', label: 'Reg. IP', value: selectedUser.registrationIp },
                ].filter(d => d.value).map(({ icon, label, value }) => (
                  <div key={label} className={styles.profileDetailRow}>
                    <span className={styles.profileDetailIcon}>{icon}</span>
                    <span className={styles.profileDetailLabel}>{label}</span>
                    <span className={styles.profileDetailValue}>{value}</span>
                  </div>
                ))}
                {selectedUser.bio && (
                  <div className={styles.profileBio}>
                    <p className={styles.profileBioLabel}>📝 Bio</p>
                    <p>{selectedUser.bio}</p>
                  </div>
                )}
              </div>

              {/* Adjust Points */}
              <div className={styles.profileSection}>
                <h3>⚡ Adjust Points</h3>
                <form className={styles.adjustForm} onSubmit={handleAdjustPoints}>
                  <input
                    type="number"
                    placeholder="e.g. +50 or -100"
                    value={adjustPoints}
                    onChange={e => setAdjustPoints(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                  />
                  <button type="submit">Apply</button>
                </form>
              </div>

              {/* Admin Actions */}
              <div className={styles.profileActions}>
                {selectedUser.flaggedForReview
                  ? <button className={styles.unflagBtn} onClick={handleUnflag}>✅ Unflag / Unban User</button>
                  : <button className={styles.banBtn} onClick={handleBan}>🚫 Ban User</button>
                }
              </div>

              {/* Submissions */}
              <div className={styles.profileSection}>
                <h3>📋 Submission History ({userSubs.length})</h3>
                {profileLoading
                  ? <p className={styles.profileLoading}>Loading...</p>
                  : userSubs.length === 0
                    ? <p className={styles.empty}>No submissions yet.</p>
                    : <div className={styles.profileSubList}>
                        {userSubs.map(s => (
                          <div key={s._id} className={`${styles.profileSubRow} ${styles[s.status]}`}>
                            <span className={styles.profileSubTask}>{s.taskId?.title || '—'}</span>
                            <span className={styles.profileSubPts}>+{s.taskId?.points || 0} pts</span>
                            <span className={styles.profileSubStatus}>
                              {s.status === 'approved' && '✅'}
                              {s.status === 'pending' && '⏳'}
                              {s.status === 'rejected' && '❌'}
                              {s.status === 'flagged' && '🚩'}
                              {' '}{s.status}
                            </span>
                            <span className={styles.profileSubDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
