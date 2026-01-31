// Hand Strength Mode - Quiz how many hands beat your hand

// Game state
let hsBoard = [];
let hsHeroHand = [];
let hsCorrectCount = 0;
let hsTotalCombos = 0;
let hsOptions = [];
let hsStreak = 0;
let hsCorrectCount2 = 0;
let hsTotalCount = 0;
let hsGameEnded = false;

// DOM elements
let hsBoardEl, hsHeroHandEl, hsHeroDescEl, hsOptionsEl, hsResultEl, hsResultMessageEl;
let hsExplanationEl, nextHsBtn;
let hsStreakEl, hsCorrectEl, hsTotalEl;

// Initialize hand strength mode
function initHandStrengthMode() {
    hsBoardEl = document.getElementById('hs-board-cards');
    hsHeroHandEl = document.getElementById('hs-hero-cards');
    hsHeroDescEl = document.getElementById('hs-hero-desc');
    hsOptionsEl = document.getElementById('hs-options');
    hsResultEl = document.getElementById('hs-result');
    hsResultMessageEl = document.getElementById('hs-result-message');
    hsExplanationEl = document.getElementById('hs-explanation');
    nextHsBtn = document.getElementById('next-hs-btn');
    hsStreakEl = document.getElementById('hs-streak');
    hsCorrectEl = document.getElementById('hs-correct');
    hsTotalEl = document.getElementById('hs-total');
    
    nextHsBtn.addEventListener('click', newHandStrengthRound);
}

// Store beating hands for display
let hsBeatingHands = [];

// Count how many opponent hands beat hero's hand
function countBeatingHands(board, heroHand) {
    // Get remaining deck (exclude board and hero hand)
    const deck = createDeck();
    const usedCards = [...board, ...heroHand];
    const remaining = removeCards(deck, usedCards);
    
    // Evaluate hero's hand
    const heroEval = evaluateHand(board, heroHand);
    
    let beatsHero = 0;
    let tiesHero = 0;
    let losesToHero = 0;
    hsBeatingHands = [];
    
    // Check all possible opponent 2-card combinations
    for (let i = 0; i < remaining.length; i++) {
        for (let j = i + 1; j < remaining.length; j++) {
            const oppHand = [remaining[i], remaining[j]];
            const oppEval = evaluateHand(board, oppHand);
            
            const comparison = compareHands(oppEval, heroEval);
            if (comparison > 0) {
                beatsHero++;
                hsBeatingHands.push({
                    cards: oppHand,
                    eval: oppEval,
                    desc: getHandDescription(oppEval)
                });
            } else if (comparison === 0) {
                tiesHero++;
            } else {
                losesToHero++;
            }
        }
    }
    
    // Sort beating hands strongest to weakest
    hsBeatingHands.sort((a, b) => compareHands(b.eval, a.eval));
    
    return {
        beatsHero,
        tiesHero,
        losesToHero,
        total: beatsHero + tiesHero + losesToHero
    };
}

// Generate plausible wrong answers
function generateOptions(correctCount, totalCombos) {
    const options = [];
    const percentage = (correctCount / totalCombos) * 100;
    
    // Add correct answer
    options.push({
        count: correctCount,
        isCorrect: true
    });
    
    // Generate wrong answers
    // Strategy: create options that are spread out but plausible
    
    if (correctCount === 0) {
        // Hero has the nuts
        options.push({ count: 3, isCorrect: false });
        options.push({ count: 12, isCorrect: false });
        options.push({ count: 36, isCorrect: false });
    } else if (correctCount < 20) {
        // Very strong hand
        options.push({ count: 0, isCorrect: false });
        options.push({ count: Math.max(1, correctCount + randomInt(15, 40)), isCorrect: false });
        options.push({ count: Math.max(1, correctCount + randomInt(50, 120)), isCorrect: false });
    } else if (correctCount < 100) {
        // Strong hand
        options.push({ count: Math.max(0, correctCount - randomInt(20, 50)), isCorrect: false });
        options.push({ count: correctCount + randomInt(30, 80), isCorrect: false });
        options.push({ count: correctCount + randomInt(100, 200), isCorrect: false });
    } else if (correctCount < 300) {
        // Medium hand
        options.push({ count: Math.max(0, correctCount - randomInt(50, 120)), isCorrect: false });
        options.push({ count: correctCount + randomInt(50, 120), isCorrect: false });
        options.push({ count: Math.min(totalCombos, correctCount + randomInt(150, 300)), isCorrect: false });
    } else {
        // Weak hand
        options.push({ count: Math.max(0, correctCount - randomInt(100, 200)), isCorrect: false });
        options.push({ count: Math.max(0, correctCount - randomInt(200, 350)), isCorrect: false });
        options.push({ count: Math.min(totalCombos, correctCount + randomInt(80, 200)), isCorrect: false });
    }
    
    // Ensure no duplicates
    const seen = new Set();
    const uniqueOptions = [];
    for (const opt of options) {
        if (!seen.has(opt.count)) {
            seen.add(opt.count);
            uniqueOptions.push(opt);
        }
    }
    
    // If we lost options due to duplicates, add more
    while (uniqueOptions.length < 4) {
        const newCount = randomInt(0, totalCombos);
        if (!seen.has(newCount)) {
            seen.add(newCount);
            uniqueOptions.push({ count: newCount, isCorrect: false });
        }
    }
    
    // Shuffle options
    shuffle(uniqueOptions);
    
    return uniqueOptions;
}

