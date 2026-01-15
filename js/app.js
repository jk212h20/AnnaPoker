// Main application logic for Poker Hand Trainer

// Game state
let currentBoard = [];
let currentHands = [];
let correctOrder = [];
let userOrder = [];
let selectionCount = 0;
let streak = 0;
let correctCount = 0;
let totalCount = 0;
let gameEnded = false;

// DOM elements
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

// Initialize the game
function init() {
    nextBtn.addEventListener('click', newRound);
    newRound();
}

// Start a new round
function newRound() {
    // Reset state
    userOrder = [];
    selectionCount = 0;
    gameEnded = false;
    
    // Hide result and rankings
    resultEl.classList.add('hidden');
    rankingsEl.classList.add('hidden');
    instructionEl.style.display = 'block';
    
    // Generate new scenario
    if (shouldUseTemplate()) {
        const template = getRandomTemplate();
        currentBoard = template.board;
        currentHands = template.hands;
    } else {
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

// Handle hand selection
function selectHand(index, element) {
    if (gameEnded) return;
    if (userOrder.includes(index)) return; // Already selected
    
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
