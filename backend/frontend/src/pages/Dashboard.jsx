import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Dashboard.module.css'
import SubmitModal from '../components/SubmitModal'
import RewardsTab from '../components/RewardsTab'
import ProfileTab from '../components/ProfileTab'

export default function Dashboard() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const token = localStorage.getItem('token')

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

  const [tasks, setTasks] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [taskCategory, setTaskCategory] = useState('all')
  const [submitMsg, setSubmitMsg] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const filteredTasks = taskCategory === 'all' ? tasks : tasks.filter(t => t.category === taskCategory)

  const refreshUser = async () => {
    try {
      const { data } = await axios.get('/api/me')
      setCurrentUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch {}
  }

  useEffect(() => {
    axios.get('/api/tasks').then(r => setTasks(r.data)).catch(() => {})
    axios.get('/api/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {})
    axios.get('/api/my-submissions').then(r => setMySubmissions(r.data)).catch(() => {})
    refreshUser()

    // Poll for point updates every 30 seconds
    const interval = setInterval(() => {
      refreshUser()
      axios.get('/api/my-submissions').then(r => setMySubmissions(r.data)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmitSuccess = () => {
    setSelectedTask(null)
    setSubmitMsg('✅ Proof submitted! Awaiting admin approval.')
    setTimeout(() => setSubmitMsg(''), 5000)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const level = Math.floor((currentUser.points || 0) / 100) + 1
  const progress = (currentUser.points || 0) % 100

  return (
    <div className={styles.page}>

      {/* Submit Modal */}
      {selectedTask && (
        <SubmitModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}

      {/* Sidebar / Bottom Nav */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🌍 Green Earth</div>
        <nav className={styles.sidebarNav}>
          <button className={`${styles.navItem} ${activeTab === 'tasks' ? styles.active : ''}`} onClick={() => setActiveTab('tasks')}>
            🌱 Tasks
          </button>
          <button className={`${styles.navItem} ${activeTab === 'submissions' ? styles.active : ''}`} onClick={() => setActiveTab('submissions')}>
            📋 My Submissions
          </button>
          <button className={`${styles.navItem} ${activeTab === 'rewards' ? styles.active : ''}`} onClick={() => setActiveTab('rewards')}>
            🎁 Rewards
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

      {/* Main Content */}
      <main className={styles.main}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1>Welcome back, {currentUser.name || 'Eco Warrior'} 👋</h1>
            <p className={styles.headerSub}>Keep up the great eco work!</p>
          </div>
          <div className={styles.pointsBadge}>
            <span className={styles.pointsNum}>{currentUser.points || 0}</span>
            <span className={styles.pointsLabel}>Points</span>
          </div>
        </header>

        {submitMsg && <div className={styles.toast}>{submitMsg}</div>}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⚡</div>
            <div>
              <div className={styles.statNum}>{currentUser.points || 0}</div>
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

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <section>
            <h2 className={styles.sectionTitle}>🌱 Available Tasks</h2>

            <div className={styles.categoryTabs}>
              {['all', 'general', 'children', 'hard'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${taskCategory === cat ? styles.catActive : ''}`}
                  onClick={() => setTaskCategory(cat)}
                >
                  {cat === 'all' && '🌍 All'}
                  {cat === 'general' && '🌿 General'}
                  {cat === 'children' && '🧒 Kids'}
                  {cat === 'hard' && '🔥 Challenge'}
                </button>
              ))}
            </div>

            {filteredTasks.length === 0
              ? <div className={styles.empty}>No tasks in this category yet.</div>
              : <div className={styles.taskGrid}>
                  {filteredTasks.map(task => (
                    <div key={task._id} className={styles.taskCard}>
                      {task.imageUrl && (
                        <img src={task.imageUrl} alt={task.title} className={styles.taskImage} />
                      )}
                      <div className={styles.taskBody}>
                        <div className={styles.taskPoints}>+{task.points} pts</div>
                        {task.category === 'children' && <span className={styles.kidsTag}>🧒 Kids</span>}
                        {task.category === 'hard' && <span className={styles.hardTag}>🔥 Challenge</span>}
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <button
                          className={styles.submitBtn}
                          onClick={() => setSelectedTask(task)}
                        >
                          📷 Submit Proof
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </section>
        )}

        {/* ── Submissions Tab ── */}
        {activeTab === 'submissions' && (
          <section>
            <h2 className={styles.sectionTitle}>📋 My Submissions</h2>
            {mySubmissions.length === 0
              ? <div className={styles.empty}>You haven't submitted any tasks yet. Complete a task to get started!</div>
              : <div className={styles.submissionList}>
                  {mySubmissions.map(sub => (
                    <div key={sub._id} className={styles.submissionRow}>
                      {sub.imageUrl && (
                        <img
                          src={sub.imageUrl}
                          alt="proof"
                          className={styles.subThumb}
                        />
                      )}
                      <div className={styles.subInfo}>
                        <p className={styles.subTask}>{sub.taskId?.title || 'Task'}</p>
                        <p className={styles.subNote}>{sub.note || 'No note added'}</p>
                        <p className={styles.subDate}>{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`${styles.subStatus} ${styles[sub.status]}`}>
                        {sub.status === 'pending' && '⏳ Pending'}
                        {sub.status === 'approved' && '✅ Approved'}
                        {sub.status === 'rejected' && '❌ Rejected'}
                        {sub.status === 'flagged' && '🚩 Under Review'}
                        {sub.status === 'approved' && (
                          <span className={styles.subPoints}>+{sub.taskId?.points} pts</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </section>
        )}

        {/* ── Rewards Tab ── */}
        {activeTab === 'rewards' && (
          <section>
            <h2 className={styles.sectionTitle}>🎁 Rewards Store</h2>
            <RewardsTab
              currentUser={currentUser}
              onPointsUpdate={(newPoints) => {
                const updated = { ...currentUser, points: newPoints }
                setCurrentUser(updated)
                localStorage.setItem('user', JSON.stringify(updated))
              }}
            />
          </section>
        )}

        {/* ── Leaderboard Tab ── */}
        {activeTab === 'leaderboard' && (
          <section>
            <h2 className={styles.sectionTitle}>🏆 Leaderboard</h2>
            <div className={styles.leaderboard}>
              {leaderboard.map((u, i) => (
                <div key={u._id} className={`${styles.leaderRow} ${u._id === currentUser._id ? styles.myRow : ''}`}>
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

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <ProfileTab currentUser={currentUser} onUpdate={(updated) => {
            setCurrentUser(updated)
            localStorage.setItem('user', JSON.stringify(updated))
          }} />
        )}

      </main>
    </div>
  )
}
