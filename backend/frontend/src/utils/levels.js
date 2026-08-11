// ── Green Earth Initiative — Level System ─────────────────

export const LEVELS = [
  { level: 1, title: "Seedling",       icon: "🌱", min: 0,    max: 500,  color: "#a5d6a7", bg: "#e8f5e9" },
  { level: 2, title: "Green Helper",   icon: "🌿", min: 501,  max: 1500, color: "#66bb6a", bg: "#dcedc8" },
  { level: 3, title: "Eco Guardian",   icon: "🌳", min: 1501, max: 3000, color: "#2e7d32", bg: "#c8e6c9" },
  { level: 4, title: "Earth Champion", icon: "🌍", min: 3001, max: 5000, color: "#1565c0", bg: "#bbdefb" },
  { level: 5, title: "Green Earth Hero", icon: "👑", min: 5001, max: Infinity, color: "#f57f17", bg: "#fff8e1" },
]

/**
 * Get the level info object for a given points value.
 */
export const getLevelInfo = (points = 0) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

/**
 * Get progress percentage within the current level band.
 * Returns 0–100.
 */
export const getLevelProgress = (points = 0) => {
  const info = getLevelInfo(points)
  if (info.max === Infinity) return 100
  const range = info.max - info.min
  const earned = points - info.min
  return Math.min(100, Math.round((earned / range) * 100))
}

/**
 * Points needed to reach the next level.
 */
export const pointsToNextLevel = (points = 0) => {
  const info = getLevelInfo(points)
  if (info.max === Infinity) return null
  return info.max - points + 1
}
