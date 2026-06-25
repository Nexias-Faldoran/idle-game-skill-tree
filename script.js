// Class-based game state
const gameState = {
    currentClass: 'mage',
    classes: {
        mage: {
            name: 'Mage',
            branches: {
                offense: {
                    name: 'Offense',
                    emoji: '⚡',
                    skills: {
                        slash: { level: 0, description: 'Increase melee damage by 5% per level', maxLevel: 10, statDisplay: 'Damage: +{level * 5}%', formula: '{level * 5}', pointsFormula: 0, prerequisites: [] },
                        fireball: { level: 0, description: 'Deal 10 fire damage per level', maxLevel: 10, statDisplay: 'Damage: {level * 10}', formula: '{level * 10}', pointsFormula: 0, prerequisites: [] },
                        inferno: { level: 0, description: 'Requires Fireball Lv3. Deal 25 fire damage per level', maxLevel: 10, statDisplay: 'Damage: {level * 25}', formula: '{level * 25}', pointsFormula: 0, prerequisites: [{ skill: 'fireball', level: 3 }] }
                    }
                },
                defense: {
                    name: 'Defense',
                    emoji: '🛡️',
                    skills: {
                        armor: { level: 0, description: 'Increase defense by 3 per level', maxLevel: 10, statDisplay: 'Defense: +{level * 3}', formula: '{level * 3}', pointsFormula: 0, prerequisites: [] },
                        shield: { level: 0, description: 'Block 5% damage per level', maxLevel: 10, statDisplay: 'Block: {level * 5}%', formula: '{level * 5}', pointsFormula: 0, prerequisites: [] },
                        fortitude: { level: 0, description: 'Requires Armor Lv2 & Shield Lv2. Reduce all damage by 2% per level', maxLevel: 10, statDisplay: 'Damage Reduction: {level * 2}%', formula: '{level * 2}', pointsFormula: 0, prerequisites: [{ skill: 'armor', level: 2 }, { skill: 'shield', level: 2 }] }
                    }
                },
                utility: {
                    name: 'Utility',
                    emoji: '✨',
                    skills: {
                        efficiency: { level: 0, description: 'Generate 2 skill points per level', maxLevel: 10, statDisplay: 'Points/s: +{level * 2}', formula: '{level * 2}', pointsFormula: '{level * 2}', prerequisites: [] },
                        discipline: { level: 0, description: 'Gain 1 skill point per 10 seconds', maxLevel: 10, statDisplay: 'Passive: +1 pts/10s', formula: '1', pointsFormula: 1, prerequisites: [] },
                        mastery: { level: 0, description: 'Requires Efficiency Lv3 & Discipline Lv3. Gain 10% more skill points', maxLevel: 10, statDisplay: 'Bonus: +{level * 10}%', formula: '{level * 10}', pointsFormula: 0, prerequisites: [{ skill: 'efficiency', level: 3 }, { skill: 'discipline', level: 3 }] }
                    }
                }
            }
        },
        warrior: {
            name: 'Warrior',
            branches: {
                offense: { name: 'Offense', emoji: '⚔️', skills: {} },
                defense: { name: 'Defense', emoji: '🛡️', skills: {} }
            }
        },
        rogue: {
            name: 'Rogue',
            branches: {
                offense: { name: 'Offense', emoji: '🗡️', skills: {} },
                utility: { name: 'Utility', emoji: '🎭', skills: {} }
            }
        }
    },
    skillPoints: 0,
    info: 'Welcome to the Skill Tree! Allocate skill points to unlock and upgrade abilities.'
};

// Initialize game
function init() {
    loadGame();
    renderGame();
    updateStats();
    updateLockStates();

    setInterval(generatePassiveIncome, 10000);
    setInterval(generateActiveIncome, 1000);
}

