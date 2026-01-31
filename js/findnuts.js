// Find The Nuts Mode - Find the best possible hole cards

// Game state
let fnBoard = [];
let fnBoardSize = 5;
let fnSelectedCards = [];
let fnNutHands = [];
let fnStreak = 0;
let fnCorrectCount = 0;
let fnTotalCount = 0;
let fnGameEnded = false;

// DOM elements
let fnBoardEl, fnCardGridEl, fnSelectedCountEl, fnResultEl, fnResultMessageEl;
let fnCheckBtn, fnClearBtn, nextFnBtn, fnNutsDisplayEl;
let fnStreakEl, fnCorrectEl, fnTotalEl;
let fnBoardSizeBtns;

// Initialize find nuts mode
function initFindNutsMode() {
    fnBoardEl = document.getElementById('fn-board-cards');
    fnCardGridEl = document.getElementById('fn-card-grid');
    fnSelectedCountEl = document.getElementById('fn-selected-count');
    fnResultEl = document.getElementById('fn-result');
    fnResultMessageEl = document.getElementById('fn-result-message');
    fnCheckBtn = document.getElementById('fn-check-btn');
    fnClearBtn = document.getElementById('fn-clear-btn');
    nextFnBtn = document.getElementById('next-fn-btn');
    fnNutsDisplayEl = document.getElementById('fn-nuts-display');
    fnStreakEl = document.getElementById('fn-streak');
    fnCorrectEl = document.getElementById('fn-correct');
    fnTotalEl = document.getElementById('fn-total');
    
    // Board size buttons
    fnBoardSizeBtns = document.querySelectorAll('#fn-board-size .fn-size-btn');
    fnBoardSizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            fnBoardSizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fnBoardSize = parseInt(btn.dataset.size);
            newFindNutsRound();
        });
    });
    
    fnCheckBtn.addEventListener('click', checkFindNutsAnswer);
    fnClearBtn.addEventListener('click', clearFindNutsSelection);
    nextFnBtn.addEventListener('click', newFindNutsRound);
}

// Calculate all nut hands for a given board
function calculateNutHands(board) {
    const deck = createDeck();
    const remainingCards = removeCards(deck, board);
    
    let bestHand = null;
    let nutCombos = [];
    
    // Try all 2-card combinations
    for (let i = 0; i < remainingCards.length; i++) {
        for (let j = i + 1; j < remainingCards.length; j++) {
            const holeCards = [remainingCards[i], remainingCards[j]];
            const hand = evaluateHand(board, holeCards);
            
            if (!bestHand || compareHands(hand, bestHand) > 0) {
                bestHand = hand;
                nutCombos = [holeCards];
            } else if (compareHands(hand, bestHand) === 0) {
                nutCombos.push(holeCards);
            }
        }
    }
    
    return {
        bestHand: bestHand,
        nutCombos: nutCombos
    };
}

