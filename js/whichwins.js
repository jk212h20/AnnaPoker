// Which Wins Mode - Pick the winner or recognize a tie

// Game state
let wwBoard = [];
let wwHand1 = [];
let wwHand2 = [];
let wwCorrectAnswer = null; // '1', '2', or 'tie'
let wwStreak = 0;
let wwCorrectCount = 0;
let wwTotalCount = 0;
let wwGameEnded = false;

// DOM elements
let wwBoardEl, wwHand1El, wwHand2El, wwHand1DescEl, wwHand2DescEl;
let wwChoice1Btn, wwChoiceTieBtn, wwChoice2Btn;
let wwResultEl, wwResultMessageEl, nextWwBtn;
let wwStreakEl, wwCorrectEl, wwTotalEl;

// Scenario generators - each returns { board, hand1, hand2 } or null if failed
const SCENARIO_GENERATORS = [
    // ========== TIE SCENARIOS ==========
    
    // Straight on board - both play the board
    function straightOnBoardTie() {
        const deck = shuffle(createDeck());
        // Make a straight on board
        const straightStarts = [10, 9, 8, 7, 6, 5]; // T-high down to 6-high
        const startVal = straightStarts[Math.floor(Math.random() * straightStarts.length)];
        
        const board = [];
        const usedSuits = [];
        for (let v = startVal; v > startVal - 5; v--) {
            const suit = SUITS[Math.floor(Math.random() * 4)];
            usedSuits.push(suit);
            board.push(createCard(RANKS[v - 2], suit));
        }
        
        // Make sure board isn't a flush
        if (new Set(usedSuits).size === 1) {
            usedSuits[0] = SUITS[(SUITS.indexOf(usedSuits[0]) + 1) % 4];
        }
        
        // Give both hands cards that can't improve the straight
        const remainingDeck = removeCards(deck, board);
        const lowCards = remainingDeck.filter(c => c.value < startVal - 4 || c.value > startVal + 1);
        
        if (lowCards.length < 4) return null;
        shuffle(lowCards);
        
        return {
            board: board,
            hand1: [lowCards[0], lowCards[1]],
            hand2: [lowCards[2], lowCards[3]]
        };
    },
    
    // Flush on board - both play the board
    function flushOnBoardTie() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        const suitedCards = deck.filter(c => c.suit === suit);
        shuffle(suitedCards);
        
        const board = suitedCards.slice(0, 5);
        const highestBoardCard = Math.max(...board.map(c => c.value));
        
        // Give hands cards in other suits that are lower than board's highest
        const otherSuitCards = deck.filter(c => c.suit !== suit && c.value < highestBoardCard);
        if (otherSuitCards.length < 4) return null;
        shuffle(otherSuitCards);
        
        return {
            board: board,
            hand1: [otherSuitCards[0], otherSuitCards[1]],
            hand2: [otherSuitCards[2], otherSuitCards[3]]
        };
    },
    
    // Quads on board with same kicker
    function quadsOnBoardTie() {
        const quadRank = RANKS[Math.floor(Math.random() * 13)];
        const quadValue = RANK_VALUES[quadRank];
        const deck = createDeck();
        
        const quads = deck.filter(c => c.rank === quadRank);
        const remaining = shuffle(removeCards(deck, quads));
        
        // Find a kicker higher than what we'll give to hands
        const sortedRemaining = sortByValue(remaining);
        const boardKicker = sortedRemaining[0];
        
        // Give both hands cards lower than kicker
        const lowerCards = sortedRemaining.filter(c => c.value < boardKicker.value);
        if (lowerCards.length < 4) return null;
        
        return {
            board: [...quads, boardKicker],
            hand1: [lowerCards[0], lowerCards[1]],
            hand2: [lowerCards[2], lowerCards[3]]
        };
    },
    
    // Two pair on board - kicker ties
    function twoPairBoardTie() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]);
        const pair1Rank = ranks[0];
        const pair2Rank = ranks[1];
        const kickerRank = ranks[2];
        
        const pair1 = deck.filter(c => c.rank === pair1Rank).slice(0, 2);
        const pair2 = deck.filter(c => c.rank === pair2Rank).slice(0, 2);
        const kicker = deck.find(c => c.rank === kickerRank);
        
        const board = [...pair1, ...pair2, kicker];
        const remaining = shuffle(removeCards(deck, board));
        
        // Give hands cards that don't help
        const kickerValue = RANK_VALUES[kickerRank];
        const pair1Value = RANK_VALUES[pair1Rank];
        const pair2Value = RANK_VALUES[pair2Rank];
        
        const lowCards = remaining.filter(c => 
            c.value < kickerValue && 
            c.rank !== pair1Rank && 
            c.rank !== pair2Rank
        );
        
        if (lowCards.length < 4) return null;
        
        return {
            board: board,
            hand1: [lowCards[0], lowCards[1]],
            hand2: [lowCards[2], lowCards[3]]
        };
    },
    
    // ========== WINNER SCENARIOS ==========
    
    // Flush on board but one has higher suited card
    function flushOnBoardOneHigher() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        const suitedCards = sortByValue(deck.filter(c => c.suit === suit));
        
        // Board gets 5 middle/low flush cards (not ace)
        const boardCards = suitedCards.slice(3, 8); // Skip top 3
        if (boardCards.length < 5) return null;
        const board = boardCards.slice(0, 5);
        
        const highestBoardValue = Math.max(...board.map(c => c.value));
        
        // Hand 1 gets a higher suited card
        const higherSuitedCard = suitedCards.find(c => c.value > highestBoardValue);
        if (!higherSuitedCard) return null;
        
        const remaining = shuffle(removeCards(deck, [...board, higherSuitedCard]));
        const otherSuitCards = remaining.filter(c => c.suit !== suit);
        
        return {
            board: board,
            hand1: [higherSuitedCard, otherSuitCards[0]],
            hand2: [otherSuitCards[1], otherSuitCards[2]]
        };
    },
    
    // Straight on board, one has higher straight
    function straightOnBoardOneHigher() {
        // Board: 9-8-7-6-5
        const deck = shuffle(createDeck());
        const startVal = 6 + Math.floor(Math.random() * 4); // 6-9
        
        const board = [];
        for (let v = startVal + 3; v >= startVal - 1; v--) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        if (board.length < 5) return null;
        
        // Make sure not a flush
        const suits = board.map(c => c.suit);
        if (new Set(suits).size === 1) return null;
        
        const remaining = removeCards(deck, board);
        
        // Hand 1 gets the card to make higher straight
        const higherCard = remaining.find(c => c.value === startVal + 4);
        if (!higherCard) return null;
        
        const finalRemaining = shuffle(removeCards(remaining, [higherCard]));
        const lowCards = finalRemaining.filter(c => c.value < startVal - 1);
        
        if (lowCards.length < 3) return null;
        
        return {
            board: board,
            hand1: [higherCard, lowCards[0]],
            hand2: [lowCards[1], lowCards[2]]
        };
    },
    
    // Quads on board - kicker battle
    function quadsOnBoardKickerWins() {
        const quadRank = RANKS[Math.floor(Math.random() * 10)]; // Not high cards
        const deck = createDeck();
        
        const quads = deck.filter(c => c.rank === quadRank);
        const remaining = shuffle(removeCards(deck, quads));
        const sorted = sortByValue(remaining);
        
        // Board kicker is middle
        const boardKicker = sorted[Math.floor(sorted.length / 2)];
        
        // Hand 1 has higher kicker, hand 2 has lower
        const higherCards = sorted.filter(c => c.value > boardKicker.value);
        const lowerCards = sorted.filter(c => c.value < boardKicker.value);
        
        if (higherCards.length < 2 || lowerCards.length < 2) return null;
        
        return {
            board: [...quads, boardKicker],
            hand1: [higherCards[0], lowerCards[0]],
            hand2: [lowerCards[1], lowerCards[2]]
        };
    },
    
    // Same pair - kicker decides
    function samePairKickerBattle() {
        const deck = shuffle(createDeck());
        const pairRank = RANKS[Math.floor(Math.random() * 10) + 3]; // Middle ranks
        const pairCards = deck.filter(c => c.rank === pairRank);
        
        // Board has one of the pair cards plus randoms
        const remaining = shuffle(removeCards(deck, pairCards));
        const boardExtras = remaining.slice(0, 4).filter(c => c.rank !== pairRank);
        const board = [pairCards[0], ...boardExtras.slice(0, 4)];
        
        if (board.length < 5) {
            board.push(remaining[4]);
        }
        
        const finalRemaining = shuffle(removeCards(deck, board));
        const pairCardsLeft = finalRemaining.filter(c => c.rank === pairRank);
        const nonPairCards = sortByValue(finalRemaining.filter(c => c.rank !== pairRank));
        
        if (pairCardsLeft.length < 2 || nonPairCards.length < 2) return null;
        
        // Both get pair, but different kickers
        return {
            board: board,
            hand1: [pairCardsLeft[0], nonPairCards[0]], // Higher kicker
            hand2: [pairCardsLeft[1], nonPairCards[nonPairCards.length - 1]] // Lower kicker
        };
    },
    
    // Full house on board - one makes quads
    function fullHouseOnBoardOneQuads() {
        const deck = createDeck();
        const tripsRank = RANKS[Math.floor(Math.random() * 13)];
        const pairRank = RANKS.find(r => r !== tripsRank);
        
        const trips = deck.filter(c => c.rank === tripsRank).slice(0, 3);
        const pair = deck.filter(c => c.rank === pairRank).slice(0, 2);
        const board = [...trips, ...pair];
        
        const remaining = shuffle(removeCards(deck, board));
        const fourthTrips = remaining.find(c => c.rank === tripsRank);
        
        if (!fourthTrips) return null;
        
        const others = remaining.filter(c => c.rank !== tripsRank && c.rank !== pairRank);
        if (others.length < 3) return null;
        
        return {
            board: board,
            hand1: [fourthTrips, others[0]], // Makes quads
            hand2: [others[1], others[2]]    // Plays board full house
        };
    },
    
    // Both make flush - who has higher?
    function bothMakeFlushBattle() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        const suitedCards = sortByValue(deck.filter(c => c.suit === suit));
        
        if (suitedCards.length < 7) return null;
        
        // Board has 3 of the suit
        const board = [suitedCards[4], suitedCards[5], suitedCards[6]];
        
        // Add 2 non-suited cards to board
        const nonSuited = deck.filter(c => c.suit !== suit);
        board.push(nonSuited[0], nonSuited[1]);
        
        // Hand 1 gets higher flush cards, hand 2 gets lower
        return {
            board: board,
            hand1: [suitedCards[0], suitedCards[1]], // Nut flush area
            hand2: [suitedCards[2], suitedCards[3]]  // 2nd nut area
        };
    },
    
    // Two pair vs two pair - higher wins
    function twoPairVsTwoPair() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]).slice(0, 5);
        
        // Board has one pair
        const boardPairRank = ranks[0];
        const boardPair = deck.filter(c => c.rank === boardPairRank).slice(0, 2);
        const remaining = shuffle(removeCards(deck, boardPair));
        
        // Add 3 different cards to board
        const diffCards = remaining.filter(c => c.rank !== boardPairRank).slice(0, 3);
        const board = [...boardPair, ...diffCards];
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1 pairs a higher board card
        // Hand 2 pairs a lower board card
        const boardValues = diffCards.map(c => c.value).sort((a, b) => b - a);
        const highPairCard = finalRemaining.find(c => c.value === boardValues[0]);
        const lowPairCard = finalRemaining.find(c => c.value === boardValues[2]);
        
        if (!highPairCard || !lowPairCard) return null;
        
        const others = finalRemaining.filter(c => c !== highPairCard && c !== lowPairCard);
        
        return {
            board: board,
            hand1: [highPairCard, others[0]],
            hand2: [lowPairCard, others[1]]
        };
    }
];

