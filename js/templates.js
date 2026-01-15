// Teaching templates for poker hand ranking concepts
// Each template illustrates a specific concept without explicit explanation

const TEACHING_TEMPLATES = [
    // ============================================
    // KICKER CONCEPTS
    // ============================================
    
    // Kicker matters with one pair
    {
        board: ['Kh', '7d', '3c', '2s', '9h'],
        hands: [
            ['Kd', 'Ac'],  // Pair of Kings, Ace kicker
            ['Ks', 'Qc'],  // Pair of Kings, Queen kicker
            ['Kc', 'Tc'],  // Pair of Kings, Ten kicker
            ['9d', '8h']   // Pair of Nines
        ]
    },
    
    // Kicker matters with two pair - different kickers
    {
        board: ['Qh', 'Qd', '8c', '8s', '2h'],
        hands: [
            ['Ac', 'Kd'],  // Two pair QQ88, Ace kicker
            ['Kh', 'Js'],  // Two pair QQ88, King kicker
            ['Jd', 'Tc'],  // Two pair QQ88, Jack kicker
            ['5s', '4h']   // Two pair QQ88, 5 kicker
        ]
    },
    
    // Kicker doesn't matter with straights - all have same straight
    {
        board: ['9h', '8d', '7c', '6s', '2h'],
        hands: [
            ['Tc', 'Ac'],  // T-high straight, Ace doesn't help
            ['Th', 'Kd'],  // T-high straight, King doesn't help
            ['Ts', '5c'],  // T-high straight with 5
            ['5d', '4h']   // 9-high straight
        ]
    },
    
    // Kicker doesn't matter when board plays - chopped pot scenario
    {
        board: ['Ah', 'Kd', 'Qc', 'Js', 'Th'],
        hands: [
            ['2c', '3d'],  // Broadway on board
            ['4h', '5s'],  // Broadway on board
            ['7d', '8c'],  // Broadway on board
            ['9h', '6s']   // Broadway on board (all tie!)
        ]
    },
    
    // ============================================
    // TWO PAIR CONCEPTS
    // ============================================
    
    // Higher two pair beats lower two pair
    {
        board: ['Jh', '9d', '4c', '2s', '7h'],
        hands: [
            ['Jd', '9c'],  // JJ99
            ['Jc', '7s'],  // JJ77
            ['9h', '7d'],  // 9977
            ['4h', '2d']   // 4422
        ]
    },
    
    // Counterfeited two pair - board pairs kill your two pair advantage
    {
        board: ['Kh', 'Kd', '8c', '8s', '3h'],
        hands: [
            ['Ac', 'Qd'],  // KK88 with Ace kicker
            ['8h', '7s'],  // Full house 888KK!
            ['Qh', 'Jd'],  // KK88 with Q kicker  
            ['3c', '3d']   // Full house 333KK... wait, 33388?
        ]
    },
    
    // ============================================
    // SET VS TRIPS
    // ============================================
    
    // Set (pocket pair) vs trips (board pair) - set usually better kicker
    {
        board: ['9h', '9d', 'Kc', '5s', '2h'],
        hands: [
            ['9c', 'Ah'],  // Trip 9s, Ace kicker
            ['9s', 'Qd'],  // Trip 9s, Queen kicker
            ['Kh', 'Ks'],  // Full house KKK99
            ['5h', '5d']   // Full house 55599
        ]
    },
    
    // ============================================
    // FLUSH CONCEPTS
    // ============================================
    
    // Flush over flush - highest card wins
    {
        board: ['Jh', '8h', '4h', '2h', 'Kc'],
        hands: [
            ['Ah', '3c'],  // Ace-high flush
            ['Kh', '5d'],  // King-high flush
            ['Qh', '9c'],  // Queen-high flush
            ['Th', '7s']   // Ten-high flush
        ]
    },
    
    // Nut flush blocker concept - Ace of suit matters
    {
        board: ['Qs', '9s', '6s', '3s', 'Kd'],
        hands: [
            ['As', '2c'],  // Ace-high flush
            ['Ks', 'Jd'],  // King-high flush
            ['Ts', '8h'],  // Ten-high flush
            ['7s', '5c']   // 9-high flush (board has Q, 9, 6)
        ]
    },
    
    // Board flush - who has the best card in that suit?
    {
        board: ['Ah', 'Kh', 'Qh', 'Jh', '2c'],
        hands: [
            ['Th', '3d'],  // Royal flush!
            ['9h', '8s'],  // 2nd nut flush
            ['8h', '7c'],  // 3rd nut flush
            ['7h', '6d']   // 4th nut flush
        ]
    },
    
    // ============================================
    // STRAIGHT CONCEPTS
    // ============================================
    
    // Wheel (A-2-3-4-5) is lowest straight
    {
        board: ['5h', '4d', '3c', '2s', 'Kh'],
        hands: [
            ['7c', '6h'],  // 7-high straight
            ['6d', 'Ah'],  // 6-high straight
            ['Ac', 'Qd'],  // 5-high straight (wheel)
            ['Kd', 'Qs']   // Pair of Kings (no straight)
        ]
    },
    
    // Broadway beats lower straights
    {
        board: ['Qh', 'Jd', 'Tc', '9s', '3h'],
        hands: [
            ['Ac', 'Kh'],  // Broadway (A-high straight)
            ['Kd', '8s'],  // K-high straight
            ['8h', '7c'],  // Q-high straight
            ['Qs', 'Qc']   // Trip Queens (no straight)
        ]
    },
    
    // Straight on board - kickers don't matter
    {
        board: ['Th', '9d', '8c', '7s', '6h'],
        hands: [
            ['Ac', 'Kd'],  // T-high straight, AK doesn't help
            ['Jh', '2s'],  // J-high straight - WINNER
            ['Qd', '5c'],  // T-high straight
            ['4h', '3d']   // T-high straight
        ]
    },
    
    // ============================================
    // FULL HOUSE CONCEPTS
    // ============================================
    
    // Full house - trips matter more than pair
    {
        board: ['Qh', 'Qd', '7c', '7s', '2h'],
        hands: [
            ['Qc', 'As'],  // QQQ77
            ['7h', 'Kd'],  // 777QQ
            ['Ac', 'Ad'],  // QQ77 with AA - just two pair!
            ['Kh', 'Ks']   // QQ77 with KK - two pair
        ]
    },
    
    // Full house vs full house - higher trips wins
    {
        board: ['Kh', 'Kd', '8c', '8s', '3h'],
        hands: [
            ['Kc', '2s'],  // KKKK88 - Quad Kings!
            ['8h', '7d'],  // 888KK
            ['3c', '3d'],  // 333KK
            ['Ah', 'Qd']   // KK88 with Ace kicker
        ]
    },
    
    // ============================================
    // QUADS CONCEPTS
    // ============================================
    
    // Four of a kind - kicker matters
    {
        board: ['9h', '9d', '9c', '9s', '2h'],
        hands: [
            ['Ac', 'Kd'],  // Quad 9s, Ace kicker
            ['Kh', 'Qd'],  // Quad 9s, King kicker
            ['Qc', 'Js'],  // Quad 9s, Queen kicker
            ['Jh', 'Td']   // Quad 9s, Jack kicker
        ]
    },
    
    // ============================================
    // STRAIGHT FLUSH CONCEPTS
    // ============================================
    
    // Straight flush beats regular flush and straight
    {
        board: ['8h', '7h', '6h', 'Kc', '2d'],
        hands: [
            ['9h', 'Th'],  // T-high straight flush
            ['Ah', 'Qd'],  // Ace-high flush
            ['5h', '4c'],  // 8-high straight flush
            ['9c', 'Td']   // T-high straight (not flush)
        ]
    },
    
    // ============================================
    // OVERPAIR VS TOP PAIR
    // ============================================
    
    // Overpair beats top pair
    {
        board: ['Jh', '8d', '5c', '3s', '2h'],
        hands: [
            ['Ac', 'Ad'],  // Overpair AA
            ['Kh', 'Kd'],  // Overpair KK
            ['Qc', 'Qs'],  // Overpair QQ
            ['Jd', 'Tc']   // Top pair JJ with T kicker
        ]
    },
    
    // ============================================
    // THREE OF A KIND CONCEPTS  
    // ============================================
    
    // Higher trips beat lower trips
    {
        board: ['Qh', '7d', '7c', '3s', '2h'],
        hands: [
            ['Qd', 'Qc'],  // Trip Queens
            ['7h', 'As'],  // Trip 7s, Ace kicker
            ['7s', 'Kd'],  // Trip 7s, King kicker
            ['Ac', 'Kh']   // Pair of 7s with AK
        ]
    },
    
    // ============================================
    // BOARD PLAYS / CHOP CONCEPTS
    // ============================================
    
    // Everyone plays the board
    {
        board: ['Ah', 'Ad', 'Ac', 'As', 'Kh'],
        hands: [
            ['Qc', 'Jd'],  // Quad Aces, K kicker (board)
            ['Th', '9s'],  // Quad Aces, K kicker (board)
            ['8d', '7c'],  // Quad Aces, K kicker (board)
            ['6h', '5d']   // Quad Aces, K kicker (board) - ALL TIE
        ]
    },
    
    // Flush on board - need higher card to win
    {
        board: ['Kd', 'Qd', 'Jd', '9d', '2d'],
        hands: [
            ['Ad', '3h'],  // Ace-high flush
            ['Td', '8c'],  // K-high flush (using Td)
            ['8d', '7s'],  // K-high flush (using 8d, worse than Td)
            ['Ac', 'As']   // Board flush K-high (no diamonds)
        ]
    },
    
    // ============================================
    // TRICKY SCENARIOS
    // ============================================
    
    // Looks like a straight but isn't for everyone
    {
        board: ['Jh', 'Td', '9c', '4s', '2h'],
        hands: [
            ['Qc', '8d'],  // Q-high straight
            ['Kh', 'Qd'],  // K-high straight
            ['8h', '7c'],  // J-high straight
            ['Ac', 'Ks']   // Just Ace high (no straight)
        ]
    },
    
    // Hidden set vs obvious pair
    {
        board: ['Kh', 'Kd', '9c', '5s', '2h'],
        hands: [
            ['Kc', 'Qs'],  // Trip Kings with Q kicker
            ['9h', '9d'],  // Full house 999KK
            ['Ah', 'Jd'],  // Pair Kings, Ace kicker
            ['Qc', 'Ts']   // Pair Kings, Queen kicker
        ]
    },
    
    // Flush draw vs made hand
    {
        board: ['Kh', 'Jh', '8h', '5c', '2d'],
        hands: [
            ['Ah', 'Qd'],  // Ace-high flush
            ['Th', '9c'],  // T-high flush
            ['Qh', '7s'],  // Q-high flush
            ['Ac', 'Kd']   // Just pair of Kings
        ]
    },
    
    // Pair on board - trips vs two pair
    {
        board: ['Th', 'Td', '7c', '4s', '2h'],
        hands: [
            ['Tc', 'As'],  // Trip Tens, Ace kicker
            ['Ah', 'Ad'],  // Two pair AA TT
            ['Kh', 'Kd'],  // Two pair KK TT
            ['7h', '7d']   // Full house 777TT
        ]
    },
    
    // High card battle
    {
        board: ['Kh', 'Jd', '8c', '4s', '2h'],
        hands: [
            ['Ac', 'Qd'],  // AKQ J8
            ['Ac', 'Td'],  // AKJ T8
            ['Ac', '9h'],  // AKJ 98
            ['Qh', 'Td']   // KQJ T8
        ]
    },
    
    // Second kicker matters
    {
        board: ['Ah', 'Td', '5c', '3s', '2h'],
        hands: [
            ['Ac', 'Kd'],  // Pair Aces, K kicker
            ['Ad', 'Qh'],  // Pair Aces, Q kicker
            ['As', 'Jc'],  // Pair Aces, J kicker
            ['Kh', 'Qd']   // Just Ace high with KQ
        ]
    },
    
    // ============================================
    // MORE FLUSH SCENARIOS
    // ============================================
    
    // Four to a flush on board
    {
        board: ['Ac', 'Jc', '8c', '5c', 'Kh'],
        hands: [
            ['Kc', '2d'],  // Nut flush (AKJ85)
            ['Qc', 'Td'],  // 2nd nut flush
            ['Tc', '9h'],  // flush with T
            ['9c', '7s']   // flush with 9
        ]
    },
    
    // ============================================
    // MORE FULL HOUSE SCENARIOS
    // ============================================
    
    // Two pair on board - who makes the boat?
    {
        board: ['Jh', 'Jd', '6c', '6s', '2h'],
        hands: [
            ['Jc', 'As'],  // JJJ66
            ['6h', 'Kd'],  // 666JJ
            ['2c', '2d'],  // 222JJ - smaller boat
            ['Ah', 'Kh']   // JJ66 with A kicker
        ]
    }
];

// Get a random teaching template
function getRandomTemplate() {
    const index = Math.floor(Math.random() * TEACHING_TEMPLATES.length);
    const template = TEACHING_TEMPLATES[index];
    
    return {
        board: template.board.map(parseCard),
        hands: template.hands.map(hand => hand.map(parseCard))
    };
}

// Decide whether to use a template or random
function shouldUseTemplate() {
    return Math.random() < 0.45; // 45% chance of template
}
