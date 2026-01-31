// Main application logic for Poker Hand Trainer

// Current mode
let currentMode = 'ranking';

// Game state for ranking mode
let currentBoard = [];
let currentHands = [];
let correctOrder = [];
let userOrder = [];
let selectionCount = 0;
let streak = 0;
let correctCount = 0;
let totalCount = 0;
let gameEnded = false;

// DOM elements for ranking mode
const boardCardsEl = document.getElementById('board-cards');
const handsEl = document.getElementById('hands');
const resultEl = document.getElementById('result');
const resultMessageEl = document.getElementById('result-message');
const nextBtn = document.getElementById('next-btn');
const rankingsEl = document.getElementById('rankings');
const rankingsListEl = document.getElementById('rankings-list');
const streakEl = document.getElementById('streak');
const correctEl = document.getElementById('correct');
const totalEl = document.getElementById('total');
const instructionEl = document.getElementById('instruction');

// DOM elements for mode switching
const menuToggle = document.getElementById('menu-toggle');
const menuDropdown = document.getElementById('menu-dropdown');
const menuItems = document.querySelectorAll('.menu-item');
const rankingMode = document.getElementById('ranking-mode');
const outsMode = document.getElementById('outs-mode');
const whichwinsMode = document.getElementById('whichwins-mode');
const namehandMode = document.getElementById('namehand-mode');
const pick5Mode = document.getElementById('pick5-mode');
const findnutsMode = document.getElementById('findnuts-mode');
const readboardMode = document.getElementById('readboard-mode');
const handstrengthMode = document.getElementById('handstrength-mode');

// Initialize the app
function init() {
    // Initialize ranking mode
    nextBtn.addEventListener('click', newRound);
    
    // Initialize mode menu
    initModeMenu();
    
    // Initialize outs mode
    initOutsMode();
    
    // Initialize which wins mode
    initWhichWinsMode();
    
    // Initialize name hand mode
    initNameHandMode();
    
    // Initialize pick 5 mode
    initPick5Mode();
    
    // Initialize find nuts mode
    initFindNutsMode();
    
    // Initialize read board mode
    initReadBoardMode();
    
    // Initialize hand strength mode
    initHandStrengthMode();
    
    // Start with ranking mode
    newRound();
}

// Initialize mode menu functionality
function initModeMenu() {
    // Toggle menu
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuDropdown.contains(e.target) && e.target !== menuToggle) {
            menuDropdown.classList.add('hidden');
        }
    });
    
    // Handle menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const mode = item.dataset.mode;
            switchMode(mode);
            menuDropdown.classList.add('hidden');
        });
    });
}

