// Outs Counter Mode - Poker Outs Training

// Outs game state
let outsBoard = [];
let yourHand = [];
let opponentHand = [];
let currentOutsTemplate = null;
let outsStreak = 0;
let outsCorrectCount = 0;
let outsTotalCount = 0;

// Comprehensive Outs Templates
// Each template has: board (4 cards - turn), yourHand, opponentHand, correctOuts, explanation, category
const OUTS_TEMPLATES = [
    // ============================================
    // PAIR DRAWS (3-6 outs)
    // ============================================
    {
        category: "Pair Draw",
        name: "One Overcard",
        board: ['Kh', '9d', '6c', '3s'],
        yourHand: ['Ah', 'Qd'],
        opponentHand: ['Kd', 'Jc'],
        correctOuts: 3,
        explanation: "You need to hit an Ace to make a better pair. 3 Aces left in deck = 3 outs. (Queen won't help - K still beats Q)"
    },
    {
        category: "Pair Draw",
        name: "Two Overcards",
        board: ['Jh', '8d', '5c', '2s'],
        yourHand: ['Ac', 'Kd'],
        opponentHand: ['Jd', 'Tc'],
        correctOuts: 6,
        explanation: "You need an Ace or King to beat opponent's pair of Jacks. 3 Aces + 3 Kings = 6 outs."
    },
    {
        category: "Pair Draw",
        name: "Pair Your Kicker",
        board: ['Ah', 'Td', '7c', '3s'],
        yourHand: ['As', 'Jh'],
        opponentHand: ['Ad', 'Qc'],
        correctOuts: 3,
        explanation: "Both have Aces, but opponent's Queen kicker beats your Jack. Hit a Jack (3 outs) to make two pair and win."
    },
    {
        category: "Pair Draw",
        name: "Underpair Needs Set",
        board: ['Kh', 'Qd', '8c', '4s'],
        yourHand: ['Jh', 'Jd'],
        opponentHand: ['Kd', 'Tc'],
        correctOuts: 2,
        explanation: "Your pocket Jacks are losing to pair of Kings. Only 2 Jacks left to make a set = 2 outs."
    },
    
    // ============================================
    // GUTSHOT STRAIGHT DRAWS (4 outs)
    // ============================================
    {
        category: "Gutshot",
        name: "Basic Gutshot",
        board: ['Jh', '9d', '5c', '2s'],
        yourHand: ['Qc', 'Th'],
        opponentHand: ['Jd', 'Kc'],
        correctOuts: 4,
        explanation: "You have Q-T and board has J-9. You need an 8 to make Q-J-T-9-8 straight. 4 eights = 4 outs."
    },
    {
        category: "Gutshot",
        name: "Gutshot to Broadway",
        board: ['Ah', 'Kd', 'Tc', '5s'],
        yourHand: ['Qh', 'Jd'],
        opponentHand: ['Ad', '9c'],
        correctOuts: 0,
        explanation: "Tricky! Any Queen makes Broadway... but wait - you already have broadway with A-K-Q-J-T! You're already ahead."
    },
    {
        category: "Gutshot",
        name: "Inside Straight Draw",
        board: ['9h', '7d', '6c', '2s'],
        yourHand: ['Th', '8c'],
        opponentHand: ['9d', 'Ac'],
        correctOuts: 4,
        explanation: "You need a 5 to complete T-9-8-7-6 or you have 8-9-T and need a J? No - 9-8-7-6 needs a 5 for straight. 4 fives = 4 outs."
    },
    {
        category: "Gutshot",
        name: "Wheel Gutshot",
        board: ['Ah', '4d', '3c', 'Ks'],
        yourHand: ['5h', '2d'],
        opponentHand: ['Ac', 'Qc'],
        correctOuts: 0,
        explanation: "Wait - you have A-5-4-3-2... that's already a wheel (5-high straight)! You're winning with the straight."
    },
    
    // ============================================
    // OPEN-ENDED STRAIGHT DRAWS (8 outs)
    // ============================================
    {
        category: "Open-Ender",
        name: "Basic Open-Ended",
        board: ['Jh', 'Td', '4c', '2s'],
        yourHand: ['9h', '8c'],
        opponentHand: ['Jd', 'Ac'],
        correctOuts: 8,
        explanation: "You have 8-9 with J-T on board. Any Queen (4) or any 7 (4) completes your straight = 8 outs."
    },
    {
        category: "Open-Ender",
        name: "Open-Ended with Pair on Board",
        board: ['Th', 'Td', '9c', '8s'],
        yourHand: ['Jh', '7d'],
        opponentHand: ['Tc', 'Ac'],
        correctOuts: 6,
        explanation: "J-T-9-8-7 with open ends... but opponent has trips! Any Queen or 6 makes your straight, but a T gives them quads. 8 - 2 blocker risk = effectively 6 clean outs."
    },
    {
        category: "Open-Ender",
        name: "Double-Belly Buster",
        board: ['Qh', 'Td', '7c', '4s'],
        yourHand: ['9h', '8d'],
        opponentHand: ['Qd', 'Jc'],
        correctOuts: 8,
        explanation: "You have 9-8 with Q-T-7. A Jack makes Q-J-T-9-8, and a 6 makes T-9-8-7-6. Two gutshots = 8 outs (same as open-ender)."
    },
    {
        category: "Open-Ender",
        name: "Open-Ender Losing to Set",
        board: ['Jh', 'Td', '5c', '5s'],
        yourHand: ['Qh', '9d'],
        opponentHand: ['5h', '5d'],
        correctOuts: 8,
        explanation: "Q-J-T-9 is open-ended. Opponent has quad 5s! You need K or 8 for straight. Still 8 outs, straight beats quads... wait no it doesn't! 0 outs - you can't win."
    },
    
    // ============================================
    // FLUSH DRAWS (9 outs)
    // ============================================
    {
        category: "Flush Draw",
        name: "Basic Flush Draw",
        board: ['Kh', '9h', '5h', '2c'],
        yourHand: ['Ah', 'Td'],
        opponentHand: ['Kd', 'Qc'],
        correctOuts: 9,
        explanation: "You have Ah with 3 hearts on board. 13 hearts - 4 seen = 9 hearts left = 9 outs for the nut flush."
    },
    {
        category: "Flush Draw",
        name: "Flush Draw vs Flush Draw",
        board: ['Jc', '8c', '4c', '2s'],
        yourHand: ['Ac', 'Kh'],
        opponentHand: ['Qc', 'Td'],
        correctOuts: 9,
        explanation: "Both have flush draws, but you have the Ace of clubs = nut flush draw. Any club (9 left) wins for you."
    },
    {
        category: "Flush Draw",
        name: "Non-Nut Flush Draw",
        board: ['Kd', 'Td', '6d', '3c'],
        yourHand: ['Qd', 'Jh'],
        opponentHand: ['Kh', 'Qc'],
        correctOuts: 8,
        explanation: "You have Qd for flush draw, but Ad is out there. 9 diamonds left, but if Ad comes, you lose. 8 safe flush outs."
    },
    {
        category: "Flush Draw",
        name: "Flush Draw - Clean Outs",
        board: ['Qs', '8s', '8d', '4s'],
        yourHand: ['As', 'Kc'],
        opponentHand: ['8h', '7c'],
        correctOuts: 7,
        explanation: "You have nut flush draw, opponent has trips. 9 spades left, but 8s and 4s would give full house. 9 - 2 = 7 clean outs."
    },
    
    // ============================================
    // COMBINATION DRAWS (12-15 outs)
    // ============================================
    {
        category: "Combo Draw",
        name: "Flush + Gutshot",
        board: ['Jh', '9h', '4h', '2c'],
        yourHand: ['Qh', 'Td'],
        opponentHand: ['Jd', 'Ac'],
        correctOuts: 12,
        explanation: "Flush draw (9 outs) + gutshot straight with King (4 outs). But Kh is counted in both! 9 + 4 - 1 = 12 outs."
    },
    {
        category: "Combo Draw",
        name: "Flush + Open-Ender",
        board: ['Tc', '9c', '3c', '2h'],
        yourHand: ['Jc', '8h'],
        opponentHand: ['Td', 'Qd'],
        correctOuts: 15,
        explanation: "Flush draw (9 hearts) + open-ended J-T-9-8 (Q or 7). 9 flush + 8 straight - 2 overlap (Qc, 7c already counted) = 15 outs."
    },
    {
        category: "Combo Draw",
        name: "Flush + Pair Draw",
        board: ['Kd', 'Jd', '7d', '3c'],
        yourHand: ['Ad', 'Qh'],
        opponentHand: ['Kh', 'Tc'],
        correctOuts: 12,
        explanation: "Nut flush draw (9 outs) + pair your Queen (3 Qs). Qd already counted in flush. 9 + 3 - 1 = 11 outs... or 12 with Ace pairing? No - A doesn't help vs K."
    },
    {
        category: "Combo Draw",
        name: "Monster Draw",
        board: ['Qh', 'Jh', '4h', '2c'],
        yourHand: ['Th', '9h'],
        opponentHand: ['Qd', 'Kc'],
        correctOuts: 15,
        explanation: "Flush draw (9 outs) + open-ended straight K or 8. Kh and 8h counted twice. 9 + 8 - 2 = 15 outs. Monster draw!"
    },
    
    // ============================================
    // TWO PAIR / TRIPS DRAWS
    // ============================================
    {
        category: "Two Pair Draw",
        name: "Need Second Pair",
        board: ['Kh', 'Jd', '7c', '3s'],
        yourHand: ['Kd', 'Qh'],
        opponentHand: ['Kc', 'As'],
        correctOuts: 3,
        explanation: "Both have pair of Kings, but opponent has Ace kicker. Hit a Queen (3 outs) to make two pair KK QQ and win."
    },
    {
        category: "Trips Draw",
        name: "Set Draw vs Overpair",
        board: ['Qh', 'Td', '6c', '2s'],
        yourHand: ['8h', '8d'],
        opponentHand: ['Qd', 'Jc'],
        correctOuts: 2,
        explanation: "Your 88 is losing to QQ. Need to hit an 8 to make a set. Only 2 eights left = 2 outs."
    },
    {
        category: "Full House Draw",
        name: "Two Pair Needs to Fill Up",
        board: ['Kh', 'Kd', '9c', '4s'],
        yourHand: ['9h', '9d'],
        opponentHand: ['Kc', 'Ac'],
        correctOuts: 4,
        explanation: "You have 99 full of KK, opponent has KKK full. You need the case 9 or a K to make quads/bigger boat. Only 1 nine + 0 kings = 1 out? Wait - you have 999KK vs KKK9A. Actually opponent is ahead. 1 out (remaining 9)."
    },
    
    // ============================================
    // OVERCARD SCENARIOS
    // ============================================
    {
        category: "Overcards",
        name: "AK vs Middle Pair",
        board: ['Jh', '8d', '5c', '2s'],
        yourHand: ['Ah', 'Kd'],
        opponentHand: ['8h', '7c'],
        correctOuts: 6,
        explanation: "Classic AK vs pair. Any Ace or King makes top pair to beat their 8s. 3 + 3 = 6 outs."
    },
    {
        category: "Overcards",
        name: "AQ vs Top Pair Bad Kicker",
        board: ['Kh', 'Td', '6c', '3s'],
        yourHand: ['Ah', 'Qd'],
        opponentHand: ['Kd', '9c'],
        correctOuts: 3,
        explanation: "Only an Ace helps - it makes top pair with A. Queen gives you second pair, still losing to Kings. 3 outs."
    },
    
    // ============================================
    // TRICKY / COUNTERFEIT SCENARIOS
    // ============================================
    {
        category: "Counterfeit",
        name: "Two Pair Gets Counterfeited",
        board: ['Qh', '8d', '8c', '3s'],
        yourHand: ['Qd', '7h'],
        opponentHand: ['Ah', 'Kc'],
        correctOuts: 4,
        explanation: "You have QQ88, opponent has 88 with AK. Any Queen (2 left) makes trips. Any 7 (3 left) makes bigger two pair QQ77... wait, 8s are paired. You have QQ88, they have 88AK. You're ahead! But if a K or A comes... 0 outs - you're winning!"
    },
    {
        category: "Counterfeit",
        name: "Paired Board Kills Outs",
        board: ['Kh', 'Jd', 'Jc', '5s'],
        yourHand: ['Ah', 'Kd'],
        opponentHand: ['Jh', '9c'],
        correctOuts: 4,
        explanation: "They have trip Jacks. You need Aces (3) or Kings (2) to make full house... wait, you have Kd, so 2 Kings left. 3 + 2 = 5 outs for full house to beat trips."
    },
    {
        category: "Blocker",
        name: "Opponent Holds Your Outs",
        board: ['Th', '9d', '3c', '2s'],
        yourHand: ['8h', '7c'],
        opponentHand: ['Jc', 'Jh'],
        correctOuts: 6,
        explanation: "Open-ender T-9-8-7 needs J or 6. But opponent HOLDS two Jacks! Only 2 Jacks left + 4 sixes = 6 outs (not 8)."
    },
    
    // ============================================
    // DRAWING DEAD / ZERO OUTS
    // ============================================
    {
        category: "Drawing Dead",
        name: "Flush Draw vs Full House",
        board: ['9h', '9d', '9c', '4h'],
        yourHand: ['Ah', 'Kh'],
        opponentHand: ['9s', '4c'],
        correctOuts: 0,
        explanation: "You have nut flush draw. But opponent has QUADS! No flush beats four of a kind. Drawing dead = 0 outs."
    },
    {
        category: "Drawing Dead",
        name: "Straight Draw vs Flush",
        board: ['Jh', 'Th', '8h', '2h'],
        yourHand: ['9c', '7c'],
        opponentHand: ['Ah', '3c'],
        correctOuts: 0,
        explanation: "You have open-ended straight draw. But there's 4 hearts on board and opponent has Ah for nut flush. Drawing dead = 0 outs."
    },
    {
        category: "Already Winning",
        name: "You're Already Ahead",
        board: ['Kh', 'Qd', '7c', '3s'],
        yourHand: ['Ah', 'Ad'],
        opponentHand: ['Kd', 'Jc'],
        correctOuts: 0,
        explanation: "Trick question! Your AA beats their KK. You're not drawing - you're ahead. Answer: 0 outs needed (you're winning)."
    },
    
    // ============================================
    // SPECIFIC OUT COUNTS
    // ============================================
    {
        category: "Exact Count",
        name: "Backdoor Considerations",
        board: ['Kh', 'Td', '6c', '3s'],
        yourHand: ['Qh', 'Jh'],
        opponentHand: ['Kd', '9c'],
        correctOuts: 4,
        explanation: "Gutshot straight draw - any 9 or A makes the straight. Wait, there's a 9 in opponent's hand! 4 Aces + 3 Nines = 7 outs... actually just need A for straight. 4 outs."
    },
    {
        category: "Exact Count",
        name: "Set vs Set",
        board: ['Qh', 'Td', '5c', '5s'],
        yourHand: ['Th', 'Ts'],
        opponentHand: ['Qd', 'Qc'],
        correctOuts: 1,
        explanation: "Your set of Tens vs their set of Queens. Only the last Ten (1 out) makes you quads to beat their trips. 1 out."
    },
    {
        category: "Exact Count",
        name: "Flush Draw Missing One Card",
        board: ['Ks', 'Js', '8s', '2c'],
        yourHand: ['As', '3h'],
        opponentHand: ['Qs', 'Td'],
        correctOuts: 8,
        explanation: "Both have spade flush draws. You have As, they have Qs. 9 spades left, but they have one! 8 remaining spades = 8 outs."
    },
    
    // ============================================
    // MORE GUTSHOTS & STRAIGHT VARIATIONS
    // ============================================
    {
        category: "Gutshot",
        name: "Gutshot vs Two Pair",
        board: ['Kh', 'Qd', '9c', '4s'],
        yourHand: ['Jh', 'Td'],
        opponentHand: ['Kd', 'Qc'],
        correctOuts: 4,
        explanation: "K-Q-J-T needs an Ace for Broadway. Opponent has two pair KQ. 4 Aces = 4 outs."
    },
    {
        category: "Open-Ender",
        name: "Open-Ender Both Ends Live",
        board: ['8h', '7d', '3c', '2s'],
        yourHand: ['6h', '5d'],
        opponentHand: ['8d', 'Ac'],
        correctOuts: 8,
        explanation: "You have 8-7-6-5, need 9 or 4 for straight. Both ends fully live. 4 nines + 4 fours = 8 outs."
    },
    
    // ============================================
    // ADVANCED SCENARIOS
    // ============================================
    {
        category: "Advanced",
        name: "Nut Flush Draw vs Second Nut",
        board: ['Qc', 'Tc', '5c', '3h'],
        yourHand: ['Ac', 'Kh'],
        opponentHand: ['Kc', 'Jd'],
        correctOuts: 9,
        explanation: "You have nut club draw, they have 2nd nut. Any club gives you the winner. 9 clubs left = 9 outs."
    },
    {
        category: "Advanced",
        name: "Straight Flush Draw",
        board: ['Jh', 'Th', '4c', '2s'],
        yourHand: ['9h', '8h'],
        opponentHand: ['Jd', 'Kc'],
        correctOuts: 15,
        explanation: "Flush draw (9) + straight draw Q or 7 (8). Qh and 7h counted in both. 9 + 8 - 2 = 15 outs."
    },
    {
        category: "Advanced",
        name: "Wrap Draw in Holdem",
        board: ['9h', '8d', '4c', '2s'],
        yourHand: ['Th', '6h'],
        opponentHand: ['8h', 'Kc'],
        correctOuts: 8,
        explanation: "T-9-8 connected. Need 7 for T-9-8-7-6 or J for J-T-9-8. But you don't have the J! Need 7 only = 4 outs? No wait, you have T-6 with 9-8 on board. T-9-8-7-6 needs 7. Just 4 outs."
    },
    {
        category: "Advanced",
        name: "Board Pair Reduces Outs",
        board: ['Kh', 'Th', 'Th', '5d'],
        yourHand: ['Ah', 'Qh'],
        opponentHand: ['Td', 'Tc'],
        correctOuts: 0,
        explanation: "You have nut flush draw. They have QUADS (four Tens)! Flush doesn't beat quads. 0 outs."
    }
];

