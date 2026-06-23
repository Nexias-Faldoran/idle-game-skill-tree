// Game state
const gameState = {
    skills: {
        slash: { level: 0, points: 0 },
        fireball: { level: 0, points: 0 },
        inferno: { level: 0, points: 0 },
        armor: { level: 0, points: 0 },
        shield: { level: 0, points: 0 },
        fortitude: { level: 0, points: 0 },
        efficiency: { level: 0, points: 0 },
        discipline: { level: 0, points: 0 },
        mastery: { level: 0, points: 0 }
    },
    skillPoints: 0
};

// Skill definitions
const skillDefinitions = {
    slash: {
        name: 'Slash',
        branch: 'offense',
        description: 'Increase melee damage by 5% per level',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: `Damage: +${level * 5}%`,
            points: 0
        })
    },
    fireball: {
        name: 'Fireball',
        branch: 'offense',
        description: 'Deal 10 fire damage per level',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: `Damage: ${level * 10}`,
            points: 0
        })
    },
    inferno: {
        name: 'Inferno',
        branch: 'offense',
        description: 'Requires Fireball Lv3. Deal 25 fire damage per level',
        maxLevel: 10,
        prerequisites: [{ skill: 'fireball', level: 3 }],
        calculate: (level) => ({
            stat: `Damage: ${level * 25}`,
            points: 0
        })
    },
    armor: {
        name: 'Armor',
        branch: 'defense',
        description: 'Increase defense by 3 per level',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: `Defense: +${level * 3}`,
            points: 0
        })
    },
    shield: {
        name: 'Shield Mastery',
        branch: 'defense',
        description: 'Block 5% damage per level',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: `Block: ${level * 5}%`,
            points: 0
        })
    },
    fortitude: {
        name: 'Fortitude',
        branch: 'defense',
        description: 'Requires Armor Lv2 & Shield Lv2. Reduce all damage by 2% per level',
        maxLevel: 10,
        prerequisites: [
            { skill: 'armor', level: 2 },
            { skill: 'shield', level: 2 }
        ],
        calculate: (level) => ({
            stat: `Damage Reduction: ${level * 2}%`,
            points: 0
        })
    },
    efficiency: {
        name: 'Efficiency',
        branch: 'utility',
        description: 'Generate 2 skill points per level',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: `Points/s: +${level * 2}`,
            points: level * 2
        })
    },
    discipline: {
        name: 'Discipline',
        branch: 'utility',
        description: 'Gain 1 skill point per 10 seconds',
        maxLevel: 10,
        prerequisites: [],
        calculate: (level) => ({
            stat: 'Passive: +1 pts/10s',
            points: 1
        })
    },
    mastery: {
        name: 'Mastery',
        branch: 'utility',
        description: 'Requires Efficiency Lv3 & Discipline Lv3. Gain 10% more skill points',
        maxLevel: 10,
        prerequisites: [
            { skill: 'efficiency', level: 3 },
            { skill: 'discipline', level: 3 }
        ],
        calculate: (level) => ({
            stat: `Bonus: +${level * 10}%`,
            points: 0
        })
    }
};

// Check if prerequisites are met
function checkPrerequisites(skillName) {
    const def = skillDefinitions[skillName];
    if (!def.prerequisites || def.prerequisites.length === 0) {
        return true;
    }

    return def.prerequisites.every(prereq => {
        return gameState.skills[prereq.skill].level >= prereq.level;
    });
}

// Upgrade skill
function upgradeSkill(skillName) {
    const skill = gameState.skills[skillName];
    const def = skillDefinitions[skillName];

    // Check max level
    if (skill.level >= def.maxLevel) {
        return;
    }

    // Check prerequisites
    if (!checkPrerequisites(skillName)) {
        return;
    }

    // Upgrade skill
    skill.level++;
    gameState.skillPoints++;

    // Update UI
    updateSkillDisplay(skillName);
    updateStats();
    updateLockStates();
    saveGame();
}

// Update skill display
function updateSkillDisplay(skillName) {
    const skill = gameState.skills[skillName];
    const def = skillDefinitions[skillName];
    const calc = def.calculate(skill.level);

    document.getElementById(`level-${skillName}`).textContent = skill.level;
    document.getElementById(`stats-${skillName}`).textContent = calc.stat;
}

// Update all stats
function updateStats() {
    const totalLevel = Object.values(gameState.skills).reduce((sum, s) => sum + s.level, 0);
    document.getElementById('totalLevel').textContent = totalLevel;
    document.getElementById('skillPoints').textContent = gameState.skillPoints;
}

// Update lock states
function updateLockStates() {
    Object.keys(gameState.skills).forEach(skillName => {
        const btn = document.querySelector(`[data-skill="${skillName}"] .upgrade-btn`);
        const skill = gameState.skills[skillName];
        const def = skillDefinitions[skillName];
        const prerequisitesMet = checkPrerequisites(skillName);
        const maxLevelReached = skill.level >= def.maxLevel;

        if (maxLevelReached) {
            btn.textContent = 'Max Level';
            btn.disabled = true;
        } else if (!prerequisitesMet) {
            btn.textContent = 'Locked';
            btn.disabled = true;
        } else {
            btn.textContent = 'Upgrade';
            btn.disabled = false;
        }
    });
}

// Reset tree
function resetTree() {
    if (confirm('Are you sure you want to reset the skill tree? This cannot be undone!')) {
        Object.keys(gameState.skills).forEach(skill => {
            gameState.skills[skill] = { level: 0, points: 0 };
        });
        gameState.skillPoints = 0;

        Object.keys(gameState.skills).forEach(skillName => {
            updateSkillDisplay(skillName);
        });
        updateStats();
        updateLockStates();
        saveGame();
    }
}

// Passive income
function generatePassiveIncome() {
    const disciplineLevel = gameState.skills.discipline.level;
    if (disciplineLevel > 0) {
        gameState.skillPoints += disciplineLevel;
        updateStats();
    }
}

// Active income
function generateActiveIncome() {
    const efficiencyLevel = gameState.skills.efficiency.level;
    if (efficiencyLevel > 0) {
        let bonus = gameState.skillPoints * (gameState.skills.mastery.level * 0.1);
        gameState.skillPoints += efficiencyLevel * 2 + bonus;
        updateStats();
    }
}

// Save game
function saveGame() {
    localStorage.setItem('skilltreeGame', JSON.stringify(gameState));
}

// Load game
function loadGame() {
    const saved = localStorage.getItem('skilltreeGame');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
        Object.keys(gameState.skills).forEach(skillName => {
            updateSkillDisplay(skillName);
        });
        updateStats();
        updateLockStates();
    }
}

// Initialize game
function init() {
    loadGame();
    updateLockStates();

    // Passive income every 10 seconds
    setInterval(generatePassiveIncome, 10000);

    // Active income every second
    setInterval(generateActiveIncome, 1000);
}

// Start the game
init();