// Template generators for teaching specific nut scenarios
const NUT_SCENARIO_GENERATORS = [
    // Nut flush - need Ace of the flush suit
    function generateNutFlushScenario() {
        const deck = shuffle(createDeck());
        const flushSuit = SUITS[Math.floor(Math.random() * 4)];
        const suitedCards = sortByValue(deck.filter(c => c.suit === flushSuit));
        
        // Board: 3 suited cards (not including Ace)
        const boardFlush = suitedCards.filter(c => c.rank !== 'A').slice(0, 3);
        const nonSuited = shuffle(deck.filter(c => c.suit !== flushSuit)).slice(0, 2);
        const board = [...boardFlush, ...nonSuited];
        
        if (board.length < 5) return null;
        return board;
    },
    
    // Broadway straight - A-K-Q-J-T
    function generateBroadwayScenario() {
        const deck = shuffle(createDeck());
        const broadwayRanks = ['A', 'K', 'Q', 'J', 'T'];
        
        // Board: 3 broadway cards, need to find the other 2
        const indices = shuffle([0, 1, 2, 3, 4]).slice(0, 3);
        const board = [];
        
        for (const i of indices) {
            const card = deck.find(c => c.rank === broadwayRanks[i]);
            if (card) board.push(card);
        }
        
        // Add 2 low cards that don't interfere
        const remaining = removeCards(deck, board);
        const lowCards = remaining.filter(c => c.value <= 6);
        shuffle(lowCards);
        board.push(...lowCards.slice(0, 2));
        
        // Ensure no flush
        if (board.length >= 5 && new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 5 ? board : null;
    },
    
    // Wheel straight - A-2-3-4-5
    function generateWheelScenario() {
        const deck = shuffle(createDeck());
        const wheelRanks = ['A', '2', '3', '4', '5'];
        
        // Board: 3 wheel cards
        const indices = shuffle([0, 1, 2, 3, 4]).slice(0, 3);
        const board = [];
        
        for (const i of indices) {
            const card = deck.find(c => c.rank === wheelRanks[i]);
            if (card) board.push(card);
        }
        
        // Add 2 high cards
        const remaining = removeCards(deck, board);
        const highCards = remaining.filter(c => c.value >= 9 && !wheelRanks.includes(c.rank));
        shuffle(highCards);
        board.push(...highCards.slice(0, 2));
        
        if (board.length >= 5 && new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 5 ? board : null;
    },
    
    // Middle straight - connected cards like 6-7-8-9-T
    function generateMiddleStraightScenario() {
        const deck = shuffle(createDeck());
        const startVal = 5 + Math.floor(Math.random() * 4); // 5-8
        
        // Board: 3 connected cards
        const board = [];
        const values = shuffle([startVal, startVal + 1, startVal + 2, startVal + 3, startVal + 4]).slice(0, 3);
        
        for (const v of values) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        // Add 2 non-connecting cards
        const remaining = removeCards(deck, board);
        const fillers = remaining.filter(c => c.value < startVal - 1 || c.value > startVal + 5);
        shuffle(fillers);
        board.push(...fillers.slice(0, 2));
        
        if (board.length >= 5 && new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 5 ? board : null;
    },
    
    // Full house scenario - paired board
    function generateFullHouseScenario() {
        const deck = shuffle(createDeck());
        const pairRank = RANKS[Math.floor(Math.random() * 13)];
        const pairCards = deck.filter(c => c.rank === pairRank).slice(0, 2);
        
        const board = [...pairCards];
        const remaining = removeCards(deck, board);
        
        // Add 3 different ranked cards
        const otherRanks = shuffle(RANKS.filter(r => r !== pairRank)).slice(0, 3);
        for (const rank of otherRanks) {
            const card = remaining.find(c => c.rank === rank);
            if (card) board.push(card);
        }
        
        // Ensure no flush possible
        if (board.length >= 5 && new Set(board.map(c => c.suit)).size <= 2) return null;
        return board.length === 5 ? board : null;
    },
    
    // Trips on board - quads possible
    function generateQuadsScenario() {
        const deck = shuffle(createDeck());
        const tripsRank = RANKS[Math.floor(Math.random() * 13)];
        const tripsCards = deck.filter(c => c.rank === tripsRank).slice(0, 3);
        
        const board = [...tripsCards];
        const remaining = removeCards(deck, board);
        
        // Add 2 different cards
        const otherRanks = shuffle(RANKS.filter(r => r !== tripsRank)).slice(0, 2);
        for (const rank of otherRanks) {
            const card = remaining.find(c => c.rank === rank);
            if (card) board.push(card);
        }
        
        return board.length === 5 ? board : null;
    },
    
    // Four to a flush - need the Ace
    function generateFourFlushScenario() {
        const deck = shuffle(createDeck());
        const flushSuit = SUITS[Math.floor(Math.random() * 4)];
        const suitedCards = sortByValue(deck.filter(c => c.suit === flushSuit && c.rank !== 'A'));
        
        // Board: 4 suited cards (not Ace)
        const board = suitedCards.slice(0, 4);
        const remaining = removeCards(deck, board);
        
        // Add 1 off-suit card
        const offSuit = remaining.filter(c => c.suit !== flushSuit);
        shuffle(offSuit);
        board.push(offSuit[0]);
        
        return board.length === 5 ? board : null;
    },
    
    // Straight flush possible
    function generateStraightFlushScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const startVal = 5 + Math.floor(Math.random() * 5); // 5-9
        
        // Board: 3 connected suited cards
        const board = [];
        const values = shuffle([startVal, startVal + 1, startVal + 2]).slice(0, 3);
        
        for (const v of values) {
            const card = deck.find(c => c.value === v && c.suit === suit);
            if (card) board.push(card);
        }
        
        if (board.length < 3) return null;
        
        // Add 2 off-suit non-connecting cards
        const remaining = removeCards(deck, board);
        const fillers = remaining.filter(c => c.suit !== suit && (c.value < startVal - 1 || c.value > startVal + 4));
        shuffle(fillers);
        board.push(...fillers.slice(0, 2));
        
        return board.length === 5 ? board : null;
    },
    
    // Two pair on board - full house dominates
    function generateTwoPairBoardScenario() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]).slice(0, 2);
        
        const board = [];
        for (const rank of ranks) {
            const cards = deck.filter(c => c.rank === rank).slice(0, 2);
            board.push(...cards);
        }
        
        // Add 1 kicker
        const remaining = removeCards(deck, board);
        const kicker = remaining.find(c => c.rank !== ranks[0] && c.rank !== ranks[1]);
        board.push(kicker);
        
        return board.length === 5 ? board : null;
    },
    
    // Rainbow board with straight potential
    function generateRainbowStraightScenario() {
        const deck = shuffle(createDeck());
        const startVal = 6 + Math.floor(Math.random() * 4); // 6-9
        
        const board = [];
        const suits = shuffle([...SUITS]);
        
        // 3 connected cards, different suits
        for (let i = 0; i < 3 && i < suits.length; i++) {
            const card = deck.find(c => c.value === startVal + i && c.suit === suits[i]);
            if (card) board.push(card);
        }
        
        if (board.length < 3) return null;
        
        // Add 2 non-connecting cards with remaining suits
        const remaining = removeCards(deck, board);
        const fillers = remaining.filter(c => 
            c.value < startVal - 1 || c.value > startVal + 4
        ).slice(0, 2);
        board.push(...fillers);
        
        // Ensure 4 different suits (rainbow)
        if (new Set(board.map(c => c.suit)).size < 4) return null;
        return board.length === 5 ? board : null;
    },
    
    // Gutshot straight scenario - one card makes the nuts
    function generateGutshotScenario() {
        const deck = shuffle(createDeck());
        const midVal = 7 + Math.floor(Math.random() * 4); // 7-10
        
        // Board has gap: e.g., 6-7-_-9-10
        const board = [];
        const values = [midVal - 2, midVal - 1, midVal + 1, midVal + 2];
        const boardValues = shuffle(values).slice(0, 3);
        
        for (const v of boardValues) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        // Add 2 unconnected cards
        const remaining = removeCards(deck, board);
        const fillers = remaining.filter(c => 
            c.value < midVal - 3 || c.value > midVal + 3
        );
        shuffle(fillers);
        board.push(...fillers.slice(0, 2));
        
        if (board.length >= 5 && new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 5 ? board : null;
    },
    
    // Monotone board (all same suit) - nut flush with Ace
    function generateMonotoneScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const suitedCards = sortByValue(deck.filter(c => c.suit === suit && c.rank !== 'A'));
        
        // Board: 5 cards of same suit (not Ace)
        shuffle(suitedCards);
        const board = suitedCards.slice(0, 5);
        
        return board.length === 5 ? board : null;
    },
    
    // Double paired board - e.g., Q-Q-8-8-3, full house dominates
    function generateDoublePairedScenario() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]).slice(0, 2);
        
        const board = [];
        for (const rank of ranks) {
            const cards = deck.filter(c => c.rank === rank).slice(0, 2);
            board.push(...cards);
        }
        
        // Add 1 different kicker card
        const remaining = removeCards(deck, board);
        const kickers = remaining.filter(c => c.rank !== ranks[0] && c.rank !== ranks[1]);
        shuffle(kickers);
        board.push(kickers[0]);
        
        // Ensure variety of suits
        if (new Set(board.map(c => c.suit)).size < 3) return null;
        return board.length === 5 ? board : null;
    },
    
    // Paired board + straight flush possible - tricky! SF beats full house
    function generatePairedWithStraightFlushScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const startVal = 4 + Math.floor(Math.random() * 6); // 4-9
        
        // Board: 3 connected suited cards + pair
        const board = [];
        const sfValues = [startVal, startVal + 1, startVal + 2];
        
        // Add 2 of the straight flush cards
        for (let i = 0; i < 2; i++) {
            const card = deck.find(c => c.value === sfValues[i] && c.suit === suit);
            if (card) board.push(card);
        }
        
        if (board.length < 2) return null;
        
        // Add a pair (different rank, off-suit)
        const remaining = removeCards(deck, board);
        const pairRank = RANKS[Math.floor(Math.random() * 6) + 6]; // High card pair
        const pairCards = remaining.filter(c => c.rank === pairRank && c.suit !== suit).slice(0, 2);
        board.push(...pairCards);
        
        if (board.length < 4) return null;
        
        // Add one more SF card
        const remaining2 = removeCards(deck, board);
        const thirdSF = remaining2.find(c => c.value === sfValues[2] && c.suit === suit);
        if (thirdSF) board.push(thirdSF);
        else {
            // Add off-suit filler
            const filler = remaining2.find(c => c.suit !== suit);
            board.push(filler);
        }
        
        return board.length === 5 ? board : null;
    },
    
    // Royal flush possible - Broadway cards same suit
    function generateRoyalFlushScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const royalRanks = ['A', 'K', 'Q', 'J', 'T'];
        
        // Board: 3 royal flush cards of same suit
        const indices = shuffle([0, 1, 2, 3, 4]).slice(0, 3);
        const board = [];
        
        for (const i of indices) {
            const card = deck.find(c => c.rank === royalRanks[i] && c.suit === suit);
            if (card) board.push(card);
        }
        
        if (board.length < 3) return null;
        
        // Add 2 off-suit, non-royal cards
        const remaining = removeCards(deck, board);
        const fillers = remaining.filter(c => 
            c.suit !== suit && !royalRanks.includes(c.rank)
        );
        shuffle(fillers);
        board.push(...fillers.slice(0, 2));
        
        return board.length === 5 ? board : null;
    },
    
    // Flush vs straight flush - flush on board but SF possible
    function generateFlushVsStraightFlushScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const startVal = 5 + Math.floor(Math.random() * 5); // 5-9
        
        // Board: 4 suited cards (3 connected + 1 gap)
        const board = [];
        const values = [startVal, startVal + 1, startVal + 3]; // Gap in middle
        
        for (const v of values) {
            const card = deck.find(c => c.value === v && c.suit === suit);
            if (card) board.push(card);
        }
        
        if (board.length < 3) return null;
        
        // Add another suited card (high)
        const remaining = removeCards(deck, board);
        const highSuited = remaining.find(c => c.suit === suit && c.value > startVal + 4);
        if (highSuited) board.push(highSuited);
        
        // Add 1 off-suit card
        const remaining2 = removeCards(deck, board);
        const offSuit = remaining2.find(c => c.suit !== suit);
        board.push(offSuit);
        
        return board.length === 5 ? board : null;
    },
    
    // High card board - no pairs, no flush, no straight possible
    function generateHighCardScenario() {
        const deck = shuffle(createDeck());
        const suits = shuffle([...SUITS]);
        
        // Pick 5 non-connected values with different suits
        const values = [14, 11, 8, 5, 2]; // A, J, 8, 5, 2 - no straight possible
        const board = [];
        
        for (let i = 0; i < values.length && i < suits.length; i++) {
            const card = deck.find(c => c.value === values[i] && c.suit === suits[i % 4]);
            if (card) board.push(card);
        }
        
        // Ensure 4 different suits (no flush possible)
        if (new Set(board.map(c => c.suit)).size < 4) return null;
        return board.length === 5 ? board : null;
    },
    
    // Ace blocker scenario - Ace on board blocks nut flush
    function generateAceBlockerScenario() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        
        // Board: 3 suited cards INCLUDING the Ace
        const ace = deck.find(c => c.rank === 'A' && c.suit === suit);
        const otherSuited = sortByValue(deck.filter(c => 
            c.suit === suit && c.rank !== 'A' && c.rank !== 'K'
        )).slice(0, 2);
        
        const board = [ace, ...otherSuited];
        
        // Add 2 off-suit cards
        const remaining = removeCards(deck, board);
        const offSuit = remaining.filter(c => c.suit !== suit);
        shuffle(offSuit);
        board.push(...offSuit.slice(0, 2));
        
        return board.length === 5 ? board : null;
    }
];