// Random integer helper
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Scenario generators for interesting hands
const HS_SCENARIOS = [
    // Nut hands - 0 beat hero
    function generateNuts() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        
        // Royal flush
        const royalRanks = ['A', 'K', 'Q', 'J', 'T'];
        const board = [];
        for (let i = 0; i < 3; i++) {
            const card = deck.find(c => c.rank === royalRanks[i] && c.suit === suit);
            if (card) board.push(card);
        }
        
        const remaining = removeCards(deck, board);
        // Add 2 off-suit filler cards
        const fillers = remaining.filter(c => c.suit !== suit && !royalRanks.includes(c.rank)).slice(0, 2);
        board.push(...fillers);
        
        if (board.length < 5) return null;
        
        // Hero has the other 2 royal flush cards
        const heroHand = [];
        const remaining2 = removeCards(deck, board);
        for (let i = 3; i < 5; i++) {
            const card = remaining2.find(c => c.rank === royalRanks[i] && c.suit === suit);
            if (card) heroHand.push(card);
        }
        
        if (heroHand.length < 2) return null;
        return { board, heroHand };
    },
    
    // Very strong hand - few beat hero
    function generateVeryStrong() {
        const deck = shuffle(createDeck());
        
        // Four of a kind with high kicker
        const quadRank = RANKS[Math.floor(Math.random() * 10) + 3]; // 6 through A
        const quads = deck.filter(c => c.rank === quadRank);
        
        const board = quads.slice(0, 3);
        const remaining = removeCards(deck, board);
        
        // Add high kicker to board
        const kickers = remaining.filter(c => c.value > getValue(quadRank)).slice(0, 2);
        if (kickers.length < 2) {
            const lowKickers = remaining.filter(c => c.value < getValue(quadRank)).slice(0, 2);
            board.push(...lowKickers);
        } else {
            board.push(...kickers);
        }
        
        if (board.length < 5) return null;
        
        // Hero has the 4th quad card + high card
        const remaining2 = removeCards(deck, board);
        const heroQuad = remaining2.find(c => c.rank === quadRank);
        const heroKicker = remaining2.filter(c => c.rank !== quadRank).sort((a,b) => b.value - a.value)[0];
        
        if (!heroQuad || !heroKicker) return null;
        return { board, heroHand: [heroQuad, heroKicker] };
    },
    
    // Strong hand - some beat hero
    function generateStrong() {
        const deck = shuffle(createDeck());
        
        // Full house
        const tripsRank = RANKS[Math.floor(Math.random() * 8) + 5]; // 8 through A
        const pairRank = RANKS[Math.floor(Math.random() * 5) + 2]; // 5 through 9
        
        if (tripsRank === pairRank) return null;
        
        const trips = deck.filter(c => c.rank === tripsRank).slice(0, 2);
        const pair = deck.filter(c => c.rank === pairRank).slice(0, 2);
        
        const board = [...trips, ...pair];
        const remaining = removeCards(deck, board);
        
        // Add filler
        const filler = remaining.filter(c => c.rank !== tripsRank && c.rank !== pairRank)[0];
        board.push(filler);
        
        if (board.length < 5) return null;
        
        // Hero has the 3rd trips card + random
        const remaining2 = removeCards(deck, board);
        const heroTrip = remaining2.find(c => c.rank === tripsRank);
        const heroOther = remaining2.filter(c => c.rank !== tripsRank && c.rank !== pairRank)[0];
        
        if (!heroTrip || !heroOther) return null;
        return { board, heroHand: [heroTrip, heroOther] };
    },
    
    // Medium hand - flush
    function generateMedium() {
        const deck = shuffle(createDeck());
        const suit = SUITS[Math.floor(Math.random() * 4)];
        
        // 3 suited cards on board
        const suitedCards = deck.filter(c => c.suit === suit);
        const board = suitedCards.slice(0, 3);
        
        const remaining = removeCards(deck, board);
        // Add 2 off-suit cards
        const offSuit = remaining.filter(c => c.suit !== suit).slice(0, 2);
        board.push(...offSuit);
        
        if (board.length < 5) return null;
        
        // Hero has 2 suited cards (not the Ace)
        const remaining2 = removeCards(deck, board);
        const heroSuited = remaining2.filter(c => c.suit === suit && c.rank !== 'A').slice(0, 2);
        
        if (heroSuited.length < 2) return null;
        return { board, heroHand: heroSuited };
    },
    
    // Medium-weak hand - two pair
    function generateMediumWeak() {
        const deck = shuffle(createDeck());
        
        // Board has one pair, hero makes two pair
        const boardPairRank = RANKS[Math.floor(Math.random() * 7) + 4]; // 7 through K
        const heroPairRank = RANKS[Math.floor(Math.random() * 5) + 7]; // T through A
        
        if (boardPairRank === heroPairRank) return null;
        
        const boardPair = deck.filter(c => c.rank === boardPairRank).slice(0, 2);
        const remaining = removeCards(deck, boardPair);
        
        // Add 3 different rank cards to board
        const others = [];
        const usedRanks = new Set([boardPairRank, heroPairRank]);
        for (const card of remaining) {
            if (!usedRanks.has(card.rank) && others.length < 3) {
                others.push(card);
                usedRanks.add(card.rank);
            }
        }
        
        const board = [...boardPair, ...others];
        if (board.length < 5) return null;
        
        // Hero has a pocket pair
        const remaining2 = removeCards(deck, board);
        const heroPair = remaining2.filter(c => c.rank === heroPairRank).slice(0, 2);
        
        if (heroPair.length < 2) return null;
        return { board, heroHand: heroPair };
    },
    
    // Weak hand - one pair
    function generateWeak() {
        const deck = shuffle(createDeck());
        
        // Random board with no pairs
        const board = [];
        const usedRanks = new Set();
        const suits = shuffle([...SUITS]);
        
        while (board.length < 5 && usedRanks.size < 13) {
            const card = deck[board.length];
            if (!usedRanks.has(card.rank)) {
                board.push(card);
                usedRanks.add(card.rank);
            }
        }
        
        // Ensure no flush on board
        const suitCounts = {};
        board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
        if (Math.max(...Object.values(suitCounts)) >= 3) return null;
        
        if (board.length < 5) return null;
        
        // Hero has a low pair
        const remaining = removeCards(deck, board);
        const lowRanks = RANKS.slice(0, 6); // 2-7
        shuffle(lowRanks);
        
        for (const rank of lowRanks) {
            if (!usedRanks.has(rank)) {
                const pair = remaining.filter(c => c.rank === rank).slice(0, 2);
                if (pair.length === 2) {
                    return { board, heroHand: pair };
                }
            }
        }
        
        return null;
    },
    
    // Top pair scenario
    function generateTopPair() {
        const deck = shuffle(createDeck());
        
        // Board with one high card
        const highRank = RANKS[Math.floor(Math.random() * 4) + 9]; // J through A
        const highCard = deck.find(c => c.rank === highRank);
        
        const board = [highCard];
        let remaining = removeCards(deck, board);
        
        // Add 4 more different rank lower cards
        const usedRanks = new Set([highRank]);
        while (board.length < 5) {
            for (const card of remaining) {
                if (!usedRanks.has(card.rank) && getValue(card.rank) < getValue(highRank)) {
                    board.push(card);
                    usedRanks.add(card.rank);
                    remaining = removeCards(remaining, [card]);
                    break;
                }
            }
            if (board.length < 5 && remaining.length === 0) break;
        }
        
        // No flush possible
        const suitCounts = {};
        board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
        if (Math.max(...Object.values(suitCounts)) >= 3) return null;
        
        if (board.length < 5) return null;
        
        // Hero has top pair
        remaining = removeCards(deck, board);
        const heroHighCard = remaining.find(c => c.rank === highRank);
        const heroKicker = remaining.filter(c => c.rank !== highRank && !usedRanks.has(c.rank))[0];
        
        if (!heroHighCard || !heroKicker) return null;
        return { board, heroHand: [heroHighCard, heroKicker] };
    },
    
    // Straight scenario
    function generateStraight() {
        const deck = shuffle(createDeck());
        const startVal = 5 + Math.floor(Math.random() * 5); // 5-9
        
        // Board has 3 connected cards
        const board = [];
        const boardValues = shuffle([startVal, startVal + 1, startVal + 2]).slice(0, 3);
        
        for (const v of boardValues) {
            const card = deck.find(c => c.value === v);
            if (card) board.push(card);
        }
        
        let remaining = removeCards(deck, board);
        
        // Add 2 non-connecting, non-flush cards
        const fillers = remaining.filter(c => 
            c.value < startVal - 1 || c.value > startVal + 4
        ).slice(0, 2);
        board.push(...fillers);
        
        // Ensure no flush
        const suitCounts = {};
        board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
        if (Math.max(...Object.values(suitCounts)) >= 3) return null;
        
        if (board.length < 5) return null;
        
        // Hero has the cards to complete straight
        remaining = removeCards(deck, board);
        const neededValues = [startVal, startVal + 1, startVal + 2, startVal + 3, startVal + 4]
            .filter(v => !boardValues.includes(v));
        
        const heroHand = [];
        for (const v of neededValues) {
            const card = remaining.find(c => c.value === v);
            if (card) {
                heroHand.push(card);
                remaining = removeCards(remaining, [card]);
            }
            if (heroHand.length >= 2) break;
        }
        
        if (heroHand.length < 2) return null;
        return { board, heroHand };
    }
];

