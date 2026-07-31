import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  const [tasks, setTasks] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [submitting, setSubmitting] = useState(null)
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => {
    axios.get('/api/tasks').then(r => setTasks(r.data)).catch(() => {})
    axios.get('/api/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (taskId) => {
    setSubmitting(taskId)
    setSubmitMsg('')
    try {
      await axios.post('/api/submit', { userId: user._id, taskId, imageUrl: '' })
      setSubmitMsg('Task submitted successfully! Points added.')
      // refresh user points
      const updated = { ...user, points: (user.points || 0) + (tasks.find(t => t._id === taskId)?.points || 0) }
      localStorage.setItem('user', JSON.stringify(updated))
      setTimeout(() => setSubmitMsg(''), 3000)
    } catch {
      setSubmitMsg('Submission failed. Try again.')
    } finally {
      setSubmitting(null)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const level = Math.floor((user.points || 0) / 100) + 1
  const progress = ((user.points || 0) % 100)

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🌍 Green Earth</div>
        <nav className={styles.sidebarNav}>
          <button className={`${styles.navItem} ${activeTab === 'tasks' ? styles.active : ''}`} onClick={() => setActiveTab('tasks')}>
            🌱 Tasks
          </button>
          <button className={`${styles.navItem} ${activeTab === 'leaderboard' ? styles.active : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🏆 Leaderboard
          </button>
          <button className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`} onClick={() => setActiveTab('profile')}>
            👤 Profile
          </button>
        </nav>
        <button className={styles.logoutBtn} onClick={logout}>🚪 Logout</button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1>Welcome back, {user.name || 'Eco Warrior'} 👋</h1>
            <p className={styles.headerSub}>Keep up the great eco work!</p>
          </div>
          <div className={styles.pointsBadge}>
            <span className={styles.pointsNum}>{user.points || 0}</span>
            <span className={styles.pointsLabel}>Points</span>
          </div>
        </header>

        {submitMsg && <div className={styles.toast}>{submitMsg}</div>}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⚡</div>
            <div>
              <div className={styles.statNum}>{user.points || 0}</div>
              <div className={styles.statLabel}>Total Points</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌟</div>
            <div>
              <div className={styles.statNum}>Level {level}</div>
              <div className={styles.statLabel}>Current Level</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div>
              <div className={styles.statNum}>{tasks.length}</div>
              <div className={styles.statLabel}>Available Tasks</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span>Level {level} Progress</span>
            <span>{progress}/100 pts to Level {level + 1}</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Tabs Content */}
        {activeTab === 'tasks' && (
          <section>
            <h2 className={styles.sectionTitle}>🌱 Available Tasks</h2>
            {tasks.length === 0
              ? <div className={styles.empty}>No tasks available yet. Check back soon!</div>
              : <div className={styles.taskGrid}>
                  {tasks.map(task => (
                    <div key={task._id} className={styles.taskCard}>
                      {task.imageUrl && (
                        <img src={task.imageUrl} alt={task.title} className={styles.taskImage} />
                      )}
                      <div className={styles.taskBody}>
                        <div className={styles.taskPoints}>+{task.points} pts</div>
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <button
                          className={styles.submitBtn}
                          onClick={() => handleSubmit(task._id)}
                          disabled={submitting === task._id}
                        >
                          {submitting === task._id ? 'Submitting...' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section>
            <h2 className={styles.sectionTitle}>🏆 Leaderboard</h2>
            <div className={styles.leaderboard}>
              {leaderboard.map((u, i) => (
                <div key={u._id} className={`${styles.leaderRow} ${u._id === user._id ? styles.myRow : ''}`}>
                  <span className={styles.rank}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className={styles.lName}>{u.name}</span>
                  <span className={styles.lPoints}>{u.points} pts</span>
                </div>
              ))}
              {leaderboard.length === 0 && <div className={styles.empty}>No data yet. Be the first!</div>}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section>
            <h2 className={styles.sectionTitle}>👤 My Profile</h2>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>{(user.name || 'U')[0].toUpperCase()}</div>
              <div className={styles.profileInfo}>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <div className={styles.profileStats}>
                  <div><strong>{user.points || 0}</strong><span>Points</span></div>
                  <div><strong>Level {level}</strong><span>Rank</span></div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