// Flop-specific templates (3 cards)
const FLOP_SCENARIO_GENERATORS = [
    // Three to a flush - need A + suited card
    function generateFlopFlushDraw() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const suitedCards = deck.filter(c => c.suit === suit && c.rank !== 'A');
        shuffle(suitedCards);
        return suitedCards.slice(0, 3);
    },
    
    // Three connected - straight draw
    function generateFlopStraightDraw() {
        const deck = shuffle(createDeck());
        const startVal = 5 + Math.floor(Math.random() * 6); // 5-10
        const board = [];
        for (let v = startVal; v <= startVal + 2; v++) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 3 ? board : null;
    },
    
    // Paired flop - trips possible
    function generateFlopPaired() {
        const deck = shuffle(createDeck());
        const pairRank = RANKS[Math.floor(Math.random() * 13)];
        const pair = deck.filter(c => c.rank === pairRank).slice(0, 2);
        const remaining = removeCards(deck, pair);
        const kicker = remaining.find(c => c.rank !== pairRank);
        return [...pair, kicker];
    },
    
    // Broadway flop - A-K-Q type
    function generateFlopBroadway() {
        const deck = shuffle(createDeck());
        const broadwayRanks = shuffle(['A', 'K', 'Q', 'J', 'T']).slice(0, 3);
        const board = [];
        for (const r of broadwayRanks) {
            const card = deck.find(c => c.rank === r);
            if (card) board.push(card);
        }
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 3 ? board : null;
    },
    
    // Two-tone flop (2 suited) - flush draw possible
    function generateFlopTwoTone() {
        const deck = shuffle(createDeck());
        const suits = shuffle([...SUITS]);
        const mainSuit = suits[0];
        const offSuit = suits[1];
        
        const suited = deck.filter(c => c.suit === mainSuit && c.rank !== 'A').slice(0, 2);
        const remaining = removeCards(deck, suited);
        const off = remaining.find(c => c.suit === offSuit);
        return [...suited, off];
    },
    
    // Dry rainbow flop - no draws
    function generateFlopRainbowDry() {
        const deck = shuffle(createDeck());
        const values = [14, 8, 3]; // A, 8, 3 - disconnected
        const suits = shuffle([...SUITS]).slice(0, 3);
        const board = [];
        for (let i = 0; i < values.length; i++) {
            const card = deck.find(c => c.value === values[i] && c.suit === suits[i]);
            if (card) board.push(card);
        }
        return board.length === 3 ? board : null;
    }
];

