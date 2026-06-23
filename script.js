// Default skill definitions
const defaultSkillDefinitions = {
    slash: {
        name: 'Slash',
        branch: 'offense',
        description: 'Increase melee damage by 5% per level',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Damage: +{level * 5}%',
        formula: '{level * 5}',
        pointsFormula: 0
    },
    fireball: {
        name: 'Fireball',
        branch: 'offense',
        description: 'Deal 10 fire damage per level',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Damage: {level * 10}',
        formula: '{level * 10}',
        pointsFormula: 0
    },
    inferno: {
        name: 'Inferno',
        branch: 'offense',
        description: 'Requires Fireball Lv3. Deal 25 fire damage per level',
        maxLevel: 10,
        prerequisites: [{ skill: 'fireball', level: 3 }],
        statDisplay: 'Damage: {level * 25}',
        formula: '{level * 25}',
        pointsFormula: 0
    },
    armor: {
        name: 'Armor',
        branch: 'defense',
        description: 'Increase defense by 3 per level',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Defense: +{level * 3}',
        formula: '{level * 3}',
        pointsFormula: 0
    },
    shield: {
        name: 'Shield Mastery',
        branch: 'defense',
        description: 'Block 5% damage per level',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Block: {level * 5}%',
        formula: '{level * 5}',
        pointsFormula: 0
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
        statDisplay: 'Damage Reduction: {level * 2}%',
        formula: '{level * 2}',
        pointsFormula: 0
    },
    efficiency: {
        name: 'Efficiency',
        branch: 'utility',
        description: 'Generate 2 skill points per level',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Points/s: +{level * 2}',
        formula: '{level * 2}',
        pointsFormula: 2
    },
    discipline: {
        name: 'Discipline',
        branch: 'utility',
        description: 'Gain 1 skill point per 10 seconds',
        maxLevel: 10,
        prerequisites: [],
        statDisplay: 'Passive: +1 pts/10s',
        formula: '1',
        pointsFormula: 1
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
        statDisplay: 'Bonus: +{level * 10}%',
        formula: '{level * 10}',
        pointsFormula: 0
    }
};

// Game state
const gameState = {
    skills: {},
    skillPoints: 0,
    skillDefinitions: {}
};

let currentBranch = 'offense';
let editingSkill = null;

// Initialize game
function init() {
    loadGame();
    if (Object.keys(gameState.skillDefinitions).length === 0) {
        gameState.skillDefinitions = JSON.parse(JSON.stringify(defaultSkillDefinitions));
        initializeSkillLevels();
        saveGame();
    }
    updateLockStates();
    setupEditor();
    renderGameView();

    // Passive income every 10 seconds
    setInterval(generatePassiveIncome, 10000);
    // Active income every second
    setInterval(generateActiveIncome, 1000);
}

function initializeSkillLevels() {
    Object.keys(gameState.skillDefinitions).forEach(skillName => {
        if (!gameState.skills[skillName]) {
            gameState.skills[skillName] = { level: 0 };
        }
    });
}

// Calculate stat value from formula
function calculateStat(formula, level) {
    try {
        return eval(formula.replace(/{level}/g, level));
    } catch (e) {
        return 0;
    }
}

// Format stat display
function formatStatDisplay(statDisplay, level) {
    return statDisplay.replace(/{level}/g, level).replace(/{[^}]+}/g, (match) => {
        const formula = match.slice(1, -1);
        return calculateStat(formula, level);
    });
}

// Check if prerequisites are met
function checkPrerequisites(skillName) {
    const def = gameState.skillDefinitions[skillName];
    if (!def || !def.prerequisites || def.prerequisites.length === 0) {
        return true;
    }

    return def.prerequisites.every(prereq => {
        return gameState.skills[prereq.skill]?.level >= prereq.level;
    });
}

// Upgrade skill
function upgradeSkill(skillName) {
    const skill = gameState.skills[skillName];
    const def = gameState.skillDefinitions[skillName];

    if (!def) return;

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
    renderGameView();
    saveGame();
}