// Select class
function selectClass(className) {
    gameState.currentClass = className;
    document.querySelectorAll('.class-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderGame();
    renderBranchSelector();
    saveGame();
}

// Render game based on current class
function renderGame() {
    const gameView = document.getElementById('gameView');
    const classData = gameState.classes[gameState.currentClass];
    
    let html = `<div class="class-group">
        <h2 class="class-title">${classData.name} - Skill Tree</h2>
        <div class="skill-tree">`;
    
    for (const [branchKey, branch] of Object.entries(classData.branches)) {
        html += `<div class="branch">
            <h2 class="branch-title">${branch.emoji} ${branch.name}</h2>`;
        
        for (const [skillKey, skill] of Object.entries(branch.skills)) {
            const isLocked = !checkPrerequisites(skillKey);
            const isMaxed = skill.level >= skill.maxLevel;
            const btnDisabled = isLocked || isMaxed;
            const btnText = isMaxed ? 'Max Level' : isLocked ? 'Locked' : 'Upgrade';
            
            html += `<div class="skill-node" data-skill="${skillKey}">
                <div class="node-header">
                    <h3>${skillKey.charAt(0).toUpperCase() + skillKey.slice(1)}</h3>
                    <span class="level-badge" id="level-${skillKey}">${skill.level}</span>
                </div>
                <p class="node-description">${skill.description}</p>
                <div class="node-stats" id="stats-${skillKey}">${evaluateStat(skill, skillKey)}</div>
                <button class="upgrade-btn" onclick="upgradeSkill('${skillKey}')" ${btnDisabled ? 'disabled' : ''}>${btnText}</button>
            </div>`;
        }
        
        html += `</div>`;
    }
    
    html += `</div></div>`;
    gameView.innerHTML = html;
}

// Evaluate stat display
function evaluateStat(skill, skillKey) {
    try {
        let statDisplay = skill.statDisplay;
        const level = skill.level;
        
        statDisplay = statDisplay.replace(/{level \* (\d+)}/g, (match, num) => {
            return level * parseInt(num);
        });
        
        statDisplay = statDisplay.replace(/{level}/g, level);
        
        return statDisplay;
    } catch (e) {
        return 'Error calculating stat';
    }
}

// Get all skills for current class
function getAllSkills() {
    const classData = gameState.classes[gameState.currentClass];
    const allSkills = {};
    
    for (const branch of Object.values(classData.branches)) {
        Object.assign(allSkills, branch.skills);
    }
    
    return allSkills;
}

// Check prerequisites
function checkPrerequisites(skillKey) {
    const allSkills = getAllSkills();
    const skill = allSkills[skillKey];
    
    if (!skill || !skill.prerequisites || skill.prerequisites.length === 0) {
        return true;
    }
    
    return skill.prerequisites.every(prereq => {
        const prereqSkill = allSkills[prereq.skill];
        return prereqSkill && prereqSkill.level >= prereq.level;
    });
}

// Upgrade skill
function upgradeSkill(skillKey) {
    const allSkills = getAllSkills();
    const skill = allSkills[skillKey];
    
    if (!skill || skill.level >= skill.maxLevel || !checkPrerequisites(skillKey)) {
        return;
    }
    
    skill.level++;
    gameState.skillPoints++;
    
    updateSkillDisplay(skillKey);
    updateStats();
    updateLockStates();
    renderGame();
    saveGame();
}

// Update skill display
function updateSkillDisplay(skillKey) {
    const allSkills = getAllSkills();
    const skill = allSkills[skillKey];
    
    if (document.getElementById(`level-${skillKey}`)) {
        document.getElementById(`level-${skillKey}`).textContent = skill.level;
    }
    if (document.getElementById(`stats-${skillKey}`)) {
        document.getElementById(`stats-${skillKey}`).textContent = evaluateStat(skill, skillKey);
    }
}

// Update stats display
function updateStats() {
    let totalLevel = 0;
    const classData = gameState.classes[gameState.currentClass];
    
    for (const branch of Object.values(classData.branches)) {
        for (const skill of Object.values(branch.skills)) {
            totalLevel += skill.level;
        }
    }
    
    document.getElementById('totalLevel').textContent = totalLevel;
    document.getElementById('skillPoints').textContent = gameState.skillPoints;
}

// Update lock states
function updateLockStates() {
    const allSkills = getAllSkills();
    
    Object.keys(allSkills).forEach(skillKey => {
        const btn = document.querySelector(`[data-skill="${skillKey}"] .upgrade-btn`);
        if (!btn) return;
        
        const skill = allSkills[skillKey];
        const prerequisitesMet = checkPrerequisites(skillKey);
        const maxLevelReached = skill.level >= skill.maxLevel;
        
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
        const classData = gameState.classes[gameState.currentClass];
        
        for (const branch of Object.values(classData.branches)) {
            for (const skill of Object.values(branch.skills)) {
                skill.level = 0;
            }
        }
        
        gameState.skillPoints = 0;
        updateStats();
        updateLockStates();
        renderGame();
        saveGame();
    }
}

// Passive income
function generatePassiveIncome() {
    const allSkills = getAllSkills();
    const disciplineSkill = allSkills.discipline;
    
    if (disciplineSkill && disciplineSkill.level > 0) {
        gameState.skillPoints += disciplineSkill.level;
        updateStats();
    }
}

// Active income
function generateActiveIncome() {
    const allSkills = getAllSkills();
    const efficiencySkill = allSkills.efficiency;
    const masterySkill = allSkills.mastery;
    
    if (efficiencySkill && efficiencySkill.level > 0) {
        const bonus = masterySkill ? gameState.skillPoints * (masterySkill.level * 0.1) : 0;
        gameState.skillPoints += efficiencySkill.level * 2 + bonus;
        updateStats();
    }
}

// Info section functions
function toggleInfoEdit() {
    const form = document.getElementById('infoEditForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('infoTextarea').value = gameState.info;
    }
}

function saveInfo() {
    gameState.info = document.getElementById('infoTextarea').value;
    document.getElementById('infoText').textContent = gameState.info;
    toggleInfoEdit();
    saveGame();
}

// Editor functions
function toggleEditor() {
    const panel = document.getElementById('editorPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderBranchSelector();
    }
}

function renderBranchSelector() {
    const classData = gameState.classes[gameState.currentClass];
    const selector = document.getElementById('branchSelector');
    
    document.getElementById('currentClass').textContent = classData.name;
    
    let html = '';
    for (const [branchKey, branch] of Object.entries(classData.branches)) {
        html += `<div class="branch-item">
            <span class="branch-name">${branch.emoji} ${branch.name}</span>
            <div class="branch-actions">
                <button class="branch-edit-btn" onclick="editBranch('${branchKey}')">Edit</button>
                <button class="branch-delete-btn" onclick="confirmDeleteBranch('${branchKey}')">Delete</button>
            </div>
        </div>`;
    }
    
    selector.innerHTML = html;
}

function editBranch(branchKey) {
    const classData = gameState.classes[gameState.currentClass];
    const branch = classData.branches[branchKey];
    
    document.getElementById('editBranchName').value = branch.name;
    document.getElementById('editBranchEmoji').value = branch.emoji;
    document.getElementById('branchEditorSection').style.display = 'block';
    
    const deleteBtn = document.getElementById('deleteBranchBtn');
    deleteBtn.style.display = 'inline-block';
    deleteBtn.onclick = () => confirmDeleteBranch(branchKey);
    
    window.currentEditingBranch = branchKey;
    renderSkillsList(branchKey);
}

function saveBranchEdit() {
    const classData = gameState.classes[gameState.currentClass];
    const branch = classData.branches[window.currentEditingBranch];
    
    branch.name = document.getElementById('editBranchName').value;
    branch.emoji = document.getElementById('editBranchEmoji').value;
    
    document.getElementById('branchEditorSection').style.display = 'none';
    renderBranchSelector();
    renderGame();
    saveGame();
}

function cancelBranchEdit() {
    document.getElementById('branchEditorSection').style.display = 'none';
}

function confirmDeleteBranch(branchKey) {
    if (confirm('Delete this branch and all its skills?')) {
        const classData = gameState.classes[gameState.currentClass];
        delete classData.branches[branchKey];
        
        cancelBranchEdit();
        renderBranchSelector();
        renderGame();
        saveGame();
    }
}

function addNewBranch() {
    const classData = gameState.classes[gameState.currentClass];
    const newKey = `branch_${Date.now()}`;
    
    classData.branches[newKey] = {
        name: 'New Branch',
        emoji: '✨',
        skills: {}
    };
    
    window.currentEditingBranch = newKey;
    editBranch(newKey);
    saveGame();
}

function renderSkillsList(branchKey) {
    const classData = gameState.classes[gameState.currentClass];
    const branch = classData.branches[branchKey];
    const skillsList = document.getElementById('skillsList');
    
    document.getElementById('currentBranch').textContent = branch.name;
    
    let html = '';
    for (const [skillKey, skill] of Object.entries(branch.skills)) {
        html += `<div class="skill-item">
            <span class="skill-name">${skillKey}</span>
            <div class="skill-actions">
                <button class="skill-edit-btn" onclick="editSkill('${branchKey}', '${skillKey}')">Edit</button>
                <button class="skill-delete-btn" onclick="confirmDeleteSkill('${branchKey}', '${skillKey}')">Delete</button>
            </div>
        </div>`;
    }
    
    skillsList.innerHTML = html;
}

function editSkill(branchKey, skillKey) {
    const classData = gameState.classes[gameState.currentClass];
    const skill = classData.branches[branchKey].skills[skillKey];
    
    document.getElementById('editName').value = skillKey;
    document.getElementById('editDescription').value = skill.description;
    document.getElementById('editMaxLevel').value = skill.maxLevel;
    document.getElementById('editStatDisplay').value = skill.statDisplay;
    document.getElementById('editFormula').value = skill.formula;
    document.getElementById('editPointsFormula').value = skill.pointsFormula;
    
    renderPrerequisites(skill.prerequisites);
    
    document.getElementById('skillEditorSection').style.display = 'block';
    
    const deleteBtn = document.getElementById('deleteSkillBtn');
    deleteBtn.style.display = 'inline-block';
    deleteBtn.onclick = () => confirmDeleteSkill(branchKey, skillKey);
    
    window.currentEditingSkill = { branchKey, skillKey };
}

function renderPrerequisites(prerequisites) {
    const list = document.getElementById('prerequisitesList');
    
    let html = '';
    prerequisites.forEach((prereq, idx) => {
        html += `<div class="prerequisite-item">
            <select onchange="updatePrerequisiteSkill(${idx}, this.value)">
                <option value="">Select Skill</option>
                ${Object.keys(getAllSkills()).map(sk => `<option value="${sk}" ${sk === prereq.skill ? 'selected' : ''}>${sk}</option>`).join('')}
            </select>
            <input type="number" value="${prereq.level}" min="1" onchange="updatePrerequisiteLevel(${idx}, this.value)">
            <button onclick="removePrerequisite(${idx})">Remove</button>
        </div>`;
    });
    
    list.innerHTML = html;
}

function addPrerequisite() {
    if (!window.currentEditingSkill) return;
    
    const classData = gameState.classes[gameState.currentClass];
    const skill = classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    
    skill.prerequisites.push({ skill: '', level: 1 });
    renderPrerequisites(skill.prerequisites);
}

function updatePrerequisiteSkill(idx, value) {
    const classData = gameState.classes[gameState.currentClass];
    const skill = classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    skill.prerequisites[idx].skill = value;
}

function updatePrerequisiteLevel(idx, value) {
    const classData = gameState.classes[gameState.currentClass];
    const skill = classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    skill.prerequisites[idx].level = parseInt(value);
}

function removePrerequisite(idx) {
    const classData = gameState.classes[gameState.currentClass];
    const skill = classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    skill.prerequisites.splice(idx, 1);
    renderPrerequisites(skill.prerequisites);
}

function saveSkillEdit() {
    const classData = gameState.classes[gameState.currentClass];
    const oldSkill = classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    const newSkillKey = document.getElementById('editName').value;
    
    const updatedSkill = {
        level: oldSkill.level,
        description: document.getElementById('editDescription').value,
        maxLevel: parseInt(document.getElementById('editMaxLevel').value),
        statDisplay: document.getElementById('editStatDisplay').value,
        formula: document.getElementById('editFormula').value,
        pointsFormula: parseInt(document.getElementById('editPointsFormula').value),
        prerequisites: oldSkill.prerequisites
    };
    
    delete classData.branches[window.currentEditingSkill.branchKey].skills[window.currentEditingSkill.skillKey];
    classData.branches[window.currentEditingSkill.branchKey].skills[newSkillKey] = updatedSkill;
    
    document.getElementById('skillEditorSection').style.display = 'none';
    renderSkillsList(window.currentEditingSkill.branchKey);
    renderGame();
    saveGame();
}

function cancelSkillEdit() {
    document.getElementById('skillEditorSection').style.display = 'none';
}

function confirmDeleteSkill(branchKey, skillKey) {
    if (confirm('Delete this skill?')) {
        const classData = gameState.classes[gameState.currentClass];
        delete classData.branches[branchKey].skills[skillKey];
        
        cancelSkillEdit();
        renderSkillsList(branchKey);
        renderGame();
        saveGame();
    }
}

function addNewSkill() {
    if (!window.currentEditingBranch) {
        alert('Please select a branch first');
        return;
    }
    
    const classData = gameState.classes[gameState.currentClass];
    const newSkillKey = `skill_${Date.now()}`;
    
    classData.branches[window.currentEditingBranch].skills[newSkillKey] = {
        level: 0,
        description: 'New Skill',
        maxLevel: 10,
        statDisplay: 'Stat: +0',
        formula: '0',
        pointsFormula: 0,
        prerequisites: []
    };
    
    editSkill(window.currentEditingBranch, newSkillKey);
    saveGame();
}

// Export/Import
function exportConfig() {
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skill-tree-config-${Date.now()}.json`;
    link.click();
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
            const imported = JSON.parse(e.target.result);
            Object.assign(gameState, imported);
            saveGame();
            location.reload();
        } catch (err) {
            alert('Error importing config: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Save/Load game
function saveGame() {
    localStorage.setItem('skilltreeGame', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('skilltreeGame');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
    }
}

// Start game
init();