// Turn-specific templates (4 cards)
const TURN_SCENARIO_GENERATORS = [
    // Four to a flush - need A
    function generateTurnFlushDraw() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const suited = deck.filter(c => c.suit === suit && c.rank !== 'A');
        shuffle(suited);
        return suited.slice(0, 4);
    },
    
    // Open-ended straight draw on turn
    function generateTurnOESD() {
        const deck = shuffle(createDeck());
        const startVal = 5 + Math.floor(Math.random() * 5); // 5-9
        const board = [];
        for (let v = startVal; v <= startVal + 3; v++) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 4 ? board : null;
    },
    
    // Paired board on turn
    function generateTurnPaired() {
        const deck = shuffle(createDeck());
        const pairRank = RANKS[Math.floor(Math.random() * 13)];
        const pair = deck.filter(c => c.rank === pairRank).slice(0, 2);
        const remaining = removeCards(deck, pair);
        const kickers = shuffle(remaining.filter(c => c.rank !== pairRank)).slice(0, 2);
        const board = [...pair, ...kickers];
        if (new Set(board.map(c => c.suit)).size <= 2) return null;
        return board.length === 4 ? board : null;
    },
    
    // Two pair on turn - boat draws
    function generateTurnTwoPair() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]).slice(0, 2);
        const board = [];
        for (const r of ranks) {
            const cards = deck.filter(c => c.rank === r).slice(0, 2);
            board.push(...cards);
        }
        if (new Set(board.map(c => c.suit)).size < 3) return null;
        return board.length === 4 ? board : null;
    },
    
    // Trips on turn - quads or boat
    function generateTurnTrips() {
        const deck = shuffle(createDeck());
        const tripsRank = RANKS[Math.floor(Math.random() * 13)];
        const trips = deck.filter(c => c.rank === tripsRank).slice(0, 3);
        const remaining = removeCards(deck, trips);
        const kicker = remaining.find(c => c.rank !== tripsRank);
        return [...trips, kicker];
    },
    
    // Gutshot turn
    function generateTurnGutshot() {
        const deck = shuffle(createDeck());
        const midVal = 7 + Math.floor(Math.random() * 3); // 7-9
        const values = [midVal - 2, midVal - 1, midVal + 1, midVal + 2];
        const boardValues = shuffle(values).slice(0, 4);
        const board = [];
        for (const v of boardValues) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        return board.length === 4 ? board : null;
    }
];

