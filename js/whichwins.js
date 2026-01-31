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
    },
    
    // ========== FLUSH VS STRAIGHT VS FULL HOUSE SCENARIOS ==========
    
    // Flush beats straight - classic confrontation
    function flushBeatsStraight() {
        const deck = shuffle(createDeck());
        const flushSuit = SUITS[Math.floor(Math.random() * 4)];
        
        // Board: 3 cards of flush suit, 2 cards that enable straight
        // Example: 9♠ 8♠ 5♠ 7♥ 6♦
        const flushCards = deck.filter(c => c.suit === flushSuit);
        const nonFlushCards = deck.filter(c => c.suit !== flushSuit);
        
        shuffle(flushCards);
        shuffle(nonFlushCards);
        
        // Pick 3 flush cards that don't make a straight on board
        const boardFlush = [flushCards[0], flushCards[1], flushCards[2]];
        
        // Pick 2 non-flush cards
        const boardOther = [nonFlushCards[0], nonFlushCards[1]];
        const board = [...boardFlush, ...boardOther];
        
        // Hand 1 gets 2 more flush cards (makes flush)
        const hand1 = [flushCards[3], flushCards[4]];
        
        // Hand 2 gets cards that make a straight with board
        const boardValues = board.map(c => c.value);
        const remaining = removeCards(deck, [...board, ...hand1]);
        
        // Find straight-making cards
        let hand2 = null;
        for (let high = 14; high >= 6; high--) {
            const needed = [];
            for (let v = high; v > high - 5; v--) {
                if (!boardValues.includes(v)) {
                    const card = remaining.find(c => c.value === v && c.suit !== flushSuit);
                    if (card) needed.push(card);
                }
            }
            if (needed.length === 2) {
                hand2 = needed;
                break;
            }
        }
        
        if (!hand2) return null;
        
        return { board, hand1, hand2 };
    },
    
    // Straight beats trips
    function straightBeatsTrips() {
        const deck = shuffle(createDeck());
        
        // Board with pair - one makes trips, other makes hidden straight
        const tripRank = RANKS[Math.floor(Math.random() * 8) + 3]; // 5-Q
        const tripValue = RANK_VALUES[tripRank];
        const tripCards = deck.filter(c => c.rank === tripRank);
        
        // Board: pair + 3 scattered cards
        const board = [tripCards[0], tripCards[1]];
        const remaining = removeCards(deck, board);
        
        // Add cards that could form straight
        const straightHigh = tripValue + 2;
        if (straightHigh > 14) return null;
        
        const suits = shuffle([...SUITS]);
        for (let v = straightHigh; v > straightHigh - 3; v--) {
            if (v !== tripValue) {
                const card = remaining.find(c => c.value === v);
                if (card) board.push(card);
            }
        }
        
        if (board.length < 5) {
            const filler = remaining.find(c => !board.includes(c) && c.value < tripValue - 2);
            if (filler) board.push(filler);
        }
        
        if (board.length < 5) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: completes straight
        const straightCards = [];
        for (let v = straightHigh; v > straightHigh - 5; v--) {
            if (!board.find(c => c.value === v)) {
                const card = finalRemaining.find(c => c.value === v);
                if (card) straightCards.push(card);
            }
        }
        
        if (straightCards.length < 2) return null;
        const hand1 = straightCards.slice(0, 2);
        
        // Hand 2: trips
        const thirdTrip = finalRemaining.find(c => c.rank === tripRank);
        if (!thirdTrip) return null;
        
        const kicker = finalRemaining.find(c => c.rank !== tripRank && !hand1.includes(c));
        const hand2 = [thirdTrip, kicker];
        
        return { board, hand1, hand2 };
    },
    
    // Full house beats flush
    function fullHouseBeatsFlush() {
        const deck = shuffle(createDeck());
        const flushSuit = SUITS[Math.floor(Math.random() * 4)];
        
        // Board: pair + 3 of flush suit (but not all same suit)
        const pairRank = RANKS[Math.floor(Math.random() * 13)];
        const pairCards = deck.filter(c => c.rank === pairRank);
        
        const board = [pairCards[0], pairCards[1]];
        const remaining = removeCards(deck, board);
        
        // Add 3 flush cards
        const flushCards = remaining.filter(c => c.suit === flushSuit && c.rank !== pairRank);
        shuffle(flushCards);
        
        if (flushCards.length < 5) return null;
        board.push(flushCards[0], flushCards[1], flushCards[2]);
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: makes full house (trips up)
        const thirdPair = finalRemaining.find(c => c.rank === pairRank);
        if (!thirdPair) return null;
        
        // Find another pair on board to complete full house
        const boardRanks = board.map(c => c.rank);
        const boardPairRank = boardRanks.find(r => r !== pairRank && boardRanks.filter(x => x === r).length === 1);
        const matchingCard = finalRemaining.find(c => c.rank === boardPairRank);
        
        if (!matchingCard) {
            const anyCard = finalRemaining.find(c => c.rank !== pairRank && c.suit !== flushSuit);
            if (!anyCard) return null;
            return {
                board,
                hand1: [thirdPair, anyCard],
                hand2: [flushCards[3], flushCards[4]]
            };
        }
        
        return {
            board,
            hand1: [thirdPair, matchingCard],
            hand2: [flushCards[3], flushCards[4]]
        };
    },
    
    // Full house beats straight
    function fullHouseBeatsStraight() {
        const deck = shuffle(createDeck());
        
        // Board: trips + 2 cards enabling straight
        const tripRank = RANKS[Math.floor(Math.random() * 9) + 2]; // 4-Q
        const tripValue = RANK_VALUES[tripRank];
        const tripCards = deck.filter(c => c.rank === tripRank).slice(0, 3);
        
        const board = [...tripCards];
        const remaining = removeCards(deck, board);
        
        // Add straight-enabling cards
        const straightHigh = tripValue + 2;
        if (straightHigh > 14 || straightHigh < 5) return null;
        
        for (let v = straightHigh; v > straightHigh - 5; v--) {
            if (v !== tripValue && board.length < 5) {
                const card = remaining.find(c => c.value === v && c.rank !== tripRank);
                if (card) board.push(card);
            }
        }
        
        if (board.length < 5) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: full house (pairs the board)
        const boardValues = board.filter(c => c.rank !== tripRank).map(c => c.value);
        const pairCard = finalRemaining.find(c => boardValues.includes(c.value));
        if (!pairCard) return null;
        
        const filler1 = finalRemaining.find(c => c !== pairCard && c.rank !== tripRank);
        const hand1 = [pairCard, filler1];
        
        // Hand 2: straight
        const neededForStraight = [];
        for (let v = straightHigh; v > straightHigh - 5; v--) {
            if (!board.find(c => c.value === v)) {
                const card = finalRemaining.find(c => c.value === v && c !== pairCard && c !== filler1);
                if (card) neededForStraight.push(card);
            }
        }
        
        if (neededForStraight.length < 2) return null;
        const hand2 = neededForStraight.slice(0, 2);
        
        return { board, hand1, hand2 };
    },
    
    // ========== HIDDEN STRAIGHT SCENARIOS ==========
    
    // Gutshot straight - hidden connector
    function gutshotStraight() {
        const deck = shuffle(createDeck());
        
        // Board: A-K-J-7-2 style (gap in middle)
        // Hand fills the gap for straight
        const gapStart = 7 + Math.floor(Math.random() * 4); // 7-10 high for gap
        
        const board = [];
        const suits = shuffle([...SUITS]);
        
        // Add cards around gap: high, skip one, lower
        board.push(deck.find(c => c.value === gapStart + 3)); // e.g., Q
        board.push(deck.find(c => c.value === gapStart + 2)); // e.g., J
        // Skip gapStart + 1 (the gap)
        board.push(deck.find(c => c.value === gapStart));     // e.g., 9
        board.push(deck.find(c => c.value === gapStart - 1)); // e.g., 8
        
        // Add a random low card
        const remaining = removeCards(deck, board);
        const lowCard = remaining.find(c => c.value < gapStart - 2);
        if (!lowCard) return null;
        board.push(lowCard);
        
        // Check not flush
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: fills the gutshot
        const gutshotCard = finalRemaining.find(c => c.value === gapStart + 1);
        if (!gutshotCard) return null;
        const filler = finalRemaining.find(c => c !== gutshotCard && c.value < gapStart - 2);
        if (!filler) return null;
        const hand1 = [gutshotCard, filler];
        
        // Hand 2: pair or two pair (looks strong but loses)
        const boardRanks = board.map(c => c.rank);
        const pairMatch = finalRemaining.find(c => boardRanks.includes(c.rank) && c !== gutshotCard);
        if (!pairMatch) return null;
        const filler2 = finalRemaining.find(c => c !== gutshotCard && c !== pairMatch && c !== filler);
        const hand2 = [pairMatch, filler2];
        
        return { board, hand1, hand2 };
    },
    
    // Wheel straight (A-2-3-4-5) - Ace plays low
    function wheelStraight() {
        const deck = shuffle(createDeck());
        
        // Board: A-4-3-x-x or similar
        const board = [];
        board.push(deck.find(c => c.value === 14)); // Ace
        board.push(deck.find(c => c.value === 4));  // 4
        board.push(deck.find(c => c.value === 3));  // 3
        
        // Add 2 random high cards (not 2 or 5)
        const remaining = removeCards(deck, board);
        const highCards = remaining.filter(c => c.value >= 9 && c.value <= 13);
        shuffle(highCards);
        board.push(highCards[0], highCards[1]);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: 5-2 for wheel
        const five = finalRemaining.find(c => c.value === 5);
        const two = finalRemaining.find(c => c.value === 2);
        if (!five || !two) return null;
        const hand1 = [five, two];
        
        // Hand 2: pair of high card (looks better but wheel wins)
        const highBoardValues = board.filter(c => c.value >= 9).map(c => c.value);
        const pairCard = finalRemaining.find(c => highBoardValues.includes(c.value));
        if (!pairCard) return null;
        const filler = finalRemaining.find(c => c !== five && c !== two && c !== pairCard);
        const hand2 = [pairCard, filler];
        
        return { board, hand1, hand2 };
    },
    
    // Broadway hidden - T-J-Q-K-A with gaps filled by hand
    function broadwayHidden() {
        const deck = shuffle(createDeck());
        
        // Board has 3 broadway cards with gaps
        const broadwayValues = [14, 13, 12, 11, 10]; // A K Q J T
        shuffle(broadwayValues);
        const boardBroadway = broadwayValues.slice(0, 3);
        const handBroadway = broadwayValues.slice(3, 5);
        
        const board = [];
        for (const v of boardBroadway) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        // Add 2 low cards to board
        const remaining = removeCards(deck, board);
        const lowCards = remaining.filter(c => c.value <= 7);
        shuffle(lowCards);
        board.push(lowCards[0], lowCards[1]);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: completes broadway
        const hand1 = [];
        for (const v of handBroadway) {
            const card = finalRemaining.find(c => c.value === v && !hand1.includes(c));
            if (card) hand1.push(card);
        }
        if (hand1.length < 2) return null;
        
        // Hand 2: two pair using board cards
        const boardLowValues = board.filter(c => c.value <= 7).map(c => c.value);
        const pair1 = finalRemaining.find(c => boardLowValues.includes(c.value));
        const pair2 = finalRemaining.find(c => boardLowValues.includes(c.value) && c !== pair1 && c.value !== pair1?.value);
        
        if (!pair1) {
            const anyCard = finalRemaining.find(c => !hand1.includes(c));
            const anyCard2 = finalRemaining.find(c => !hand1.includes(c) && c !== anyCard);
            return { board, hand1, hand2: [anyCard, anyCard2] };
        }
        
        const filler = finalRemaining.find(c => c !== pair1 && c !== pair2 && !hand1.includes(c));
        const hand2 = [pair1, filler || pair2];
        
        return { board, hand1, hand2 };
    },
    
    // One-card straight - four to straight on board
    function oneCardStraight() {
        const deck = shuffle(createDeck());
        
        // Board: 4 consecutive cards
        const startVal = 5 + Math.floor(Math.random() * 6); // 5-10
        const board = [];
        
        for (let v = startVal; v < startVal + 4; v++) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        // Add one card that doesn't help straight
        const remaining = removeCards(deck, board);
        const nonHelper = remaining.find(c => c.value < startVal - 1 || c.value > startVal + 5);
        if (!nonHelper) return null;
        board.push(nonHelper);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: has the straight-completing card (either end)
        const topCard = finalRemaining.find(c => c.value === startVal + 4);
        const bottomCard = finalRemaining.find(c => c.value === startVal - 1);
        
        if (!topCard && !bottomCard) return null;
        const straightCard = topCard || bottomCard;
        const filler = finalRemaining.find(c => c !== straightCard);
        const hand1 = [straightCard, filler];
        
        // Hand 2: pair
        const boardValues = board.map(c => c.value);
        const pairCard = finalRemaining.find(c => boardValues.includes(c.value) && c !== straightCard && c !== filler);
        if (!pairCard) return null;
        const filler2 = finalRemaining.find(c => c !== straightCard && c !== filler && c !== pairCard);
        const hand2 = [pairCard, filler2];
        
        return { board, hand1, hand2 };
    },
    
    // Double belly buster - two gutshots possible
    function doubleBellyBuster() {
        const deck = shuffle(createDeck());
        
        // Board: cards like 3-5-7-9-K (two gaps that make straights)
        // Hand has 4-6 which fills 3-4-5-6-7 straight
        const board = [];
        board.push(deck.find(c => c.value === 3));
        board.push(deck.find(c => c.value === 5));
        board.push(deck.find(c => c.value === 7));
        
        const remaining = removeCards(deck, board);
        const highCards = remaining.filter(c => c.value >= 10);
        shuffle(highCards);
        board.push(highCards[0], highCards[1]);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: 4-6 makes the straight
        const four = finalRemaining.find(c => c.value === 4);
        const six = finalRemaining.find(c => c.value === 6);
        if (!four || !six) return null;
        const hand1 = [four, six];
        
        // Hand 2: pair of high card
        const highVal = board.filter(c => c.value >= 10).map(c => c.value)[0];
        const pairCard = finalRemaining.find(c => c.value === highVal);
        if (!pairCard) return null;
        const filler = finalRemaining.find(c => c !== four && c !== six && c !== pairCard);
        const hand2 = [pairCard, filler];
        
        return { board, hand1, hand2 };
    },
    
    // Inside straight beats two pair
    function insideStraightBeatsTwoPair() {
        const deck = shuffle(createDeck());
        
        // Board: J-9-8-4-4 (pair on board, inside straight possible)
        const startVal = 8 + Math.floor(Math.random() * 3); // 8-10
        const board = [];
        
        board.push(deck.find(c => c.value === startVal + 2)); // e.g., J
        board.push(deck.find(c => c.value === startVal));     // e.g., 9 (skip 10)
        board.push(deck.find(c => c.value === startVal - 1)); // e.g., 8
        
        // Add a pair
        const remaining = removeCards(deck, board);
        const pairRank = RANKS[Math.floor(Math.random() * 5)]; // Low pair
        const pairCards = remaining.filter(c => c.rank === pairRank).slice(0, 2);
        board.push(pairCards[0], pairCards[1]);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: fills inside straight
        const insideCard = finalRemaining.find(c => c.value === startVal + 1); // The 10
        const lowCard = finalRemaining.find(c => c.value === startVal - 2);    // The 7
        if (!insideCard || !lowCard) return null;
        const hand1 = [insideCard, lowCard];
        
        // Hand 2: makes two pair with board
        const highBoardVal = Math.max(...board.filter(c => c.rank !== pairRank).map(c => c.value));
        const pairMatch = finalRemaining.find(c => c.value === highBoardVal);
        if (!pairMatch) return null;
        const filler = finalRemaining.find(c => c !== insideCard && c !== lowCard && c !== pairMatch);
        const hand2 = [pairMatch, filler];
        
        return { board, hand1, hand2 };
    },
    
    // ========== MORE COMPLEX COMPARISONS ==========
    
    // Set over set - both hit trips with pocket pair
    function setOverSet() {
        const deck = shuffle(createDeck());
        const ranks = shuffle([...RANKS]);
        
        // Two different pocket pairs
        const highPairRank = ranks[0];
        const lowPairRank = ranks[1];
        const highVal = RANK_VALUES[highPairRank];
        const lowVal = RANK_VALUES[lowPairRank];
        
        // Make sure high is actually higher
        const [actualHigh, actualLow] = highVal > lowVal 
            ? [highPairRank, lowPairRank] 
            : [lowPairRank, highPairRank];
        
        const highPairCards = deck.filter(c => c.rank === actualHigh);
        const lowPairCards = deck.filter(c => c.rank === actualLow);
        
        // Board has one of each pair + 3 randoms
        const board = [highPairCards[0], lowPairCards[0]];
        const remaining = removeCards(deck, [...highPairCards, ...lowPairCards]);
        shuffle(remaining);
        
        // Add 3 random cards that don't pair either
        const fillers = remaining.filter(c => c.rank !== actualHigh && c.rank !== actualLow).slice(0, 3);
        board.push(...fillers);
        
        if (board.length < 5) return null;
        
        return {
            board,
            hand1: [highPairCards[1], highPairCards[2]], // Higher set
            hand2: [lowPairCards[1], lowPairCards[2]]    // Lower set
        };
    },
    
    // Straight over straight - different high cards
    function straightOverStraight() {
        const deck = shuffle(createDeck());
        
        // Board has 3 consecutive middle cards
        const midVal = 7 + Math.floor(Math.random() * 3); // 7-9
        const board = [];
        
        for (let v = midVal; v <= midVal + 2; v++) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        // Add 2 non-connecting cards
        const remaining = removeCards(deck, board);
        const nonConnectors = remaining.filter(c => 
            c.value < midVal - 2 || c.value > midVal + 4
        );
        shuffle(nonConnectors);
        board.push(nonConnectors[0], nonConnectors[1]);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: higher straight (top end)
        const topCard1 = finalRemaining.find(c => c.value === midVal + 3);
        const topCard2 = finalRemaining.find(c => c.value === midVal + 4);
        if (!topCard1 || !topCard2) return null;
        const hand1 = [topCard1, topCard2];
        
        // Hand 2: lower straight (bottom end)
        const bottomCard1 = finalRemaining.find(c => c.value === midVal - 1);
        const bottomCard2 = finalRemaining.find(c => c.value === midVal - 2);
        if (!bottomCard1 || !bottomCard2) return null;
        const hand2 = [bottomCard1, bottomCard2];
        
        return { board, hand1, hand2 };
    },
    
    // Nut flush vs second nut flush
    function nutFlushVsSecondNut() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        const suitedCards = sortByValue(deck.filter(c => c.suit === suit));
        
        if (suitedCards.length < 7) return null;
        
        // Board: 3 low-middle suited cards
        const board = [suitedCards[5], suitedCards[6], suitedCards[7] || suitedCards[8]];
        
        // Add 2 non-suited cards
        const nonSuited = deck.filter(c => c.suit !== suit);
        board.push(nonSuited[0], nonSuited[1]);
        
        // Hand 1: Ace of suit (nut flush)
        const aceOfSuit = suitedCards[0]; // Ace is highest
        const filler1 = nonSuited[2];
        const hand1 = [aceOfSuit, filler1];
        
        // Hand 2: King of suit (second nut)
        const kingOfSuit = suitedCards[1];
        const filler2 = nonSuited[3];
        const hand2 = [kingOfSuit, filler2];
        
        return { board, hand1, hand2 };
    },
    
    // Full house over full house - higher trips wins
    function fullHouseOverFullHouse() {
        const deck = shuffle(createDeck());
        
        // Board: two pairs
        const ranks = shuffle([...RANKS]).slice(0, 3);
        const pair1Cards = deck.filter(c => c.rank === ranks[0]).slice(0, 2);
        const pair2Cards = deck.filter(c => c.rank === ranks[1]).slice(0, 2);
        
        const board = [...pair1Cards, ...pair2Cards];
        const remaining = removeCards(deck, board);
        
        // Add one more card
        const filler = remaining.find(c => c.rank !== ranks[0] && c.rank !== ranks[1]);
        board.push(filler);
        
        const finalRemaining = removeCards(deck, board);
        
        // Determine which pair is higher
        const pair1Val = RANK_VALUES[ranks[0]];
        const pair2Val = RANK_VALUES[ranks[1]];
        const [highRank, lowRank] = pair1Val > pair2Val 
            ? [ranks[0], ranks[1]] 
            : [ranks[1], ranks[0]];
        
        // Hand 1: trips up the higher pair
        const thirdHigh = finalRemaining.find(c => c.rank === highRank);
        const filler1 = finalRemaining.find(c => c.rank !== highRank && c.rank !== lowRank);
        if (!thirdHigh) return null;
        const hand1 = [thirdHigh, filler1];
        
        // Hand 2: trips up the lower pair
        const thirdLow = finalRemaining.find(c => c.rank === lowRank);
        const filler2 = finalRemaining.find(c => c !== thirdHigh && c !== filler1 && c.rank !== lowRank);
        if (!thirdLow) return null;
        const hand2 = [thirdLow, filler2];
        
        return { board, hand1, hand2 };
    },
    
    // Counterfeit two pair
    function counterfeitTwoPair() {
        const deck = shuffle(createDeck());
        
        // Board starts with small pair, then gets bigger pair
        // Player with small two pair gets counterfeited
        const ranks = shuffle([...RANKS]);
        const lowPairRank = ranks.find(r => RANK_VALUES[r] <= 6);
        const midPairRank = ranks.find(r => RANK_VALUES[r] >= 8 && RANK_VALUES[r] <= 11);
        const highKickerRank = ranks.find(r => RANK_VALUES[r] >= 12);
        
        if (!lowPairRank || !midPairRank || !highKickerRank) return null;
        
        const lowPair = deck.filter(c => c.rank === lowPairRank).slice(0, 2);
        const midPair = deck.filter(c => c.rank === midPairRank).slice(0, 2);
        
        const board = [...lowPair, ...midPair];
        const remaining = removeCards(deck, board);
        
        // Add a high card
        const highCard = remaining.find(c => c.rank === highKickerRank);
        board.push(highCard);
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: higher kicker (plays board two pair + kicker)
        const bigKicker = sortByValue(finalRemaining.filter(c => 
            c.rank !== lowPairRank && c.rank !== midPairRank
        ))[0];
        const filler1 = finalRemaining.find(c => c !== bigKicker);
        const hand1 = [bigKicker, filler1];
        
        // Hand 2: had low pocket pair (counterfeited!)
        const thirdLow = finalRemaining.find(c => c.rank === lowPairRank);
        const smallKicker = finalRemaining.find(c => c !== thirdLow && c.value < bigKicker.value);
        if (!thirdLow || !smallKicker) return null;
        const hand2 = [thirdLow, smallKicker];
        
        return { board, hand1, hand2 };
    },
    
    // Hidden flush beats obvious two pair
    function hiddenFlushBeatsTwoPair() {
        const deck = shuffle(createDeck());
        const flushSuit = SUITS[Math.floor(Math.random() * 4)];
        
        // Board: pair + 2 flush cards + 1 other
        const pairRank = RANKS[Math.floor(Math.random() * 10) + 2];
        const pairCards = deck.filter(c => c.rank === pairRank).slice(0, 2);
        
        const board = [...pairCards];
        const remaining = removeCards(deck, board);
        
        // Add 2 suited cards (not the pair rank)
        const flushCards = remaining.filter(c => c.suit === flushSuit && c.rank !== pairRank);
        shuffle(flushCards);
        board.push(flushCards[0], flushCards[1]);
        
        // Add one non-flush card
        const nonFlush = remaining.find(c => c.suit !== flushSuit && c.rank !== pairRank && !board.includes(c));
        board.push(nonFlush);
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: flush (two more suited cards)
        const flushHand = finalRemaining.filter(c => c.suit === flushSuit).slice(0, 2);
        if (flushHand.length < 2) return null;
        const hand1 = flushHand;
        
        // Hand 2: obvious two pair (pairs with board)
        const boardRanks = board.filter(c => c.rank !== pairRank).map(c => c.rank);
        const pairMatch = finalRemaining.find(c => boardRanks.includes(c.rank) && c.suit !== flushSuit);
        if (!pairMatch) return null;
        const filler = finalRemaining.find(c => c !== pairMatch && !hand1.includes(c) && c.suit !== flushSuit);
        const hand2 = [pairMatch, filler];
        
        return { board, hand1, hand2 };
    },
    
    // Three-card board straight - both need two cards
    function threeCardBoardStraight() {
        const deck = shuffle(createDeck());
        
        // Board: 3 connected cards + 2 random
        const midVal = 6 + Math.floor(Math.random() * 5); // 6-10
        const board = [];
        
        for (let v = midVal; v <= midVal + 2; v++) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        const remaining = removeCards(deck, board);
        const randoms = remaining.filter(c => 
            c.value < midVal - 2 || c.value > midVal + 4
        ).slice(0, 2);
        board.push(...randoms);
        
        if (new Set(board.map(c => c.suit)).size === 1) return null;
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: completes straight from top
        const top1 = finalRemaining.find(c => c.value === midVal + 3);
        const top2 = finalRemaining.find(c => c.value === midVal + 4);
        if (!top1 || !top2) return null;
        const hand1 = [top1, top2];
        
        // Hand 2: pair (doesn't complete straight)
        const boardVal = board[0].value;
        const pairCard = finalRemaining.find(c => c.value === boardVal);
        if (!pairCard) return null;
        const filler = finalRemaining.find(c => c !== pairCard && !hand1.includes(c));
        const hand2 = [pairCard, filler];
        
        return { board, hand1, hand2 };
    },
    
    // Ace-high flush vs King-high flush
    function aceHighVsKingHighFlush() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        
        // Get all cards of the flush suit
        const suitedCards = sortByValue(deck.filter(c => c.suit === suit));
        const ace = suitedCards.find(c => c.value === 14);
        const king = suitedCards.find(c => c.value === 13);
        
        if (!ace || !king) return null;
        
        // Board: 3 medium flush cards
        const mediumFlush = suitedCards.filter(c => c.value >= 5 && c.value <= 10).slice(0, 3);
        const board = [...mediumFlush];
        
        // Add 2 non-suited cards
        const nonSuited = deck.filter(c => c.suit !== suit);
        board.push(nonSuited[0], nonSuited[1]);
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: Ace flush
        const filler1 = finalRemaining.find(c => c.suit !== suit);
        const hand1 = [ace, filler1];
        
        // Hand 2: King flush
        const filler2 = finalRemaining.find(c => c.suit !== suit && c !== filler1);
        const hand2 = [king, filler2];
        
        return { board, hand1, hand2 };
    },
    
    // Sneaky straight flush vs regular flush
    function sneakyStraightFlush() {
        const suit = SUITS[Math.floor(Math.random() * 4)];
        const deck = shuffle(createDeck());
        
        // Board: 3 suited cards that could make straight flush
        const startVal = 5 + Math.floor(Math.random() * 5); // 5-9
        const board = [];
        
        for (let v = startVal; v <= startVal + 2; v++) {
            const card = deck.find(c => c.value === v && c.suit === suit);
            if (card) board.push(card);
        }
        
        if (board.length < 3) return null;
        
        // Add 2 non-suited cards
        const remaining = removeCards(deck, board);
        const nonSuited = remaining.filter(c => c.suit !== suit).slice(0, 2);
        board.push(...nonSuited);
        
        const finalRemaining = removeCards(deck, board);
        
        // Hand 1: completes straight flush
        const sf1 = finalRemaining.find(c => c.value === startVal + 3 && c.suit === suit);
        const sf2 = finalRemaining.find(c => c.value === startVal + 4 && c.suit === suit);
        if (!sf1 || !sf2) return null;
        const hand1 = [sf1, sf2];
        
        // Hand 2: regular flush (high cards of suit)
        const highFlush = finalRemaining.filter(c => c.suit === suit && c.value > startVal + 4);
        if (highFlush.length < 2) return null;
        const hand2 = highFlush.slice(0, 2);
        
        return { board, hand1, hand2 };
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
    
    // Display cards in dealt order (random, like real poker)
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