// Update skill display
function updateSkillDisplay(skillName) {
    const skill = gameState.skills[skillName];
    const def = gameState.skillDefinitions[skillName];
    if (!def) return;

    const formattedStat = formatStatDisplay(def.statDisplay, skill.level);
    const element = document.getElementById(`stats-${skillName}`);
    const levelElement = document.getElementById(`level-${skillName}`);
    
    if (element) element.textContent = formattedStat;
    if (levelElement) levelElement.textContent = skill.level;
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
        if (!btn) return;

        const skill = gameState.skills[skillName];
        const def = gameState.skillDefinitions[skillName];
        if (!def) return;

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

// Render game view
function renderGameView() {
    const gameView = document.getElementById('gameView');
    const branches = ['offense', 'defense', 'utility'];
    const branchEmojis = { offense: '⚡', defense: '🛡️', utility: '✨' };
    const branchNames = { offense: 'Offense', defense: 'Defense', utility: 'Utility' };

    gameView.innerHTML = '';

    branches.forEach(branchName => {
        const branch = document.createElement('div');
        branch.className = 'branch';

        const title = document.createElement('h2');
        title.className = 'branch-title';
        title.textContent = `${branchEmojis[branchName]} ${branchNames[branchName]}`;
        branch.appendChild(title);

        Object.entries(gameState.skillDefinitions).forEach(([skillId, skillDef]) => {
            if (skillDef.branch === branchName) {
                const skill = gameState.skills[skillId];
                const node = document.createElement('div');
                node.className = 'skill-node';
                node.setAttribute('data-skill', skillId);
                node.setAttribute('data-branch', branchName);

                const headerDiv = document.createElement('div');
                headerDiv.className = 'node-header';

                const h3 = document.createElement('h3');
                h3.textContent = skillDef.name;
                headerDiv.appendChild(h3);

                const badge = document.createElement('span');
                badge.className = 'level-badge';
                badge.id = `level-${skillId}`;
                badge.textContent = skill?.level || 0;
                headerDiv.appendChild(badge);

                node.appendChild(headerDiv);

                const desc = document.createElement('p');
                desc.className = 'node-description';
                desc.textContent = skillDef.description;
                node.appendChild(desc);

                const stats = document.createElement('div');
                stats.className = 'node-stats';
                stats.id = `stats-${skillId}`;
                stats.textContent = formatStatDisplay(skillDef.statDisplay, skill?.level || 0);
                node.appendChild(stats);

                const btn = document.createElement('button');
                btn.className = 'upgrade-btn';
                btn.textContent = 'Upgrade';
                btn.onclick = () => upgradeSkill(skillId);
                node.appendChild(btn);

                branch.appendChild(node);
            }
        });

        gameView.appendChild(branch);
    });

    updateLockStates();
}

// Reset tree
function resetTree() {
    if (confirm('Are you sure you want to reset the skill tree? This cannot be undone!')) {
        Object.keys(gameState.skills).forEach(skillName => {
            gameState.skills[skillName].level = 0;
        });
        gameState.skillPoints = 0;

        updateStats();
        updateLockStates();
        renderGameView();
        saveGame();
    }
}

// Passive income
function generatePassiveIncome() {
    const disciplineLevel = gameState.skills['discipline']?.level || 0;
    if (disciplineLevel > 0) {
        gameState.skillPoints += disciplineLevel;
        updateStats();
    }
}

// Active income
function generateActiveIncome() {
    const efficiencyLevel = gameState.skills['efficiency']?.level || 0;
    const masteryLevel = gameState.skills['mastery']?.level || 0;
    if (efficiencyLevel > 0) {
        let bonus = gameState.skillPoints * (masteryLevel * 0.1);
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
        const loaded = JSON.parse(saved);
        gameState.skillPoints = loaded.skillPoints;
        gameState.skills = loaded.skills;
        gameState.skillDefinitions = loaded.skillDefinitions || {};
    }
}

// EDITOR FUNCTIONS

function toggleEditor() {
    const panel = document.getElementById('editorPanel');
    panel.classList.toggle('hidden');
}

function selectBranch(branch) {
    currentBranch = branch;
    document.getElementById('currentBranch').textContent = 
        branch.charAt(0).toUpperCase() + branch.slice(1);
    
    document.querySelectorAll('.branch-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderSkillsList();
}

function renderSkillsList() {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';

    Object.entries(gameState.skillDefinitions).forEach(([skillId, skillDef]) => {
        if (skillDef.branch === currentBranch) {
            const item = document.createElement('div');
            item.className = 'skill-item';
            
            const name = document.createElement('span');
            name.className = 'skill-item-name';
            name.textContent = skillDef.name;
            
            const btn = document.createElement('button');
            btn.className = 'skill-item-button';
            btn.textContent = 'Edit';
            btn.onclick = (e) => {
                e.stopPropagation();
                editSkill(skillId);
            };
            
            item.appendChild(name);
            item.appendChild(btn);
            item.onclick = () => editSkill(skillId);
            skillsList.appendChild(item);
        }
    });
}

function addNewSkill() {
    editingSkill = null;
    const skillEditorForm = document.getElementById('skillEditorForm');
    skillEditorForm.reset();
    document.getElementById('prerequisitesList').innerHTML = '';
    document.getElementById('deleteSkillBtn').style.display = 'none';
    document.getElementById('skillEditorSection').style.display = 'block';
}

function editSkill(skillId) {
    editingSkill = skillId;
    const skillDef = gameState.skillDefinitions[skillId];
    
    document.getElementById('editName').value = skillDef.name;
    document.getElementById('editDescription').value = skillDef.description;
    document.getElementById('editMaxLevel').value = skillDef.maxLevel;
    document.getElementById('editStatDisplay').value = skillDef.statDisplay;
    document.getElementById('editFormula').value = skillDef.formula;
    document.getElementById('editPointsFormula').value = skillDef.pointsFormula;

    // Load prerequisites
    const prereqList = document.getElementById('prerequisitesList');
    prereqList.innerHTML = '';
    if (skillDef.prerequisites && skillDef.prerequisites.length > 0) {
        skillDef.prerequisites.forEach(prereq => {
            addPrerequisiteUI(prereq.skill, prereq.level);
        });
    }

    document.getElementById('deleteSkillBtn').style.display = 'block';
    document.getElementById('skillEditorSection').style.display = 'block';
}

function addPrerequisite() {
    addPrerequisiteUI('', 1);
}

function addPrerequisiteUI(skillName = '', level = 1) {
    const prereqList = document.getElementById('prerequisitesList');
    
    const item = document.createElement('div');
    item.className = 'prerequisite-item';
    
    const select = document.createElement('select');
    select.innerHTML = '<option value="">Select Skill...</option>';
    Object.entries(gameState.skillDefinitions).forEach(([skillId, skillDef]) => {
        const option = document.createElement('option');
        option.value = skillId;
        option.textContent = skillDef.name;
        if (skillId === skillName) option.selected = true;
        select.appendChild(option);
    });
    
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '100';
    input.value = level;
    input.placeholder = 'Level';
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.onclick = () => item.remove();
    
    item.appendChild(select);
    item.appendChild(input);
    item.appendChild(btn);
    prereqList.appendChild(item);
}

function saveSkillEdit() {
    const name = document.getElementById('editName').value;
    const description = document.getElementById('editDescription').value;
    const maxLevel = parseInt(document.getElementById('editMaxLevel').value);
    const statDisplay = document.getElementById('editStatDisplay').value;
    const formula = document.getElementById('editFormula').value;
    const pointsFormula = parseInt(document.getElementById('editPointsFormula').value);

    if (!name || !description || !statDisplay || !formula) {
        alert('Please fill in all required fields');
        return;
    }

    // Collect prerequisites
    const prerequisites = [];
    document.querySelectorAll('.prerequisite-item').forEach(item => {
        const select = item.querySelector('select');
        const input = item.querySelector('input');
        if (select.value && input.value) {
            prerequisites.push({
                skill: select.value,
                level: parseInt(input.value)
            });
        }
    });

    let skillId = editingSkill;
    if (!skillId) {
        // Generate ID from name
        skillId = name.toLowerCase().replace(/\s+/g, '');
        
        // Check if ID already exists
        if (gameState.skillDefinitions[skillId]) {
            alert('A skill with this name already exists');
            return;
        }

        gameState.skills[skillId] = { level: 0 };
    }

    gameState.skillDefinitions[skillId] = {
        name,
        branch: currentBranch,
        description,
        maxLevel,
        prerequisites,
        statDisplay,
        formula,
        pointsFormula
    };

    saveGame();
    renderSkillsList();
    renderGameView();
    cancelSkillEdit();
    alert('Skill saved successfully!');
}

function cancelSkillEdit() {
    document.getElementById('skillEditorSection').style.display = 'none';
    editingSkill = null;
    document.getElementById('skillEditorForm').reset();
    document.getElementById('prerequisitesList').innerHTML = '';
}

function deleteSkill() {
    if (!editingSkill || !confirm('Are you sure you want to delete this skill?')) {
        return;
    }

    delete gameState.skillDefinitions[editingSkill];
    delete gameState.skills[editingSkill];
    
    saveGame();
    renderSkillsList();
    renderGameView();
    cancelSkillEdit();
    alert('Skill deleted successfully!');
}

function exportConfig() {
    const config = {
        skillDefinitions: gameState.skillDefinitions,
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skill-tree-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importConfigUI() {
    document.getElementById('importFile').click();
}

function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            
            if (!config.skillDefinitions) {
                alert('Invalid config file format');
                return;
            }

            // Reset current skills
            gameState.skills = {};
            gameState.skillDefinitions = config.skillDefinitions;

            // Initialize skill levels
            initializeSkillLevels();
            gameState.skillPoints = 0;

            saveGame();
            renderGameView();
            renderSkillsList();
            alert('Skill tree imported successfully!');
        } catch (error) {
            alert('Error importing config: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function setupEditor() {
    // Set initial branch
    selectBranch('offense');
}

// Start the game
init();