// Get a board from template or random based on board size
function getScenarioBoard(boardSize) {
    // Select appropriate template generators based on board size
    let generators;
    if (boardSize === 3) {
        generators = [...FLOP_SCENARIO_GENERATORS];
    } else if (boardSize === 4) {
        generators = [...TURN_SCENARIO_GENERATORS];
    } else {
        generators = [...NUT_SCENARIO_GENERATORS];
    }
    
    // 70% chance of using a template
    if (Math.random() < 0.7) {
        shuffle(generators);
        for (const generator of generators) {
            try {
                const board = generator();
                if (board && board.length === boardSize) {
                    return board;
                }
            } catch (e) {
                // Generator failed, try next
            }
        }
    }
    
    // Fallback to random
    const deck = shuffle(createDeck());
    return deal(deck, boardSize);
}

// Start new round
function newFindNutsRound() {
    fnGameEnded = false;
    fnSelectedCards = [];
    fnResultEl.classList.add('hidden');
    fnNutsDisplayEl.innerHTML = '';
    fnCheckBtn.disabled = true;
    
    // Deal board using template or random
    fnBoard = getScenarioBoard(fnBoardSize);
    
    // Calculate nuts
    const result = calculateNutHands(fnBoard);
    fnNutHands = result.nutCombos;
    
    // Render
    renderFnBoard();
    renderCardGrid();
    updateFnSelectedCount();
}