// Switch between game modes
function switchMode(mode) {
    if (mode === currentMode) return;
    
    currentMode = mode;
    
    // Update menu item states
    menuItems.forEach(item => {
        if (item.dataset.mode === mode) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Hide all modes
    rankingMode.classList.add('hidden');
    outsMode.classList.add('hidden');
    whichwinsMode.classList.add('hidden');
    namehandMode.classList.add('hidden');
    pick5Mode.classList.add('hidden');
    findnutsMode.classList.add('hidden');
    readboardMode.classList.add('hidden');
    handstrengthMode.classList.add('hidden');
    document.body.classList.remove('outs-theme', 'whichwins-theme', 'namehand-theme', 'pick5-theme', 'findnuts-theme', 'readboard-theme', 'handstrength-theme');
    
    // Show selected mode
    if (mode === 'ranking') {
        rankingMode.classList.remove('hidden');
        newRound();
    } else if (mode === 'whichwins') {
        whichwinsMode.classList.remove('hidden');
        document.body.classList.add('whichwins-theme');
        newWhichWinsRound();
    } else if (mode === 'outs') {
        outsMode.classList.remove('hidden');
        document.body.classList.add('outs-theme');
        newOutsRound();
    } else if (mode === 'namehand') {
        namehandMode.classList.remove('hidden');
        document.body.classList.add('namehand-theme');
        newNameHandRound();
    } else if (mode === 'pick5') {
        pick5Mode.classList.remove('hidden');
        document.body.classList.add('pick5-theme');
        newPick5Round();
    } else if (mode === 'findnuts') {
        findnutsMode.classList.remove('hidden');
        document.body.classList.add('findnuts-theme');
        newFindNutsRound();
    } else if (mode === 'readboard') {
        readboardMode.classList.remove('hidden');
        document.body.classList.add('readboard-theme');
        newReadBoardRound();
    } else if (mode === 'handstrength') {
        handstrengthMode.classList.remove('hidden');
        document.body.classList.add('handstrength-theme');
        newHandStrengthRound();
    }
}

// Start a new round (ranking mode)
function newRound() {
    // Reset state
    userOrder = [];
    selectionCount = 0;
    gameEnded = false;
    
    // Hide result and rankings
    resultEl.classList.add('hidden');
    rankingsEl.classList.add('hidden');
    instructionEl.style.display = 'block';
    
    // Generate new scenario with fallback on error
    try {
        if (shouldUseTemplate()) {
            const template = getRandomTemplate();
            if (template && template.board && template.hands && template.hands.length === 4) {
                currentBoard = template.board;
                currentHands = template.hands;
            } else {
                // Template invalid, fall back to random
                generateRandomScenario();
            }
        } else {
            generateRandomScenario();
        }
    } catch (e) {
        // On any error, fall back to random generation
        console.warn('Template generation failed, using random:', e);
        generateRandomScenario();
    }
    
    // Calculate correct order
    const ranked = rankHands(currentBoard, currentHands);
    correctOrder = ranked.map(r => r.index);
    
    // Render the board and hands
    renderBoard();
    renderHands();
}

// Generate a completely random scenario
function generateRandomScenario() {
    const deck = shuffle(createDeck());
    
    // Deal 5 board cards
    currentBoard = deal(deck, 5);
    
    // Deal 4 hands (2 cards each)
    currentHands = [];
    for (let i = 0; i < 4; i++) {
        currentHands.push(deal(deck, 2));
    }
}

// Render the board cards
function renderBoard() {
    boardCardsEl.innerHTML = '';
    for (const card of currentBoard) {
        boardCardsEl.appendChild(createCardElement(card));
    }
}

// Render the 4 hands
function renderHands() {
    handsEl.innerHTML = '';
    
    for (let i = 0; i < currentHands.length; i++) {
        const hand = currentHands[i];
        const handEl = document.createElement('div');
        handEl.className = 'hand';
        handEl.dataset.index = i;
        
        // Player label
        const playerEl = document.createElement('div');
        playerEl.className = 'player';
        playerEl.textContent = `Hand ${i + 1}`;
        handEl.appendChild(playerEl);
        
        // Hole cards container
        const holeCardsEl = document.createElement('div');
        holeCardsEl.className = 'hole-cards';
        
        // Display cards in dealt order (random, like real poker)
        for (const card of hand) {
            holeCardsEl.appendChild(createCardElement(card));
        }
        handEl.appendChild(holeCardsEl);
        
        // Hand name placeholder (shown after selection)
        const handNameEl = document.createElement('div');
        handNameEl.className = 'hand-name';
        handEl.appendChild(handNameEl);
        
        // Click handler
        handEl.addEventListener('click', () => selectHand(i, handEl));
        
        handsEl.appendChild(handEl);
    }
}

// Reset selection - unselect all hands
function resetSelection() {
    if (gameEnded) return;
    if (userOrder.length === 0) return;
    
    // Reset state
    userOrder = [];
    selectionCount = 0;
    
    // Re-render hands to clear all selections
    renderHands();
}

// Handle hand selection
function selectHand(index, element) {
    if (gameEnded) return;
    
    // If already selected, unselect it (only if it's the last selected)
    const selectedIndex = userOrder.indexOf(index);
    if (selectedIndex !== -1) {
        // Only allow unselecting the last selected hand
        if (selectedIndex === userOrder.length - 1) {
            unselectHand(index);
        }
        return;
    }
    
    // Add to user order
    userOrder.push(index);
    selectionCount++;
    
    // Mark as selected
    element.classList.add('selected');
    
    // Add order badge
    const badge = document.createElement('div');
    badge.className = 'order-badge';
    badge.textContent = selectionCount;
    element.appendChild(badge);
    
    // Show the hand evaluation
    const hand = evaluateHand(currentBoard, currentHands[index]);
    const handNameEl = element.querySelector('.hand-name');
    handNameEl.textContent = getHandDescription(hand);
    
    // Add pop animation
    element.classList.add('pop');
    setTimeout(() => element.classList.remove('pop'), 200);
    
    // Check if all hands selected
    if (selectionCount === 4) {
        endRound();
    }
}

// Unselect a hand (only the last selected one)
function unselectHand(index) {
    // Remove from user order
    userOrder.pop();
    selectionCount--;
    
    // Find the hand element and reset its state
    const handEls = document.querySelectorAll('.hand');
    const handEl = handEls[index];
    
    // Remove selected state
    handEl.classList.remove('selected');
    
    // Remove order badge
    const badge = handEl.querySelector('.order-badge');
    if (badge) {
        badge.remove();
    }
    
    // Clear hand name
    const handNameEl = handEl.querySelector('.hand-name');
    handNameEl.textContent = '';
}

// End the round and show results
function endRound() {
    gameEnded = true;
    totalCount++;
    
    // Check if order is correct
    const isCorrect = checkOrder();
    
    if (isCorrect) {
        correctCount++;
        streak++;
        resultMessageEl.textContent = '✓ Perfect!';
        resultEl.className = 'result perfect';
    } else {
        streak = 0;
        resultMessageEl.textContent = '✗ Not quite';
        resultEl.className = 'result failed';
        showCorrectOrder();
    }
    
    // Update UI
    updateStats();
    markHandsCorrectness();
    
    // Show result
    resultEl.classList.remove('hidden');
    instructionEl.style.display = 'none';
}

// Check if user order matches correct order
function checkOrder() {
    // Get the correct ranking considering ties
    const ranked = rankHands(currentBoard, currentHands);
    
    // Build expected order (accounting for ties)
    const rankByIndex = {};
    for (const r of ranked) {
        rankByIndex[r.index] = r.rank;
    }
    
    // Check if user's selections are in valid order
    for (let i = 0; i < userOrder.length - 1; i++) {
        const currentRank = rankByIndex[userOrder[i]];
        const nextRank = rankByIndex[userOrder[i + 1]];
        
        // Current should be stronger (lower rank number) or equal to next
        if (currentRank > nextRank) {
            return false;
        }
    }
    
    return true;
}

// Mark hands as correct or wrong
function markHandsCorrectness() {
    const handEls = document.querySelectorAll('.hand');
    const ranked = rankHands(currentBoard, currentHands);
    const rankByIndex = {};
    for (const r of ranked) {
        rankByIndex[r.index] = r.rank;
    }
    
    // Check each selection position
    for (let i = 0; i < userOrder.length; i++) {
        const handEl = handEls[userOrder[i]];
        const userRank = i + 1;
        const actualRank = rankByIndex[userOrder[i]];
        
        // Check if this position is valid
        let isValidPosition = true;
        
        // Compare with previous selection
        if (i > 0) {
            const prevActualRank = rankByIndex[userOrder[i - 1]];
            if (actualRank < prevActualRank) {
                isValidPosition = false;
            }
        }
        
        // Compare with next selection
        if (i < userOrder.length - 1) {
            const nextActualRank = rankByIndex[userOrder[i + 1]];
            if (actualRank > nextActualRank) {
                isValidPosition = false;
            }
        }
        
        if (isValidPosition) {
            handEl.classList.add('correct');
        } else {
            handEl.classList.add('wrong');
            handEl.classList.add('shake');
        }
        
        handEl.classList.add('disabled');
    }
}

// Show the correct order
function showCorrectOrder() {
    rankingsListEl.innerHTML = '';
    const ranked = rankHands(currentBoard, currentHands);
    
    for (const r of ranked) {
        const li = document.createElement('li');
        
        // Cards
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'rank-cards';
        for (const card of r.holeCards) {
            cardsDiv.appendChild(createCardElement(card));
        }
        li.appendChild(cardsDiv);
        
        // Hand name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'rank-name';
        nameSpan.textContent = getHandDescription(r.hand);
        li.appendChild(nameSpan);
        
        rankingsListEl.appendChild(li);
    }
    
    rankingsEl.classList.remove('hidden');
}

// Update stats display
function updateStats() {
    streakEl.textContent = streak;
    correctEl.textContent = correctCount;
    totalEl.textContent = totalCount;
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