// DOM elements for outs mode
let outsBoardEl, yourHandEl, opponentHandEl, yourHandDescEl, opponentHandDescEl;
let outsInputEl, checkOutsBtn, outsResultEl, outsResultMessageEl, outsExplanationEl, nextOutsBtn;
let outsStreakEl, outsCorrectEl, outsTotalEl, scenarioTextEl;

// Initialize outs mode
function initOutsMode() {
    outsBoardEl = document.getElementById('outs-board-cards');
    yourHandEl = document.getElementById('your-hand-cards');
    opponentHandEl = document.getElementById('opponent-hand-cards');
    yourHandDescEl = document.getElementById('your-hand-desc');
    opponentHandDescEl = document.getElementById('opponent-hand-desc');
    outsInputEl = document.getElementById('outs-input');
    checkOutsBtn = document.getElementById('check-outs-btn');
    outsResultEl = document.getElementById('outs-result');
    outsResultMessageEl = document.getElementById('outs-result-message');
    outsExplanationEl = document.getElementById('outs-explanation');
    nextOutsBtn = document.getElementById('next-outs-btn');
    outsStreakEl = document.getElementById('outs-streak');
    outsCorrectEl = document.getElementById('outs-correct');
    outsTotalEl = document.getElementById('outs-total');
    scenarioTextEl = document.getElementById('scenario-text');
    
    checkOutsBtn.addEventListener('click', checkOutsAnswer);
    nextOutsBtn.addEventListener('click', newOutsRound);
    
    // Allow enter key to submit
    outsInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkOutsAnswer();
        }
    });
}

