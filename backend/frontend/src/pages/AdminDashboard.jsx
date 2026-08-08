import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './AdminDashboard.module.css'

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
  const [newTask, setNewTask] = useState({ title: '', description: '', points: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user.isAdmin) { navigate('/dashboard'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [s, t, u] = await Promise.all([
        axios.get('/api/admin/submissions', api(token)),
        axios.get('/api/tasks'),
        axios.get('/api/admin/users', api(token)),
      ])
      setSubmissions(s.data)
      setTasks(t.data)
      setUsers(u.data)
    } catch { navigate('/login') }
  }

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

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

  const logout = () => {
    localStorage.clear()
    navigate('/')
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
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>
              {activeTab === 'submissions' && '📋 Submissions'}
              {activeTab === 'tasks' && '🌱 Manage Tasks'}
              {activeTab === 'users' && '👥 All Users'}
            </h1>
            <p>Welcome, {user.name} · Admin</p>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}><strong>{pending.length}</strong><span>Pending</span></div>
            <div className={styles.stat}><strong>{tasks.length}</strong><span>Tasks</span></div>
            <div className={styles.stat}><strong>{users.length}</strong><span>Users</span></div>
          </div>
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
            <div className={styles.taskGrid}>
              {tasks.map(t => (
                <div key={t._id} className={styles.taskCard}>
                  <div className={styles.taskPts}>+{t.points} pts</div>
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>
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
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Name</span><span>Email</span><span>Points</span><span>Level</span><span>Role</span>
              </div>
              {users.map(u => (
                <div key={u._id} className={styles.tableRow}>
                  <span><strong>{u.name}</strong></span>
                  <span>{u.email}</span>
                  <span className={styles.pts}>{u.points} pts</span>
                  <span>Level {u.level}</span>
                  <span>
                    {u.isAdmin
                      ? <span className={styles.adminBadge}>Admin</span>
                      : <span className={styles.userBadge}>User</span>
                    }
                  </span>
                </div>
              ))}
              {users.length === 0 && <div className={styles.empty}>No users yet.</div>}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
