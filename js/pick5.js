// Pick 5 Mode - Select the best 5 cards from 7

// Game state
let p5Cards = [];
let p5SelectedCards = [];
let p5BestHand = null;
let p5Streak = 0;
let p5CorrectCount = 0;
let p5TotalCount = 0;
let p5GameEnded = false;

// DOM elements
let p5CardsEl, p5ResultEl, p5ResultMessageEl, p5HandDescEl, p5BestHandDescEl;
let nextP5Btn, p5StreakEl, p5CorrectEl, p5TotalEl, p5SelectedCountEl;
let p5CheckBtn, p5ClearBtn;

// Initialize pick 5 mode
function initPick5Mode() {
    p5CardsEl = document.getElementById('p5-cards');
    p5ResultEl = document.getElementById('p5-result');
    p5ResultMessageEl = document.getElementById('p5-result-message');
    p5HandDescEl = document.getElementById('p5-hand-desc');
    p5BestHandDescEl = document.getElementById('p5-best-hand-desc');
    nextP5Btn = document.getElementById('next-p5-btn');
    p5StreakEl = document.getElementById('p5-streak');
    p5CorrectEl = document.getElementById('p5-correct');
    p5TotalEl = document.getElementById('p5-total');
    p5SelectedCountEl = document.getElementById('p5-selected-count');
    p5CheckBtn = document.getElementById('p5-check-btn');
    p5ClearBtn = document.getElementById('p5-clear-btn');
    
    nextP5Btn.addEventListener('click', newPick5Round);
    p5CheckBtn.addEventListener('click', checkPick5Selection);
    p5ClearBtn.addEventListener('click', clearPick5Selection);
}

// Get the best possible 5-card hand from 7 cards
function getBestFiveCards(cards) {
    const combinations = getCombinations(cards, 5);
    let bestHand = null;
    let bestCombo = null;
    
    for (const combo of combinations) {
        const hand = evaluate5Cards(combo);
        if (!bestHand || compareHands(hand, bestHand) > 0) {
            bestHand = hand;
            bestCombo = combo;
        }
    }
    
    return { hand: bestHand, cards: bestCombo };
}

// Check if two sets of cards are the same (regardless of order)
function sameCardSet(cards1, cards2) {
    if (cards1.length !== cards2.length) return false;
    
    const set1 = new Set(cards1.map(c => cardToString(c)));
    const set2 = new Set(cards2.map(c => cardToString(c)));
    
    if (set1.size !== set2.size) return false;
    
    for (const card of set1) {
        if (!set2.has(card)) return false;
    }
    return true;
}

// Check if selected cards form an equally good hand as the best
function isOptimalSelection(selectedCards, allCards) {
    const selectedHand = evaluate5Cards(selectedCards);
    const bestResult = getBestFiveCards(allCards);
    
    // Check if hands are equal in strength
    return compareHands(selectedHand, bestResult.hand) === 0;
}

// Start new round
function newPick5Round() {
    p5GameEnded = false;
    p5SelectedCards = [];
    p5ResultEl.classList.add('hidden');
    p5HandDescEl.textContent = '';
    p5BestHandDescEl.textContent = '';
    
    // Reset button states
    p5CheckBtn.disabled = true;
    
    // Deal 7 random cards
    const deck = shuffle(createDeck());
    p5Cards = deal(deck, 7);
    
    // Calculate best hand
    const bestResult = getBestFiveCards(p5Cards);
    p5BestHand = bestResult;
    
    // Render cards
    renderPick5Cards();
    updateSelectedCount();
}

// Render the 7 cards
function renderPick5Cards() {
    p5CardsEl.innerHTML = '';
    
    // Show cards in random order (as dealt)
    for (const card of p5Cards) {
        const cardEl = createCardElement(card);
        cardEl.classList.add('p5-card');
        cardEl.dataset.cardString = cardToString(card);
        cardEl.addEventListener('click', () => toggleCardSelection(card, cardEl));
        p5CardsEl.appendChild(cardEl);
    }
}

// Toggle card selection
function toggleCardSelection(card, element) {
    if (p5GameEnded) return;
    
    const cardStr = cardToString(card);
    const index = p5SelectedCards.findIndex(c => cardToString(c) === cardStr);
    
    if (index > -1) {
        // Deselect
        p5SelectedCards.splice(index, 1);
        element.classList.remove('selected');
    } else if (p5SelectedCards.length < 5) {
        // Select
        p5SelectedCards.push(card);
        element.classList.add('selected');
        
        // Add pop animation
        element.classList.add('pop');
        setTimeout(() => element.classList.remove('pop'), 200);
    }
    
    updateSelectedCount();
    p5CheckBtn.disabled = p5SelectedCards.length !== 5;
}

// Clear selection
function clearPick5Selection() {
    if (p5GameEnded) return;
    
    p5SelectedCards = [];
    const cardEls = p5CardsEl.querySelectorAll('.p5-card');
    cardEls.forEach(el => el.classList.remove('selected'));
    updateSelectedCount();
    p5CheckBtn.disabled = true;
}

// Update selected count display
function updateSelectedCount() {
    p5SelectedCountEl.textContent = p5SelectedCards.length;
}

// Check the user's selection
function checkPick5Selection() {
    if (p5GameEnded || p5SelectedCards.length !== 5) return;
    
    p5GameEnded = true;
    p5TotalCount++;
    
    // Evaluate user's selection
    const userHand = evaluate5Cards(p5SelectedCards);
    const isOptimal = isOptimalSelection(p5SelectedCards, p5Cards);
    
    // Show user's hand
    p5HandDescEl.textContent = `Your hand: ${getHandDescription(userHand)}`;
    
    // Disable card clicking
    const cardEls = p5CardsEl.querySelectorAll('.p5-card');
    cardEls.forEach(el => {
        el.style.cursor = 'default';
    });
    
    if (isOptimal) {
        p5CorrectCount++;
        p5Streak++;
        p5ResultMessageEl.textContent = '✓ Perfect!';
        p5ResultEl.className = 'result perfect';
        
        // Mark selected as correct
        cardEls.forEach(el => {
            if (el.classList.contains('selected')) {
                el.classList.add('correct');
            }
        });
    } else {
        p5Streak = 0;
        p5ResultMessageEl.textContent = '✗ Not the best hand';
        p5ResultEl.className = 'result failed';
        
        // Mark selected as wrong
        cardEls.forEach(el => {
            if (el.classList.contains('selected')) {
                el.classList.add('wrong');
            }
        });
        
        // Highlight the best cards
        const bestCardStrings = new Set(p5BestHand.cards.map(c => cardToString(c)));
        cardEls.forEach(el => {
            if (bestCardStrings.has(el.dataset.cardString)) {
                el.classList.add('best-choice');
            }
        });
        
        // Show best hand
        p5BestHandDescEl.textContent = `Best hand: ${getHandDescription(p5BestHand.hand)}`;
    }
    
    // Update stats
    updatePick5Stats();
    
    // Show result
    p5ResultEl.classList.remove('hidden');
}

// Update stats display
function updatePick5Stats() {
    p5StreakEl.textContent = p5Streak;
    p5CorrectEl.textContent = p5CorrectCount;
    p5TotalEl.textContent = p5TotalCount;
}
