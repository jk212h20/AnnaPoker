// Dynamic scenario generation with board interestingness scoring
// Generates random boards, scores them for "interestingness", and filters based on tiered acceptance

// ============================================
// BOARD INTERESTINGNESS SCORING
// ============================================

/**
 * Score a board's interestingness based on:
 * - Flush potential (suited cards)
 * - Straight potential (connected cards)
 * - Paired/trips potential
 * 
 * Returns a score roughly in range 0-15
 */
function scoreBoardInterestingness(board) {
    let score = 0;
    
    // --- Flush potential: count max cards of same suit ---
    const suitCounts = {};
    board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
    const maxSuit = Math.max(...Object.values(suitCounts));
    // 2 suited = 2pts, 3 suited = 4pts, 4 suited = 6pts, 5 suited = 8pts
    score += (maxSuit - 1) * 2;
    
    // --- Straight potential: max cards within a 5-rank window ---
    const values = board.map(c => c.value);
    // Handle Ace-low (wheel) potential - add value 1 for Ace
    const extendedValues = [...values];
    if (values.includes(14)) {
        extendedValues.push(1); // Ace can be low
    }
    const uniqueValues = [...new Set(extendedValues)].sort((a, b) => a - b);
    
    let maxConnected = 1;
    for (let i = 0; i < uniqueValues.length; i++) {
        // Count cards within 5-rank window starting at this value
        const windowStart = uniqueValues[i];
        const windowEnd = windowStart + 4;
        const inWindow = uniqueValues.filter(v => v >= windowStart && v <= windowEnd).length;
        maxConnected = Math.max(maxConnected, inWindow);
    }
    // 2 connected = 2pts, 3 connected = 4pts, 4 connected = 6pts, 5 connected = 8pts
    score += (maxConnected - 1) * 2;
    
    // --- Paired board ---
    const rankCounts = {};
    board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
    const maxRank = Math.max(...Object.values(rankCounts));
    if (maxRank === 2) score += 3;       // One pair on board
    else if (maxRank === 3) score += 5;  // Trips on board
    else if (maxRank === 4) score += 6;  // Quads on board (rare but possible)
    
    // --- Double paired board bonus ---
    const pairCount = Object.values(rankCounts).filter(c => c >= 2).length;
    if (pairCount >= 2) score += 2; // Two pair on board = extra 2 pts
    
    return score;
}

// ============================================
// BOARD GENERATION
// ============================================

/**
 * Deal a random 5-card board from a shuffled deck
 * Returns { board, deck } so deck can be reused for hands
 */
function dealRandomBoard() {
    const deck = shuffle(createDeck());
    const board = deck.slice(0, 5);
    const remaining = deck.slice(5);
    return { board, remaining };
}

/**
 * Generate a scenario with tiered acceptance:
 * - 15% of the time: accept any board (minScore = 0)
 * - 50% of the time: accept if somewhat interesting (minScore = 3)
 * - 35% of the time: require high interestingness (minScore = 6)
 * 
 * Returns { board: [...], hands: [[...], [...], [...], [...]] }
 */
function generateScenario() {
    const roll = Math.random();
    let minScore;
    
    if (roll < 0.15) {
        minScore = 0;  // 15%: accept anything
    } else if (roll < 0.65) {
        minScore = 3;  // 50%: some interestingness
    } else {
        minScore = 6;  // 35%: high interestingness
    }
    
    // Generate board meeting the threshold
    let board, remaining;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        const result = dealRandomBoard();
        board = result.board;
        remaining = result.remaining;
        attempts++;
    } while (scoreBoardInterestingness(board) < minScore && attempts < maxAttempts);
    
    // Defensive check - ensure we have valid data
    if (!board || board.length !== 5 || !remaining || remaining.length < 8) {
        // Fallback: just deal a fresh random scenario
        const deck = shuffle(createDeck());
        board = deck.slice(0, 5);
        remaining = deck.slice(5);
    }
    
    // Deal 4 random hands from remaining deck
    shuffle(remaining);
    
    const hands = [
        [remaining[0], remaining[1]],
        [remaining[2], remaining[3]],
        [remaining[4], remaining[5]],
        [remaining[6], remaining[7]]
    ];
    
    return { board, hands };
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get a random scenario (board + 4 hands)
 * This is the main function used by other modules
 */
function getRandomTemplate() {
    return generateScenario();
}

/**
 * Whether to use template-based generation vs pure random
 * Returns true ~45% of the time for template usage
 */
function shouldUseTemplate() {
    return Math.random() < 0.45;
}
