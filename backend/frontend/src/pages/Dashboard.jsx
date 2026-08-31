import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Dashboard.module.css'
import SubmitModal from '../components/SubmitModal'
import RewardsTab from '../components/RewardsTab'
import ProfileTab from '../components/ProfileTab'
import ShopTab from '../components/ShopTab'
import QuizModal from '../components/QuizModal'
import DailyChallenge from '../components/DailyChallenge'
import SevenDayChallenge from '../components/SevenDayChallenge'
import StreakCard from '../components/StreakCard'
import ScreenFreeGame from '../components/ScreenFreeGame'
import { getLevelInfo, getLevelProgress, pointsToNextLevel } from '../utils/levels'

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
  const [showScreenFreeGame, setShowScreenFreeGame] = useState(false)

  const handleStartTask = (task) => {
    if (task.title === 'Have a Screen-Free Outdoor Day') {
      setShowScreenFreeGame(true)
    } else {
      setSelectedTask(task)
    }
  }

  const filteredTasks = taskCategory === 'all' ? tasks : tasks.filter(t => t.category === taskCategory)

  const levelInfo    = getLevelInfo(currentUser.points || 0)
  const levelPct     = getLevelProgress(currentUser.points || 0)
  const ptsToNext    = pointsToNextLevel(currentUser.points || 0)

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

    // Handle Stripe redirect feedback
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment === 'success') {
      const pts = params.get('points')
      setSubmitMsg(`✅ Payment successful! ${pts ? `+${pts} points added to your balance.` : 'Thank you!'}`)
      refreshUser()
      window.history.replaceState({}, '', '/dashboard')
    } else if (payment === 'premium_success') {
      setSubmitMsg('👑 Welcome to Premium! 200 bonus points have been added to your account.')
      refreshUser()
      window.history.replaceState({}, '', '/dashboard')
    } else if (payment === 'reward_success') {
      setSubmitMsg('🎁 Purchase successful! Your reward will be delivered within 14–28 business days.')
      window.history.replaceState({}, '', '/dashboard')
    }
    // Note: ?payment=cancelled is intentionally not shown — users who cancel
    // Stripe checkout are simply returned to the dashboard with no message.
    if (payment) {
      window.history.replaceState({}, '', '/dashboard')
    }

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

      {/* Screen-Free Outdoor Day Game */}
      {showScreenFreeGame && (
        <ScreenFreeGame
          token={token}
          onClose={() => setShowScreenFreeGame(false)}
          onComplete={(pts) => {
            setShowScreenFreeGame(false)
            setSubmitMsg(`🌿 Outdoor time logged! +${pts} eco points added.`)
            setTimeout(() => setSubmitMsg(''), 6000)
            refreshUser()
            fetchData()
          }}
        />
      )}

      {/* Submit Modal */}
      {selectedTask && selectedTask.taskType === 'quiz' ? (
        <QuizModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={(pointsAwarded) => {
            setSelectedTask(null)
            setSubmitMsg(`🎉 Quiz passed! +${pointsAwarded} points added to your balance.`)
            setTimeout(() => setSubmitMsg(''), 5000)
            refreshUser()
          }}
        />
      ) : selectedTask ? (
        <SubmitModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSubmitSuccess}
        />
      ) : null}

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
          <button className={`${styles.navItem} ${activeTab === 'shop' ? styles.active : ''}`} onClick={() => setActiveTab('shop')}>
            🛒 Shop
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
          {(currentUser.streakDays || 0) >= 2 && (
            <div className={styles.streakBadge}>
              <span className={styles.streakNum}>🔥 {currentUser.streakDays}</span>
              <span className={styles.streakLabel}>day streak</span>
            </div>
          )}
        </header>

        {submitMsg && <div className={styles.toast}>{submitMsg}</div>}

        {/* ── Task Reminder Banner ── */}
        {mySubmissions.length === 0 && (
          <div className={styles.reminderBanner}>
            <div className={styles.reminderIcon}>🌱</div>
            <div className={styles.reminderText}>
              <strong>You haven't completed any tasks yet!</strong>
              <p>Start your eco journey — pick a task, take a photo, and submit your proof to earn points and climb the leaderboard.</p>
            </div>
            <button
              className={styles.reminderBtn}
              onClick={() => setActiveTab('tasks')}
            >
              Start Now →
            </button>
          </div>
        )}

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
              <div className={styles.statNum}>{levelInfo.icon} {levelInfo.title}</div>
              <div className={styles.statLabel}>Level {levelInfo.level}</div>
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
            <span
              className={styles.levelBadge}
              style={{ background: levelInfo.bg, color: levelInfo.color }}
            >
              {levelInfo.icon} {levelInfo.title}
            </span>
            <span className={styles.progressRight}>
              {ptsToNext
                ? `${ptsToNext} pts to Level ${levelInfo.level + 1}`
                : '👑 Maximum Level Reached!'}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${levelPct}%`, background: levelInfo.color }}
            />
          </div>
          <div className={styles.progressFooter}>
            <span>Level {levelInfo.level}</span>
            <span>{levelPct}%</span>
            {levelInfo.level < 5 && <span>Level {levelInfo.level + 1}</span>}
          </div>
        </div>

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <section>
            <h2 className={styles.sectionTitle}>🌱 Available Tasks</h2>

            {/* Daily Challenge */}
            <DailyChallenge
              currentUser={currentUser}
              onStartTask={(task) => handleStartTask(task)}
            />

            {/* 7-Day Green Champion Challenge */}
            <SevenDayChallenge
              onPointsUpdate={refreshUser}
            />

            {/* Green Streak Milestones */}
            <StreakCard />

            <div className={styles.categoryTabs}>
              {['all', 'general', 'domestic', 'water', 'energy', 'waste', 'community', 'family', 'school', 'education', 'health', 'children', 'hard'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${taskCategory === cat ? styles.catActive : ''}`}
                  onClick={() => setTaskCategory(cat)}
                >
                  {cat === 'all' && '🌍 All'}
                  {cat === 'general' && '🌿 General'}
                  {cat === 'domestic' && '🏠 Domestic'}
                  {cat === 'water' && '💧 Water'}
                  {cat === 'energy' && '⚡ Energy'}
                  {cat === 'waste' && '🚮 Waste'}
                  {cat === 'community' && '🌳 Community'}
                  {cat === 'family' && '👨‍👩‍👧‍👦 Family'}
                  {cat === 'school' && '🎓 School'}
                  {cat === 'education' && '📚 Education'}
                  {cat === 'health' && '🏃 Health'}
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
                        {task.category === 'domestic' && <span className={styles.domesticTag}>🏠 Domestic</span>}
                        {task.category === 'water' && <span className={styles.waterTag}>💧 Water</span>}
                        {task.category === 'energy' && <span className={styles.energyTag}>⚡ Energy</span>}
                        {task.category === 'waste' && <span className={styles.wasteTag}>🚮 Waste</span>}
                        {task.category === 'community' && <span className={styles.communityTag}>🌳 Community</span>}
                        {task.category === 'family' && <span className={styles.familyTag}>👨‍👩‍👧‍👦 Family</span>}
                        {task.category === 'school' && <span className={styles.schoolTag}>🎓 School</span>}
                        {task.category === 'children' && <span className={styles.kidsTag}>🧒 Kids</span>}
                        {task.category === 'education' && <span className={styles.educationTag}>📚 Education</span>}
                        {task.category === 'health' && <span className={styles.healthTag}>🏃 Health</span>}
                        {task.category === 'hard' && <span className={styles.hardTag}>🔥 Challenge</span>}
                        {task.proofLevel === 'enhanced' && <span className={styles.enhancedTag}>📝 Note Required</span>}
                        {task.proofLevel === 'verified' && <span className={styles.verifiedTag}>🔍 Admin Verified</span>}
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <button
                          className={styles.submitBtn}
                          onClick={() => handleStartTask(task)}
                        >
                          {task.taskType === 'quiz' ? '📚 Take Quiz' : task.title === 'Have a Screen-Free Outdoor Day' ? '🌳 Start Challenge' : '📷 Submit Proof'}
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
              {leaderboard.map((u, i) => {
                const uLevel = getLevelInfo(u.points || 0)
                return (
                  <div key={u._id} className={`${styles.leaderRow} ${u._id === currentUser._id ? styles.myRow : ''}`}>
                    <span className={styles.rank}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className={styles.lName}>{u.name}</span>
                    <span
                      className={styles.lLevel}
                      style={{ color: uLevel.color }}
                    >{uLevel.icon} {uLevel.title}</span>
                    <span className={styles.lPoints}>{u.points} pts</span>
                  </div>
                )
              })}
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

        {/* ── Shop Tab ── */}
        {activeTab === 'shop' && (
          <section>
            <h2 className={styles.sectionTitle}>🛒 Shop</h2>
            <ShopTab
              currentUser={currentUser}
              onPointsUpdate={(newPoints) => {
                const updated = { ...currentUser, points: newPoints }
                setCurrentUser(updated)
                localStorage.setItem('user', JSON.stringify(updated))
              }}
            />
          </section>
        )}

      </main>
    </div>
  )
}