// Render the board
function renderFnBoard() {
    fnBoardEl.innerHTML = '';
    for (const card of fnBoard) {
        fnBoardEl.appendChild(createCardElement(card));
    }
}

// Render the 52-card grid
function renderCardGrid() {
    fnCardGridEl.innerHTML = '';
    
    const boardCardStrings = new Set(fnBoard.map(c => cardToString(c)));
    
    // Create grid by suit
    for (const suit of SUITS) {
        const suitRow = document.createElement('div');
        suitRow.className = 'fn-suit-row';
        
        // Suit symbol
        const suitLabel = document.createElement('span');
        suitLabel.className = `fn-suit-label ${suit}`;
        suitLabel.textContent = SUIT_SYMBOLS[suit];
        suitRow.appendChild(suitLabel);
        
        // Cards in this suit (A to 2)
        for (let i = RANKS.length - 1; i >= 0; i--) {
            const rank = RANKS[i];
            const card = createCard(rank, suit);
            const cardStr = cardToString(card);
            
            const cardEl = document.createElement('div');
            cardEl.className = `fn-grid-card ${suit}`;
            cardEl.textContent = RANK_DISPLAY[rank];
            cardEl.dataset.cardString = cardStr;
            
            if (boardCardStrings.has(cardStr)) {
                cardEl.classList.add('disabled');
            } else {
                cardEl.addEventListener('click', () => toggleFnCardSelection(card, cardEl));
            }
            
            suitRow.appendChild(cardEl);
        }
        
        fnCardGridEl.appendChild(suitRow);
    }
}

// Toggle card selection
function toggleFnCardSelection(card, element) {
    if (fnGameEnded) return;
    
    const cardStr = cardToString(card);
    const index = fnSelectedCards.findIndex(c => cardToString(c) === cardStr);
    
    if (index > -1) {
        // Deselect
        fnSelectedCards.splice(index, 1);
        element.classList.remove('selected');
    } else if (fnSelectedCards.length < 2) {
        // Select
        fnSelectedCards.push(card);
        element.classList.add('selected');
    }
    
    updateFnSelectedCount();
    fnCheckBtn.disabled = fnSelectedCards.length !== 2;
}

