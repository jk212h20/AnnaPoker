// Name That Hand Mode - Identify the poker hand type

// Game state
let nhCards = [];
let nhCorrectAnswer = null;
let nhStreak = 0;
let nhCorrectCount = 0;
let nhTotalCount = 0;
let nhGameEnded = false;
let nhCardCount = 5; // 5, 6, or 7 cards

// Hand type options (what the player can choose)
const HAND_OPTIONS = [
    { rank: 1, name: 'High Card' },
    { rank: 2, name: 'Pair' },
    { rank: 3, name: 'Two Pair' },
    { rank: 4, name: 'Three of a Kind' },
    { rank: 5, name: 'Straight' },
    { rank: 6, name: 'Flush' },
    { rank: 7, name: 'Full House' },
    { rank: 8, name: 'Four of a Kind' },
    { rank: 9, name: 'Straight Flush' }
];

// DOM elements
let nhCardsEl, nhChoicesEl, nhResultEl, nhResultMessageEl, nhHandDescEl;
let nextNhBtn, nhStreakEl, nhCorrectEl, nhTotalEl;

// Scenario generators to create interesting hands
const NH_GENERATORS = [
    // High Card scenarios
    function highCard() {
        const deck = shuffle(createDeck());
        // Get 5 cards with no pairs, no flush, no straight
        let attempts = 0;
        while (attempts < 50) {
            const cards = deal([...shuffle(createDeck())], 5);
            const hand = evaluate5Cards(cards);
            if (hand.rank === HAND_RANKS.HIGH_CARD) {
                return cards;
            }
            attempts++;
        }
        return null;
    },
    
    // Pair scenarios
    function pair() {
        const deck = shuffle(createDeck());
        const pairRank = RANKS[Math.floor(Math.random() * 13)];
        const pairCards = deck.filter(c => c.rank === pairRank).slice(0, 2);
        const remaining = shuffle(removeCards(deck, pairCards));
        
        // Get 3 different rank cards
        const others = [];
        const usedRanks = new Set([pairRank]);
        for (const card of remaining) {
            if (!usedRanks.has(card.rank) && others.length < 3) {
                others.push(card);
                usedRanks.add(card.rank);
            }
        }
        
        if (others.length < 3) return null;
        
        const cards = shuffle([...pairCards, ...others]);
        // Verify it's just a pair
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.PAIR) return cards;
        return null;
    },
    
    // Two Pair scenarios
    function twoPair() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]);
        const pair1Rank = ranks[0];
        const pair2Rank = ranks[1];
        const kickerRank = ranks[2];
        
        const pair1 = deck.filter(c => c.rank === pair1Rank).slice(0, 2);
        const pair2 = deck.filter(c => c.rank === pair2Rank).slice(0, 2);
        const kicker = deck.find(c => c.rank === kickerRank);
        
        const cards = shuffle([...pair1, ...pair2, kicker]);
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.TWO_PAIR) return cards;
        return null;
    },
    
    // Three of a Kind scenarios
    function threeOfAKind() {
        const deck = shuffle(createDeck());
        const tripsRank = RANKS[Math.floor(Math.random() * 13)];
        const trips = deck.filter(c => c.rank === tripsRank).slice(0, 3);
        const remaining = shuffle(removeCards(deck, trips));
        
        const others = [];
        const usedRanks = new Set([tripsRank]);
        for (const card of remaining) {
            if (!usedRanks.has(card.rank) && others.length < 2) {
                others.push(card);
                usedRanks.add(card.rank);
            }
        }
        
        if (others.length < 2) return null;
        
        const cards = shuffle([...trips, ...others]);
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.THREE_OF_A_KIND) return cards;
        return null;
    },
    
    // Straight scenarios
    function straight() {
        const deck = shuffle(createDeck());
        const startValues = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5]; // A-high down to 5-high (wheel)
        const startVal = startValues[Math.floor(Math.random() * startValues.length)];
        
        const cards = [];
        const suits = shuffle([...SUITS]);
        
        if (startVal === 5) {
            // Wheel: A-2-3-4-5
            for (let i = 0; i < 5; i++) {
                const val = [14, 2, 3, 4, 5][i];
                const card = deck.find(c => c.value === val && c.suit === suits[i % 4]);
                if (card) cards.push(card);
            }
        } else {
            for (let v = startVal; v > startVal - 5; v--) {
                const card = deck.find(c => c.value === v && c.suit === suits[cards.length % 4]);
                if (card) cards.push(card);
            }
        }
        
        if (cards.length < 5) return null;
        
        // Ensure not a flush
        if (new Set(cards.map(c => c.suit)).size === 1) {
            cards[0] = deck.find(c => c.value === cards[0].value && c.suit !== cards[0].suit);
        }
        
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.STRAIGHT) return shuffle(cards);
        return null;
    },
    
    // Flush scenarios
    function flush() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        const suitedCards = shuffle(deck.filter(c => c.suit === suit));
        
        const cards = suitedCards.slice(0, 5);
        
        // Ensure not a straight flush
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.FLUSH) return cards;
        return null;
    },
    
    // Full House scenarios
    function fullHouse() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]);
        const tripsRank = ranks[0];
        const pairRank = ranks[1];
        
        const trips = deck.filter(c => c.rank === tripsRank).slice(0, 3);
        const pair = deck.filter(c => c.rank === pairRank).slice(0, 2);
        
        const cards = shuffle([...trips, ...pair]);
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.FULL_HOUSE) return cards;
        return null;
    },
    
    // Four of a Kind scenarios
    function fourOfAKind() {
        const deck = shuffle(createDeck());
        const quadRank = RANKS[Math.floor(Math.random() * 13)];
        const quads = deck.filter(c => c.rank === quadRank);
        const remaining = shuffle(removeCards(deck, quads));
        const kicker = remaining[0];
        
        const cards = shuffle([...quads, kicker]);
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.FOUR_OF_A_KIND) return cards;
        return null;
    },
    
    // Straight Flush scenarios
    function straightFlush() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = createDeck();
        const suitedCards = deck.filter(c => c.suit === suit);
        
        // Pick a starting value (not too high to avoid royal flush confusion)
        const startValues = [13, 12, 11, 10, 9, 8, 7, 6, 5];
        const startVal = startValues[Math.floor(Math.random() * startValues.length)];
        
        const cards = [];
        if (startVal === 5) {
            // Steel wheel
            for (const val of [5, 4, 3, 2, 14]) {
                const card = suitedCards.find(c => c.value === val);
                if (card) cards.push(card);
            }
        } else {
            for (let v = startVal; v > startVal - 5; v--) {
                const card = suitedCards.find(c => c.value === v);
                if (card) cards.push(card);
            }
        }
        
        if (cards.length < 5) return null;
        
        const hand = evaluate5Cards(cards);
        if (hand.rank === HAND_RANKS.STRAIGHT_FLUSH) return shuffle(cards);
        return null;
    }
];