// Initialize which wins mode
function initWhichWinsMode() {
    wwBoardEl = document.getElementById('ww-board-cards');
    wwHand1El = document.getElementById('ww-hand1-cards');
    wwHand2El = document.getElementById('ww-hand2-cards');
    wwHand1DescEl = document.getElementById('ww-hand1-desc');
    wwHand2DescEl = document.getElementById('ww-hand2-desc');
    wwChoice1Btn = document.getElementById('ww-choice-1');
    wwChoiceTieBtn = document.getElementById('ww-choice-tie');
    wwChoice2Btn = document.getElementById('ww-choice-2');
    wwResultEl = document.getElementById('ww-result');
    wwResultMessageEl = document.getElementById('ww-result-message');
    nextWwBtn = document.getElementById('next-ww-btn');
    wwStreakEl = document.getElementById('ww-streak');
    wwCorrectEl = document.getElementById('ww-correct');
    wwTotalEl = document.getElementById('ww-total');
    
    wwChoice1Btn.addEventListener('click', () => makeChoice('1'));
    wwChoiceTieBtn.addEventListener('click', () => makeChoice('tie'));
    wwChoice2Btn.addEventListener('click', () => makeChoice('2'));
    nextWwBtn.addEventListener('click', newWhichWinsRound);
}

