// Read the Board Mode - Answer YES/NO questions about board texture

// Game state
let rbBoard = [];
let rbBoardSize = 5;
let rbQuestions = [];
let rbUserAnswers = {};
let rbStreak = 0;
let rbCorrectCount = 0;
let rbTotalCount = 0;
let rbGameEnded = false;

// DOM elements
let rbBoardEl, rbQuestionsEl, rbResultEl, rbResultMessageEl;
let rbCheckBtn, nextRbBtn;
let rbStreakEl, rbCorrectEl, rbTotalEl;
let rbBoardSizeBtns;

// ============================================
// QUESTION DEFINITIONS
// ============================================

// Each question has: id, text, check function (returns true for YES, false for NO)
const ALL_QUESTIONS = [
    // Made Hand Questions
    {
        id: 'flush_possible',
        text: 'Is a flush possible?',
        check: (board) => {
            const suitCounts = {};
            board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
            return Math.max(...Object.values(suitCounts)) >= 3;
        },
        minCards: 3
    },
    {
        id: 'straight_possible',
        text: 'Is a straight possible?',
        check: (board) => {
            // Check if 5 cards can form a straight using board + 2 hole cards
            const values = board.map(c => c.value);
            if (values.includes(14)) values.push(1); // Ace low
            const unique = [...new Set(values)].sort((a,b) => a-b);
            
            // Check all possible 5-card windows
            for (let start = 1; start <= 10; start++) {
                let count = 0;
                for (let v = start; v < start + 5; v++) {
                    if (unique.includes(v)) count++;
                }
                // Need at least 3 board cards in the window (others from hole cards)
                if (count >= 3) return true;
            }
            return false;
        },
        minCards: 3
    },
    {
        id: 'board_paired',
        text: 'Is the board paired?',
        check: (board) => {
            const rankCounts = {};
            board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
            return Math.max(...Object.values(rankCounts)) >= 2;
        },
        minCards: 3
    },
    {
        id: 'trips_on_board',
        text: 'Are there trips on the board?',
        check: (board) => {
            const rankCounts = {};
            board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
            return Math.max(...Object.values(rankCounts)) >= 3;
        },
        minCards: 3
    },
    {
        id: 'four_flush',
        text: 'Is there a four-flush on board?',
        check: (board) => {
            const suitCounts = {};
            board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
            return Math.max(...Object.values(suitCounts)) >= 4;
        },
        minCards: 4
    },
    {
        id: 'four_straight',
        text: 'Are there 4 to a straight on board?',
        check: (board) => {
            const values = board.map(c => c.value);
            if (values.includes(14)) values.push(1);
            const unique = [...new Set(values)].sort((a,b) => a-b);
            
            for (let start = 1; start <= 10; start++) {
                let count = 0;
                for (let v = start; v < start + 5; v++) {
                    if (unique.includes(v)) count++;
                }
                if (count >= 4) return true;
            }
            return false;
        },
        minCards: 4
    },
    {
        id: 'quads_possible',
        text: 'Could someone have quads?',
        check: (board) => {
            // Quads possible if board has at least a pair
            const rankCounts = {};
            board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
            return Math.max(...Object.values(rankCounts)) >= 2;
        },
        minCards: 3
    },
    
    // Board Texture Questions
    {
        id: 'rainbow',
        text: 'Is this a rainbow board?',
        check: (board) => {
            const suits = new Set(board.map(c => c.suit));
            return suits.size === board.length || (board.length > 4 && suits.size >= 4);
        },
        minCards: 3
    },
    {
        id: 'monotone',
        text: 'Is this a monotone board?',
        check: (board) => {
            const suits = new Set(board.map(c => c.suit));
            return suits.size === 1;
        },
        minCards: 3
    },
    {
        id: 'three_straight',
        text: 'Are there 3+ connected cards?',
        check: (board) => {
            const values = board.map(c => c.value);
            if (values.includes(14)) values.push(1);
            const sorted = [...new Set(values)].sort((a,b) => a-b);
            
            let maxConnected = 1;
            let current = 1;
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === sorted[i-1] + 1) {
                    current++;
                    maxConnected = Math.max(maxConnected, current);
                } else {
                    current = 1;
                }
            }
            return maxConnected >= 3;
        },
        minCards: 3
    },
    {
        id: 'disconnected',
        text: 'Is the board disconnected?',
        check: (board) => {
            // Disconnected = no two cards within 3 ranks of each other (excluding pairs)
            const values = [...new Set(board.map(c => c.value))].sort((a,b) => a-b);
            for (let i = 1; i < values.length; i++) {
                if (values[i] - values[i-1] <= 3) return false;
            }
            return true;
        },
        minCards: 3
    },
    {
        id: 'ace_on_board',
        text: 'Is there an Ace on the board?',
        check: (board) => board.some(c => c.rank === 'A'),
        minCards: 3
    },
    {
        id: 'broadway_cards',
        text: 'Are there any Broadway cards?',
        check: (board) => {
            const broadway = ['T', 'J', 'Q', 'K', 'A'];
            return board.some(c => broadway.includes(c.rank));
        },
        minCards: 3
    },
    {
        id: 'low_board',
        text: 'Are all cards 8 or below?',
        check: (board) => board.every(c => c.value <= 8),
        minCards: 3
    },
    {
        id: 'high_board',
        text: 'Are all cards 9 or higher?',
        check: (board) => board.every(c => c.value >= 9),
        minCards: 3
    },
    
    // Situational Questions
    {
        id: 'straight_flush_possible',
        text: 'Could the nuts be a straight flush?',
        check: (board) => {
            // Check if 3+ suited cards within a 5-card straight window
            for (const suit of SUITS) {
                const suitedCards = board.filter(c => c.suit === suit);
                if (suitedCards.length >= 3) {
                    const values = suitedCards.map(c => c.value);
                    if (values.includes(14)) values.push(1);
                    
                    for (let start = 1; start <= 10; start++) {
                        let count = 0;
                        for (let v = start; v < start + 5; v++) {
                            if (values.includes(v)) count++;
                        }
                        if (count >= 3) return true;
                    }
                }
            }
            return false;
        },
        minCards: 3
    },
    {
        id: 'wheel_possible',
        text: 'Is a wheel (A-2-3-4-5) possible?',
        check: (board) => {
            const wheelRanks = ['A', '2', '3', '4', '5'];
            const boardRanks = board.map(c => c.rank);
            let wheelCount = 0;
            for (const r of wheelRanks) {
                if (boardRanks.includes(r)) wheelCount++;
            }
            return wheelCount >= 3;
        },
        minCards: 3
    },
    {
        id: 'broadway_straight_possible',
        text: 'Is Broadway (A-K-Q-J-T) possible?',
        check: (board) => {
            const broadwayRanks = ['A', 'K', 'Q', 'J', 'T'];
            const boardRanks = board.map(c => c.rank);
            let count = 0;
            for (const r of broadwayRanks) {
                if (boardRanks.includes(r)) count++;
            }
            return count >= 3;
        },
        minCards: 3
    },
    {
        id: 'playing_the_board',
        text: 'Could someone play the board?',
        check: (board) => board.length === 5, // Always possible on river
        minCards: 5
    },
    {
        id: 'flush_draw_possible',
        text: 'Is a flush draw possible?',
        check: (board) => {
            const suitCounts = {};
            board.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
            return Object.values(suitCounts).some(count => count >= 2);
        },
        minCards: 3,
        maxCards: 4 // Only relevant on flop/turn
    },
    {
        id: 'oesd_possible',
        text: 'Is an open-ended straight draw possible?',
        check: (board) => {
            // OESD possible if 2+ cards within a 4-card window (not at edges)
            const values = board.map(c => c.value);
            if (values.includes(14)) values.push(1);
            const unique = [...new Set(values)].sort((a,b) => a-b);
            
            for (let start = 2; start <= 10; start++) { // 2-5 through T-K windows
                let count = 0;
                for (let v = start; v < start + 4; v++) {
                    if (unique.includes(v)) count++;
                }
                if (count >= 2) return true;
            }
            return false;
        },
        minCards: 3,
        maxCards: 4
    },
    {
        id: 'two_pair_board',
        text: 'Are there two pairs on the board?',
        check: (board) => {
            const rankCounts = {};
            board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
            const pairs = Object.values(rankCounts).filter(c => c >= 2);
            return pairs.length >= 2;
        },
        minCards: 4
    },
    {
        id: 'full_house_possible',
        text: 'Is a full house possible?',
        check: (board) => {
            // Full house possible if board is paired OR has 3+ cards
            const rankCounts = {};
            board.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
            return Math.max(...Object.values(rankCounts)) >= 2 || board.length >= 3;
        },
        minCards: 3
    }
];

