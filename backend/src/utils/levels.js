// ── Green Earth Initiative — Level System (backend) ───────

const LEVELS = [
  { level: 1, title: "Seedling",         min: 0,    max: 500  },
  { level: 2, title: "Green Helper",     min: 501,  max: 1500 },
  { level: 3, title: "Eco Guardian",     min: 1501, max: 3000 },
  { level: 4, title: "Earth Champion",   min: 3001, max: 5000 },
  { level: 5, title: "Green Earth Hero", min: 5001, max: Infinity },
];

const getLevelFromPoints = (points = 0) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i].level;
  }
  return 1;
};

module.exports = { LEVELS, getLevelFromPoints };
