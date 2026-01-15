// Poker hand evaluation for Texas Hold'em
// Evaluates best 5-card hand from 7 cards (5 board + 2 hole cards)

const HAND_RANKS = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

const HAND_NAMES = {
    1: 'High Card',
    2: 'Pair',
    3: 'Two Pair',
    4: 'Three of a Kind',
    5: 'Straight',
    6: 'Flush',
    7: 'Full House',
    8: 'Four of a Kind',
    9: 'Straight Flush',
    10: 'Royal Flush'
};

// Get all 5-card combinations from 7 cards
function getCombinations(cards, k) {
    const result = [];
    
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        for (let i = start; i < cards.length; i++) {
            combo.push(cards[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return result;
}

// Check if cards form a flush (5 of same suit)
function isFlush(cards) {
    const suits = {};
    for (const card of cards) {
        suits[card.suit] = (suits[card.suit] || 0) + 1;
    }
    return Object.values(suits).some(count => count >= 5);
}

// Get flush cards if flush exists
function getFlushCards(cards) {
    const suits = {};
    for (const card of cards) {
        if (!suits[card.suit]) suits[card.suit] = [];
        suits[card.suit].push(card);
    }
    for (const suit in suits) {
        if (suits[suit].length >= 5) {
            return sortByValue(suits[suit]).slice(0, 5);
        }
    }
    return null;
}

// Check if 5 cards form a straight, returns high card value or 0
function getStraightHigh(cards) {
    const values = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
    
    // Check for A-2-3-4-5 (wheel)
    if (values.includes(14) && values.includes(2) && values.includes(3) && 
        values.includes(4) && values.includes(5)) {
        return 5; // 5-high straight
    }
    
    // Check for regular straights
    for (let i = 0; i <= values.length - 5; i++) {
        if (values[i] - values[i + 4] === 4) {
            return values[i];
        }
    }
    
    return 0;
}

// Get straight cards if straight exists
function getStraightCards(cards) {
    const sorted = sortByValue(cards);
    const values = [...new Set(sorted.map(c => c.value))];
    
    // Check for wheel (A-2-3-4-5)
    if (values.includes(14) && values.includes(2) && values.includes(3) && 
        values.includes(4) && values.includes(5)) {
        const straightCards = [];
        for (const v of [5, 4, 3, 2, 14]) {
            straightCards.push(sorted.find(c => c.value === v));
        }
        return straightCards;
    }
    
    // Regular straight
    for (let high = 14; high >= 5; high--) {
        const straightCards = [];
        for (let v = high; v > high - 5; v--) {
            const card = sorted.find(c => c.value === v);
            if (card) straightCards.push(card);
        }
        if (straightCards.length === 5) {
            return straightCards;
        }
    }
    
    return null;
}

// Check for straight flush
function getStraightFlush(cards) {
    const suits = {};
    for (const card of cards) {
        if (!suits[card.suit]) suits[card.suit] = [];
        suits[card.suit].push(card);
    }
    
    for (const suit in suits) {
        if (suits[suit].length >= 5) {
            const straightCards = getStraightCards(suits[suit]);
            if (straightCards) {
                return straightCards;
            }
        }
    }
    return null;
}

// Count cards by rank
function getRankCounts(cards) {
    const counts = {};
    for (const card of cards) {
        counts[card.value] = (counts[card.value] || 0) + 1;
    }
    return counts;
}

// Evaluate a 5-card hand
function evaluate5Cards(cards) {
    const sorted = sortByValue(cards);
    const counts = getRankCounts(cards);
    const countValues = Object.entries(counts)
        .map(([val, count]) => ({ value: parseInt(val), count }))
        .sort((a, b) => b.count - a.count || b.value - a.value);
    
    const isFlushHand = new Set(cards.map(c => c.suit)).size === 1;
    const straightHigh = getStraightHigh(cards);
    const isStraight = straightHigh > 0;
    
    // Royal Flush
    if (isFlushHand && isStraight && straightHigh === 14) {
        return {
            rank: HAND_RANKS.ROYAL_FLUSH,
            name: 'Royal Flush',
            values: [14],
            cards: sorted
        };
    }
    
    // Straight Flush
    if (isFlushHand && isStraight) {
        return {
            rank: HAND_RANKS.STRAIGHT_FLUSH,
            name: straightHigh === 5 ? 'Steel Wheel' : `Straight Flush (${straightHigh}-high)`,
            values: [straightHigh],
            cards: sorted
        };
    }
    
    // Four of a Kind
    if (countValues[0].count === 4) {
        const quadValue = countValues[0].value;
        const kicker = countValues[1].value;
        return {
            rank: HAND_RANKS.FOUR_OF_A_KIND,
            name: `Four ${RANK_DISPLAY[Object.keys(RANK_VALUES).find(k => RANK_VALUES[k] === quadValue)]}s`,
            values: [quadValue, kicker],
            cards: sorted
        };
    }
    
    // Full House
    if (countValues[0].count === 3 && countValues[1].count === 2) {
        return {
            rank: HAND_RANKS.FULL_HOUSE,
            name: `Full House`,
            values: [countValues[0].value, countValues[1].value],
            cards: sorted
        };
    }
    
    // Flush
    if (isFlushHand) {
        return {
            rank: HAND_RANKS.FLUSH,
            name: `Flush`,
            values: sorted.map(c => c.value),
            cards: sorted
        };
    }
    
    // Straight
    if (isStraight) {
        return {
            rank: HAND_RANKS.STRAIGHT,
            name: straightHigh === 5 ? 'Wheel' : `Straight (${straightHigh}-high)`,
            values: [straightHigh],
            cards: sorted
        };
    }
    
    // Three of a Kind
    if (countValues[0].count === 3) {
        return {
            rank: HAND_RANKS.THREE_OF_A_KIND,
            name: `Three of a Kind`,
            values: [countValues[0].value, countValues[1].value, countValues[2].value],
            cards: sorted
        };
    }
    
    // Two Pair
    if (countValues[0].count === 2 && countValues[1].count === 2) {
        const highPair = Math.max(countValues[0].value, countValues[1].value);
        const lowPair = Math.min(countValues[0].value, countValues[1].value);
        const kicker = countValues[2].value;
        return {
            rank: HAND_RANKS.TWO_PAIR,
            name: `Two Pair`,
            values: [highPair, lowPair, kicker],
            cards: sorted
        };
    }
    
    // Pair
    if (countValues[0].count === 2) {
        return {
            rank: HAND_RANKS.PAIR,
            name: `Pair`,
            values: [countValues[0].value, countValues[1].value, countValues[2].value, countValues[3].value],
            cards: sorted
        };
    }
    
    // High Card
    return {
        rank: HAND_RANKS.HIGH_CARD,
        name: `High Card`,
        values: sorted.map(c => c.value),
        cards: sorted
    };
}

// Evaluate best hand from 7 cards (board + hole cards)
function evaluateHand(board, holeCards) {
    const allCards = [...board, ...holeCards];
    const combinations = getCombinations(allCards, 5);
    
    let bestHand = null;
    
    for (const combo of combinations) {
        const hand = evaluate5Cards(combo);
        if (!bestHand || compareHands(hand, bestHand) > 0) {
            bestHand = hand;
        }
    }
    
    return bestHand;
}

// Compare two hands: returns positive if hand1 > hand2, negative if hand1 < hand2, 0 if equal
function compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
        return hand1.rank - hand2.rank;
    }
    
    // Same rank, compare values
    for (let i = 0; i < Math.min(hand1.values.length, hand2.values.length); i++) {
        if (hand1.values[i] !== hand2.values[i]) {
            return hand1.values[i] - hand2.values[i];
        }
    }
    
    return 0;
}

// Rank multiple hands from strongest to weakest
// Returns array of { holeCards, hand, rank } sorted by strength
function rankHands(board, handsArray) {
    const evaluated = handsArray.map((holeCards, index) => ({
        index,
        holeCards,
        hand: evaluateHand(board, holeCards)
    }));
    
    // Sort by hand strength (strongest first)
    evaluated.sort((a, b) => compareHands(b.hand, a.hand));
    
    // Assign rankings (handling ties)
    let currentRank = 1;
    for (let i = 0; i < evaluated.length; i++) {
        if (i > 0 && compareHands(evaluated[i].hand, evaluated[i-1].hand) !== 0) {
            currentRank = i + 1;
        }
        evaluated[i].rank = currentRank;
    }
    
    return evaluated;
}

// Get a readable description of the hand
function getHandDescription(hand) {
    const rankName = HAND_NAMES[hand.rank];
    
    switch (hand.rank) {
        case HAND_RANKS.ROYAL_FLUSH:
            return 'Royal Flush';
        case HAND_RANKS.STRAIGHT_FLUSH:
            return `${getRankName(hand.values[0])}-high Straight Flush`;
        case HAND_RANKS.FOUR_OF_A_KIND:
            return `Quad ${getRankName(hand.values[0])}s`;
        case HAND_RANKS.FULL_HOUSE:
            return `${getRankName(hand.values[0])}s full of ${getRankName(hand.values[1])}s`;
        case HAND_RANKS.FLUSH:
            return `${getRankName(hand.values[0])}-high Flush`;
        case HAND_RANKS.STRAIGHT:
            return `${getRankName(hand.values[0])}-high Straight`;
        case HAND_RANKS.THREE_OF_A_KIND:
            return `Trip ${getRankName(hand.values[0])}s`;
        case HAND_RANKS.TWO_PAIR:
            return `${getRankName(hand.values[0])}s and ${getRankName(hand.values[1])}s`;
        case HAND_RANKS.PAIR:
            return `Pair of ${getRankName(hand.values[0])}s`;
        case HAND_RANKS.HIGH_CARD:
            return `${getRankName(hand.values[0])} High`;
        default:
            return rankName;
    }
}

function getRankName(value) {
    const names = {
        14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten',
        9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five',
        4: 'Four', 3: 'Three', 2: 'Two'
    };
    return names[value] || value;
}