// ============================================
// INITIALIZATION
// ============================================

function initReadBoardMode() {
    rbBoardEl = document.getElementById('rb-board-cards');
    rbQuestionsEl = document.getElementById('rb-questions');
    rbResultEl = document.getElementById('rb-result');
    rbResultMessageEl = document.getElementById('rb-result-message');
    rbCheckBtn = document.getElementById('rb-check-btn');
    nextRbBtn = document.getElementById('next-rb-btn');
    rbStreakEl = document.getElementById('rb-streak');
    rbCorrectEl = document.getElementById('rb-correct');
    rbTotalEl = document.getElementById('rb-total');
    
    // Board size buttons
    rbBoardSizeBtns = document.querySelectorAll('#rb-board-size .rb-size-btn');
    rbBoardSizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            rbBoardSizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            rbBoardSize = parseInt(btn.dataset.size);
            newReadBoardRound();
        });
    });
    
    rbCheckBtn.addEventListener('click', checkReadBoardAnswers);
    nextRbBtn.addEventListener('click', newReadBoardRound);
}

// ============================================
// GAME LOGIC
// ============================================

function getQuestionsForBoard(board) {
    // Filter questions that apply to this board size
    const applicable = ALL_QUESTIONS.filter(q => {
        if (q.minCards && board.length < q.minCards) return false;
        if (q.maxCards && board.length > q.maxCards) return false;
        return true;
    });
    
    // Shuffle and pick 3
    shuffle(applicable);
    return applicable.slice(0, 3);
}