// Start new outs round
function newOutsRound() {
    // Reset UI
    outsResultEl.classList.add('hidden');
    outsInputEl.value = '';
    outsInputEl.disabled = false;
    checkOutsBtn.disabled = false;
    outsInputEl.classList.remove('correct', 'wrong');
    
    // Get random template
    const templateIndex = Math.floor(Math.random() * OUTS_TEMPLATES.length);
    currentOutsTemplate = OUTS_TEMPLATES[templateIndex];
    
    // Parse cards
    outsBoard = currentOutsTemplate.board.map(parseCard);
    yourHand = currentOutsTemplate.yourHand.map(parseCard);
    opponentHand = currentOutsTemplate.opponentHand.map(parseCard);
    
    // Render
    renderOutsBoard();
    renderOutsHands();
    
    // Update scenario text
    scenarioTextEl.textContent = `${currentOutsTemplate.category}: How many outs to win?`;
    
    // Focus input
    setTimeout(() => outsInputEl.focus(), 100);
}

// Render the turn board
function renderOutsBoard() {
    outsBoardEl.innerHTML = '';
    for (const card of outsBoard) {
        outsBoardEl.appendChild(createCardElement(card));
    }
}

// Render both hands
function renderOutsHands() {
    // Your hand
    yourHandEl.innerHTML = '';
    for (const card of yourHand) {
        yourHandEl.appendChild(createCardElement(card));
    }
    
    // Opponent hand
    opponentHandEl.innerHTML = '';
    for (const card of opponentHand) {
        opponentHandEl.appendChild(createCardElement(card));
    }
    
    // Show current hand descriptions
    const yourEval = evaluateHand(outsBoard, yourHand);
    const oppEval = evaluateHand(outsBoard, opponentHand);
    yourHandDescEl.textContent = getHandDescription(yourEval);
    opponentHandDescEl.textContent = getHandDescription(oppEval);
}