// Weight distribution for hand types (to control frequency)
const HAND_WEIGHTS = {
    1: 2,  // High Card - less common in quiz
    2: 3,  // Pair - common
    3: 3,  // Two Pair - common
    4: 2,  // Three of a Kind
    5: 3,  // Straight - common
    6: 3,  // Flush - common
    7: 2,  // Full House
    8: 1,  // Four of a Kind - rare
    9: 1   // Straight Flush - rare
};

// Initialize name hand mode
function initNameHandMode() {
    nhCardsEl = document.getElementById('nh-cards');
    nhChoicesEl = document.getElementById('nh-choices');
    nhResultEl = document.getElementById('nh-result');
    nhResultMessageEl = document.getElementById('nh-result-message');
    nhHandDescEl = document.getElementById('nh-hand-desc');
    nextNhBtn = document.getElementById('next-nh-btn');
    nhStreakEl = document.getElementById('nh-streak');
    nhCorrectEl = document.getElementById('nh-correct');
    nhTotalEl = document.getElementById('nh-total');
    
    nextNhBtn.addEventListener('click', newNameHandRound);
    
    // Initialize card count buttons
    initCardCountButtons();
    
    // Create choice buttons
    createChoiceButtons();
}

// Initialize card count setting buttons
function initCardCountButtons() {
    const countBtns = document.querySelectorAll('.nh-count-btn');
    countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            countBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update card count
            nhCardCount = parseInt(btn.dataset.count);
            
            // Start new round with new card count
            newNameHandRound();
        });
    });
}

// Evaluate best 5-card hand from N cards (5, 6, or 7)
function evaluateBestHand(cards) {
    if (cards.length === 5) {
        return evaluate5Cards(cards);
    }
    
    // For 6 or 7 cards, find the best 5-card combination
    const combinations = getCombinations(cards, 5);
    let bestHand = null;
    
    for (const combo of combinations) {
        const hand = evaluate5Cards(combo);
        if (!bestHand || compareHands(hand, bestHand) > 0) {
            bestHand = hand;
        }
    }
    
    return bestHand;
}