// Generate a scenario (from generator or random)
function generateScenario() {
    // 70% template, 30% random
    if (Math.random() < 0.7) {
        // Try generators
        const shuffledGenerators = shuffle([...SCENARIO_GENERATORS]);
        for (const generator of shuffledGenerators) {
            try {
                const result = generator();
                if (result && result.board && result.hand1 && result.hand2) {
                    return result;
                }
            } catch (e) {
                // Generator failed, try next
            }
        }
    }
    
    // Fall back to random
    const deck = shuffle(createDeck());
    return {
        board: deal(deck, 5),
        hand1: deal(deck, 2),
        hand2: deal(deck, 2)
    };
}

// Determine the correct answer
function determineWinner(board, hand1, hand2) {
    const eval1 = evaluateHand(board, hand1);
    const eval2 = evaluateHand(board, hand2);
    const comparison = compareHands(eval1, eval2);
    
    if (comparison > 0) return '1';
    if (comparison < 0) return '2';
    return 'tie';
}

// Start new round
function newWhichWinsRound() {
    wwGameEnded = false;
    wwResultEl.classList.add('hidden');
    
    // Reset button states
    wwChoice1Btn.classList.remove('selected', 'correct', 'wrong');
    wwChoiceTieBtn.classList.remove('selected', 'correct', 'wrong');
    wwChoice2Btn.classList.remove('selected', 'correct', 'wrong');
    wwChoice1Btn.disabled = false;
    wwChoiceTieBtn.disabled = false;
    wwChoice2Btn.disabled = false;
    
    // Generate scenario
    const scenario = generateScenario();
    wwBoard = scenario.board;
    wwHand1 = scenario.hand1;
    wwHand2 = scenario.hand2;
    
    // Randomly swap hands so hand1 doesn't always win from templates
    if (Math.random() < 0.5) {
        [wwHand1, wwHand2] = [wwHand2, wwHand1];
    }
    
    // Determine correct answer
    wwCorrectAnswer = determineWinner(wwBoard, wwHand1, wwHand2);
    
    // Render
    renderWwBoard();
    renderWwHands();
}