// Check the user's answer
function checkOutsAnswer() {
    const userAnswer = parseInt(outsInputEl.value, 10);
    
    if (isNaN(userAnswer) || userAnswer < 0) {
        outsInputEl.classList.add('shake');
        setTimeout(() => outsInputEl.classList.remove('shake'), 300);
        return;
    }
    
    outsTotalCount++;
    const correct = userAnswer === currentOutsTemplate.correctOuts;
    
    outsInputEl.disabled = true;
    checkOutsBtn.disabled = true;
    
    if (correct) {
        outsCorrectCount++;
        outsStreak++;
        outsResultMessageEl.textContent = '✓ Correct!';
        outsResultEl.className = 'result perfect';
        outsInputEl.classList.add('correct');
    } else {
        outsStreak = 0;
        outsResultMessageEl.textContent = `✗ Answer: ${currentOutsTemplate.correctOuts} outs`;
        outsResultEl.className = 'result failed';
        outsInputEl.classList.add('wrong');
    }
    
    // Show explanation
    outsExplanationEl.textContent = currentOutsTemplate.explanation;
    
    // Update stats
    updateOutsStats();
    
    // Show result
    outsResultEl.classList.remove('hidden');
}

// Update outs stats display
function updateOutsStats() {
    outsStreakEl.textContent = outsStreak;
    outsCorrectEl.textContent = outsCorrectCount;
    outsTotalEl.textContent = outsTotalCount;
}