// Helper to get numeric value from rank
function getValue(rank) {
    const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return rankValues[rank];
}

// Generate a scenario
function generateHsScenario() {
    // Try template generators first (70% of time)
    if (Math.random() < 0.7) {
        const generators = shuffle([...HS_SCENARIOS]);
        for (const gen of generators) {
            try {
                const result = gen();
                if (result && result.board && result.board.length === 5 && 
                    result.heroHand && result.heroHand.length === 2) {
                    return result;
                }
            } catch (e) {
                // Generator failed, try next
            }
        }
    }
    
    // Fallback: random deal
    const deck = shuffle(createDeck());
    const board = deck.slice(0, 5);
    const heroHand = deck.slice(5, 7);
    return { board, heroHand };
}

// Start new round
function newHandStrengthRound() {
    hsGameEnded = false;
    hsResultEl.classList.add('hidden');
    hsExplanationEl.innerHTML = '';
    
    // Reset option buttons
    const buttons = hsOptionsEl.querySelectorAll('.hs-option');
    buttons.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong');
        btn.disabled = false;
    });
    
    // Generate scenario
    const scenario = generateHsScenario();
    hsBoard = scenario.board;
    hsHeroHand = scenario.heroHand;
    
    // Count beating hands
    const result = countBeatingHands(hsBoard, hsHeroHand);
    hsCorrectCount = result.beatsHero;
    hsTotalCombos = result.total;
    
    // Generate options
    hsOptions = generateOptions(hsCorrectCount, hsTotalCombos);
    
    // Render
    renderHsBoard();
    renderHsHeroHand();
    renderHsOptions();
}

