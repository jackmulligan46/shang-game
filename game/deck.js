// deck.js

export const SUITS = ["♣", "♦", "♥", "♠"];
export const RANKS = [
    "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "J", "Q", "K", "A"
  ];

// Create a deck of 52 cards
export function createDeck() {
    const suits = ["♣", "♦", "♥", "♠"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
  
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, code: `${rank}${suit}` });
      }
    }
  
    return deck;
  }
  

// Shuffle the deck
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