// Render board
function renderWwBoard() {
    wwBoardEl.innerHTML = '';
    for (const card of wwBoard) {
        wwBoardEl.appendChild(createCardElement(card));
    }
}

// Render hands
function renderWwHands() {
    wwHand1El.innerHTML = '';
    wwHand2El.innerHTML = '';
    
    for (const card of wwHand1) {
        wwHand1El.appendChild(createCardElement(card));
    }
    for (const card of wwHand2) {
        wwHand2El.appendChild(createCardElement(card));
    }
    
    // Show hand descriptions
    const eval1 = evaluateHand(wwBoard, wwHand1);
    const eval2 = evaluateHand(wwBoard, wwHand2);
    wwHand1DescEl.textContent = getHandDescription(eval1);
    wwHand2DescEl.textContent = getHandDescription(eval2);
}

// Handle user choice
function makeChoice(choice) {
    if (wwGameEnded) return;
    wwGameEnded = true;
    
    wwTotalCount++;
    const correct = choice === wwCorrectAnswer;
    
    // Disable buttons
    wwChoice1Btn.disabled = true;
    wwChoiceTieBtn.disabled = true;
    wwChoice2Btn.disabled = true;
    
    // Mark selected button
    const selectedBtn = choice === '1' ? wwChoice1Btn : 
                        choice === '2' ? wwChoice2Btn : wwChoiceTieBtn;
    selectedBtn.classList.add('selected');
    
    // Mark correct/wrong
    if (correct) {
        wwCorrectCount++;
        wwStreak++;
        selectedBtn.classList.add('correct');
        wwResultMessageEl.textContent = '✓ Correct!';
        wwResultEl.className = 'result perfect';
    } else {
        wwStreak = 0;
        selectedBtn.classList.add('wrong');
        
        // Highlight correct answer
        const correctBtn = wwCorrectAnswer === '1' ? wwChoice1Btn :
                          wwCorrectAnswer === '2' ? wwChoice2Btn : wwChoiceTieBtn;
        correctBtn.classList.add('correct');
        
        const answerText = wwCorrectAnswer === 'tie' ? 'Tie' : `Hand ${wwCorrectAnswer}`;
        wwResultMessageEl.textContent = `✗ Answer: ${answerText}`;
        wwResultEl.className = 'result failed';
    }
    
    // Update stats
    updateWwStats();
    
    // Show result
    wwResultEl.classList.remove('hidden');
}

// Update stats
function updateWwStats() {
    wwStreakEl.textContent = wwStreak;
    wwCorrectEl.textContent = wwCorrectCount;
    wwTotalEl.textContent = wwTotalCount;
}