// Render board
function renderHsBoard() {
    hsBoardEl.innerHTML = '';
    for (const card of hsBoard) {
        hsBoardEl.appendChild(createCardElement(card));
    }
}

// Render hero hand
function renderHsHeroHand() {
    hsHeroHandEl.innerHTML = '';
    for (const card of hsHeroHand) {
        hsHeroHandEl.appendChild(createCardElement(card));
    }
    
    // Show hand description
    const heroEval = evaluateHand(hsBoard, hsHeroHand);
    hsHeroDescEl.textContent = getHandDescription(heroEval);
}

// Render options
function renderHsOptions() {
    hsOptionsEl.innerHTML = '';
    
    for (const opt of hsOptions) {
        const btn = document.createElement('button');
        btn.className = 'hs-option';
        btn.dataset.count = opt.count;
        btn.dataset.correct = opt.isCorrect;
        
        const pct = ((opt.count / hsTotalCombos) * 100).toFixed(1);
        btn.innerHTML = `<span class="hs-count">${opt.count}</span><span class="hs-pct">(${pct}%)</span>`;
        
        btn.addEventListener('click', () => selectHsOption(opt, btn));
        hsOptionsEl.appendChild(btn);
    }
}

// Handle option selection
function selectHsOption(option, element) {
    if (hsGameEnded) return;
    
    hsGameEnded = true;
    hsTotalCount++;
    
    // Disable all buttons
    const buttons = hsOptionsEl.querySelectorAll('.hs-option');
    buttons.forEach(btn => btn.disabled = true);
    
    // Mark selection
    element.classList.add('selected');
    
    // Show correct answer
    buttons.forEach(btn => {
        if (btn.dataset.correct === 'true') {
            btn.classList.add('correct');
        }
    });
    
    if (option.isCorrect) {
        hsCorrectCount2++;
        hsStreak++;
        hsResultMessageEl.textContent = '✓ Correct!';
        hsResultEl.className = 'result perfect';
    } else {
        hsStreak = 0;
        element.classList.add('wrong');
        hsResultMessageEl.textContent = `✗ ${hsCorrectCount} hands beat you`;
        hsResultEl.className = 'result failed';
    }
    
    // Show explanation with list of beating hands
    const pct = ((hsCorrectCount / hsTotalCombos) * 100).toFixed(1);
    let explanationHtml = `
        <div class="hs-explanation-text">
            Out of <strong>${hsTotalCombos}</strong> possible opponent hands,<br>
            <strong>${hsCorrectCount}</strong> (${pct}%) beat your hand.
        </div>
    `;
    
    // Show the beating hands list (strongest to weakest)
    if (hsBeatingHands.length > 0) {
        explanationHtml += '<div class="hs-beating-list">';
        explanationHtml += '<div class="hs-beating-header">Hands that beat you (strongest → weakest):</div>';
        
        // Group by hand description to show counts
        const grouped = {};
        for (const h of hsBeatingHands) {
            if (!grouped[h.desc]) {
                grouped[h.desc] = [];
            }
            grouped[h.desc].push(h);
        }
        
        // Display each group
        for (const desc of Object.keys(grouped)) {
            const hands = grouped[desc];
            explanationHtml += `<div class="hs-beating-group">`;
            explanationHtml += `<div class="hs-beating-desc">${desc} <span class="hs-beating-count">(${hands.length} combo${hands.length > 1 ? 's' : ''})</span></div>`;
            explanationHtml += `<div class="hs-beating-combos">`;
            
            // Show up to 8 combos per group, then indicate more
            const showMax = 8;
            for (let i = 0; i < Math.min(hands.length, showMax); i++) {
                const h = hands[i];
                const c1 = h.cards[0];
                const c2 = h.cards[1];
                const color1 = (c1.suit === 'hearts' || c1.suit === 'diamonds') ? 'red' : 'black';
                const color2 = (c2.suit === 'hearts' || c2.suit === 'diamonds') ? 'red' : 'black';
                explanationHtml += `<span class="hs-combo"><span class="${color1}">${c1.display}${c1.symbol}</span><span class="${color2}">${c2.display}${c2.symbol}</span></span>`;
            }
            if (hands.length > showMax) {
                explanationHtml += `<span class="hs-combo-more">+${hands.length - showMax} more</span>`;
            }
            explanationHtml += `</div></div>`;
        }
        
        explanationHtml += '</div>';
    } else {
        explanationHtml += '<div class="hs-no-beats">🎉 You have the nuts! No hand beats you.</div>';
    }
    
    hsExplanationEl.innerHTML = explanationHtml;
    
    // Update stats
    updateHsStats();
    hsResultEl.classList.remove('hidden');
}

// Update stats display
function updateHsStats() {
    hsStreakEl.textContent = hsStreak;
    hsCorrectEl.textContent = hsCorrectCount2;
    hsTotalEl.textContent = hsTotalCount;
}
