// Card utilities for the poker trainer

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const RANK_DISPLAY = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
};

// Create a card object
function createCard(rank, suit) {
    return {
        rank: rank,
        suit: suit,
        value: RANK_VALUES[rank],
        display: RANK_DISPLAY[rank],
        symbol: SUIT_SYMBOLS[suit]
    };
}

// Parse a card string like "Ah" or "Ts"
function parseCard(str) {
    const rank = str[0].toUpperCase();
    const suitChar = str[1].toLowerCase();
    const suitMap = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' };
    return createCard(rank, suitMap[suitChar]);
}

// Create a full deck
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push(createCard(rank, suit));
        }
    }
    return deck;
}

// Shuffle array in place (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Get a card's string representation (e.g., "Ah")
function cardToString(card) {
    const suitChar = card.suit[0];
    return card.rank + suitChar;
}

// Create HTML element for a card
function createCardElement(card) {
    const el = document.createElement('div');
    el.className = `card ${card.suit}`;
    el.innerHTML = `
        <span class="rank">${card.display}</span>
        <span class="suit">${card.symbol}</span>
    `;
    return el;
}

// Deal cards from deck, removing them
function deal(deck, count) {
    const cards = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
        cards.push(deck.pop());
    }
    return cards;
}

// Remove specific cards from deck
function removeCards(deck, cardsToRemove) {
    const removeSet = new Set(cardsToRemove.map(c => cardToString(c)));
    return deck.filter(c => !removeSet.has(cardToString(c)));
}

// Check if two cards are the same
function cardsEqual(c1, c2) {
    return c1.rank === c2.rank && c1.suit === c2.suit;
}

// Sort cards by value (high to low)
function sortByValue(cards) {
    return [...cards].sort((a, b) => b.value - a.value);
}