// Create the hand type choice buttons
function createChoiceButtons() {
    nhChoicesEl.innerHTML = '';
    
    for (const option of HAND_OPTIONS) {
        const btn = document.createElement('button');
        btn.className = 'nh-choice';
        btn.dataset.rank = option.rank;
        btn.textContent = option.name;
        btn.addEventListener('click', () => makeNhChoice(option.rank));
        nhChoicesEl.appendChild(btn);
    }
}

// Select a random generator based on weights
function selectWeightedGenerator() {
    const weights = [];
    for (let i = 0; i < NH_GENERATORS.length; i++) {
        const rank = i + 1;
        const weight = HAND_WEIGHTS[rank] || 1;
        for (let j = 0; j < weight; j++) {
            weights.push(i);
        }
    }
    return NH_GENERATORS[weights[Math.floor(Math.random() * weights.length)]];
}

// Generate a hand scenario
function generateNhScenario() {
    // For 6 or 7 cards, just deal random cards (more realistic)
    if (nhCardCount > 5) {
        return deal(shuffle(createDeck()), nhCardCount);
    }
    
    // For 5 cards, try weighted generator first
    for (let attempts = 0; attempts < 20; attempts++) {
        const generator = selectWeightedGenerator();
        try {
            const cards = generator();
            if (cards && cards.length === 5) {
                return cards;
            }
        } catch (e) {
            // Generator failed, try again
        }
    }
    
    // Fallback: random 5 cards
    return deal(shuffle(createDeck()), 5);
}

// Start new round
function newNameHandRound() {
    nhGameEnded = false;
    nhResultEl.classList.add('hidden');
    nhHandDescEl.textContent = '';
    
    // Reset button states
    const buttons = nhChoicesEl.querySelectorAll('.nh-choice');
    buttons.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong');
        btn.disabled = false;
    });
    
    // Generate scenario based on card count
    nhCards = generateNhScenario();
    
    // Evaluate the best hand from all cards
    const hand = evaluateBestHand(nhCards);
    nhCorrectAnswer = hand.rank;
    
    // Render cards
    renderNhCards();
}

// Render the cards
function renderNhCards() {
    nhCardsEl.innerHTML = '';
    
    // Show cards in random order (as dealt)
    for (const card of nhCards) {
        nhCardsEl.appendChild(createCardElement(card));
    }
}

// Handle user choice
function makeNhChoice(chosenRank) {
    if (nhGameEnded) return;
    nhGameEnded = true;
    
    nhTotalCount++;
    const correct = chosenRank === nhCorrectAnswer;
    
    // Disable all buttons
    const buttons = nhChoicesEl.querySelectorAll('.nh-choice');
    buttons.forEach(btn => {
        btn.disabled = true;
    });
    
    // Mark selected button
    const selectedBtn = nhChoicesEl.querySelector(`[data-rank="${chosenRank}"]`);
    selectedBtn.classList.add('selected');
    
    // Show the hand description (best 5-card hand)
    const hand = evaluateBestHand(nhCards);
    nhHandDescEl.textContent = getHandDescription(hand);
    
    if (correct) {
        nhCorrectCount++;
        nhStreak++;
        selectedBtn.classList.add('correct');
        nhResultMessageEl.textContent = '✓ Correct!';
        nhResultEl.className = 'result perfect';
    } else {
        nhStreak = 0;
        selectedBtn.classList.add('wrong');
        
        // Highlight correct answer
        const correctBtn = nhChoicesEl.querySelector(`[data-rank="${nhCorrectAnswer}"]`);
        correctBtn.classList.add('correct');
        
        const correctName = HAND_OPTIONS.find(o => o.rank === nhCorrectAnswer).name;
        nhResultMessageEl.textContent = `✗ It's ${correctName}`;
        nhResultEl.className = 'result failed';
    }
    
    // Update stats
    updateNhStats();
    
    // Show result
    nhResultEl.classList.remove('hidden');
}

// Update stats display
function updateNhStats() {
    nhStreakEl.textContent = nhStreak;
    nhCorrectEl.textContent = nhCorrectCount;
    nhTotalEl.textContent = nhTotalCount;
}