// Clear selection
function clearFindNutsSelection() {
    if (fnGameEnded) return;
    
    fnSelectedCards = [];
    const cardEls = fnCardGridEl.querySelectorAll('.fn-grid-card.selected');
    cardEls.forEach(el => el.classList.remove('selected'));
    updateFnSelectedCount();
    fnCheckBtn.disabled = true;
}

// Update selected count display
function updateFnSelectedCount() {
    fnSelectedCountEl.textContent = fnSelectedCards.length;
}

// Check if a hand is unbeatable given the blockers held
function isUnbeatable(board, holeCards) {
    const userHand = evaluateHand(board, holeCards);
    
    // Get all cards not on board and not in hole cards
    const deck = createDeck();
    const usedCards = [...board, ...holeCards];
    const remainingCards = removeCards(deck, usedCards);
    
    // Check all possible opponent hands with remaining cards
    for (let i = 0; i < remainingCards.length; i++) {
        for (let j = i + 1; j < remainingCards.length; j++) {
            const oppHoleCards = [remainingCards[i], remainingCards[j]];
            const oppHand = evaluateHand(board, oppHoleCards);
            
            // If any hand beats ours, we don't have the nuts
            if (compareHands(oppHand, userHand) > 0) {
                return false;
            }
        }
    }
    
    return true;
}

// Check the answer
function checkFindNutsAnswer() {
    if (fnGameEnded || fnSelectedCards.length !== 2) return;
    
    fnGameEnded = true;
    fnTotalCount++;
    
    // Evaluate user's selection
    const userHand = evaluateHand(fnBoard, fnSelectedCards);
    const nutHand = evaluateHand(fnBoard, fnNutHands[0]);
    
    // Check if hand is unbeatable (accounts for blockers!)
    const isCorrect = isUnbeatable(fnBoard, fnSelectedCards);
    
    // Mark selected cards
    const cardEls = fnCardGridEl.querySelectorAll('.fn-grid-card');
    cardEls.forEach(el => {
        el.style.pointerEvents = 'none';
    });
    
    if (isCorrect) {
        fnCorrectCount++;
        fnStreak++;
        fnResultMessageEl.textContent = '✓ You found the nuts!';
        fnResultEl.className = 'result perfect';
        
        // Mark as correct
        fnSelectedCards.forEach(card => {
            const cardStr = cardToString(card);
            const el = fnCardGridEl.querySelector(`[data-card-string="${cardStr}"]`);
            if (el) el.classList.add('correct');
        });
    } else {
        fnStreak = 0;
        fnResultMessageEl.textContent = '✗ Not the nuts';
        fnResultEl.className = 'result failed';
        
        // Mark as wrong
        fnSelectedCards.forEach(card => {
            const cardStr = cardToString(card);
            const el = fnCardGridEl.querySelector(`[data-card-string="${cardStr}"]`);
            if (el) el.classList.add('wrong');
        });
        
        // Show the nut hands
        showNutHands(nutHand);
    }
    
    // Update stats
    updateFnStats();
    fnResultEl.classList.remove('hidden');
}

// Show the nut hands
function showNutHands(nutHand) {
    fnNutsDisplayEl.innerHTML = '';
    
    const label = document.createElement('div');
    label.className = 'fn-nuts-label';
    label.textContent = `The Nuts: ${getHandDescription(nutHand)}`;
    fnNutsDisplayEl.appendChild(label);
    
    const combosContainer = document.createElement('div');
    combosContainer.className = 'fn-nuts-combos';
    
    // Show up to 6 nut combos
    const displayCombos = fnNutHands.slice(0, 6);
    
    for (const combo of displayCombos) {
        const comboEl = document.createElement('div');
        comboEl.className = 'fn-nut-combo';
        
        for (const card of combo) {
            comboEl.appendChild(createCardElement(card));
        }
        
        combosContainer.appendChild(comboEl);
    }
    
    if (fnNutHands.length > 6) {
        const moreEl = document.createElement('div');
        moreEl.className = 'fn-nuts-more';
        moreEl.textContent = `+${fnNutHands.length - 6} more`;
        combosContainer.appendChild(moreEl);
    }
    
    fnNutsDisplayEl.appendChild(combosContainer);
}

// Update stats display
function updateFnStats() {
    fnStreakEl.textContent = fnStreak;
    fnCorrectEl.textContent = fnCorrectCount;
    fnTotalEl.textContent = fnTotalCount;
}