function newReadBoardRound() {
    rbGameEnded = false;
    rbUserAnswers = {};
    rbResultEl.classList.add('hidden');
    rbCheckBtn.disabled = true;
    
    // Deal a random board
    const deck = shuffle(createDeck());
    rbBoard = deck.slice(0, rbBoardSize);
    
    // Get 3 random applicable questions
    rbQuestions = getQuestionsForBoard(rbBoard);
    
    // Render
    renderRbBoard();
    renderQuestions();
}

function renderRbBoard() {
    rbBoardEl.innerHTML = '';
    for (const card of rbBoard) {
        rbBoardEl.appendChild(createCardElement(card));
    }
}

function renderQuestions() {
    rbQuestionsEl.innerHTML = '';
    
    rbQuestions.forEach((q, index) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'rb-question';
        questionEl.dataset.id = q.id;
        
        const textEl = document.createElement('div');
        textEl.className = 'rb-question-text';
        textEl.textContent = `Q${index + 1}: ${q.text}`;
        questionEl.appendChild(textEl);
        
        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'rb-answer-buttons';
        
        const yesBtn = document.createElement('button');
        yesBtn.className = 'rb-answer-btn';
        yesBtn.dataset.answer = 'yes';
        yesBtn.textContent = 'YES';
        yesBtn.addEventListener('click', () => selectAnswer(q.id, true, questionEl));
        buttonsEl.appendChild(yesBtn);
        
        const noBtn = document.createElement('button');
        noBtn.className = 'rb-answer-btn';
        noBtn.dataset.answer = 'no';
        noBtn.textContent = 'NO';
        noBtn.addEventListener('click', () => selectAnswer(q.id, false, questionEl));
        buttonsEl.appendChild(noBtn);
        
        questionEl.appendChild(buttonsEl);
        rbQuestionsEl.appendChild(questionEl);
    });
}

function selectAnswer(questionId, answer, questionEl) {
    if (rbGameEnded) return;
    
    // Store answer
    rbUserAnswers[questionId] = answer;
    
    // Update button states
    const buttons = questionEl.querySelectorAll('.rb-answer-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        if ((btn.dataset.answer === 'yes' && answer === true) ||
            (btn.dataset.answer === 'no' && answer === false)) {
            btn.classList.add('selected');
        }
    });
    
    // Enable check button if all questions answered
    if (Object.keys(rbUserAnswers).length === 3) {
        rbCheckBtn.disabled = false;
    }
}

function checkReadBoardAnswers() {
    if (rbGameEnded || Object.keys(rbUserAnswers).length < 3) return;
    
    rbGameEnded = true;
    rbTotalCount++;
    
    let correctAnswers = 0;
    
    // Check each question
    rbQuestions.forEach(q => {
        const userAnswer = rbUserAnswers[q.id];
        const correctAnswer = q.check(rbBoard);
        const questionEl = rbQuestionsEl.querySelector(`[data-id="${q.id}"]`);
        const buttons = questionEl.querySelectorAll('.rb-answer-btn');
        
        // Disable buttons
        buttons.forEach(btn => btn.disabled = true);
        
        if (userAnswer === correctAnswer) {
            correctAnswers++;
            questionEl.classList.add('correct');
        } else {
            questionEl.classList.add('wrong');
            
            // Highlight the correct answer
            buttons.forEach(btn => {
                if ((btn.dataset.answer === 'yes' && correctAnswer === true) ||
                    (btn.dataset.answer === 'no' && correctAnswer === false)) {
                    btn.classList.add('correct-answer');
                }
            });
        }
    });
    
    // Update results
    if (correctAnswers === 3) {
        rbCorrectCount++;
        rbStreak++;
        rbResultMessageEl.textContent = '✓ Perfect! 3/3';
        rbResultEl.className = 'result perfect';
    } else {
        rbStreak = 0;
        rbResultMessageEl.textContent = `✗ ${correctAnswers}/3 correct`;
        rbResultEl.className = 'result failed';
    }
    
    updateRbStats();
    rbResultEl.classList.remove('hidden');
}

function updateRbStats() {
    rbStreakEl.textContent = rbStreak;
    rbCorrectEl.textContent = rbCorrectCount;
    rbTotalEl.textContent = rbTotalCount;
}
