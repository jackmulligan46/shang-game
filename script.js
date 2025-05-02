import { createDeck, shuffleDeck } from './game/deck.js';

const players = [
    { name: "You", hand: [], isBot: false, totalCardsHeld: 0 },
    { name: "LeftBot", hand: [], isBot: true, totalCardsHeld: 0 },
    { name: "TopBot", hand: [], isBot: true, totalCardsHeld: 0 },
    { name: "RightBot", hand: [], isBot: true, totalCardsHeld: 0 }
  ];  

let currentPlayerIndex = 0;
let roundNumber = 1;
let checkCount = 0;
let lastPlayedHand = null;
let lastPlayedType = null;
let lastPlayedBy = null;
let selectedCards = [];
let isFirstGame = true;

const playerHandDiv = document.getElementById('your-cards');
const sortSelect = document.getElementById('sort-method');
const playButton = document.getElementById('play-button');
const checkButton = document.getElementById('check-button');
const tableDiv = document.getElementById('table-cards');
const log = document.getElementById('log-messages');
const startGameButton = document.getElementById('start-game-button');
const gameBoard = document.getElementById('game-board');
const scoreList = document.getElementById('score-list');
const newGameButton = document.getElementById('new-game-button');
const bot1Div = document.getElementById('bot-1');
const bot2Div = document.getElementById('bot-2');
const bot3Div = document.getElementById('bot-3');
const cardBack = document.createElement('div');
cardBack.classList.add('card', 'back');
const stats = JSON.parse(localStorage.getItem('shangStats')) || {
    gamesWon: 0,
    gamesLost: 0,
    handsWon: 0,
    handsLost: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    bestWinStreak: 0,
    bestLossStreak: 0
  };
  const discardPileDiv = document.getElementById('discard-pile');
  

newGameButton.addEventListener('click', () => {
    document.getElementById('win-message').style.display = 'none';
    document.getElementById('lose-message').style.display = 'none';
    players.forEach(p => p.totalCardsHeld = 0);
    updateStatsUI(); // keeps localStorage fresh
    newGameButton.style.display = 'none';
    playButton.disabled = false;
    checkButton.disabled = false;
    sortSelect.disabled = false;

    log.innerHTML = '';
    tableDiv.innerHTML = '';

    restartGame();
  });  
  

  startGameButton.addEventListener('click', () => {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('main-container').style.display = 'flex'; // 👈 SHOW game layout
    document.getElementById('sidebar').style.display = 'flex'; // optional: if needed separately
    gameBoard.style.display = 'block';
    restartGame();
    updateStatsUI();
  });
  
  

const rankOrder = {
  "2": 0, "3": 1, "4": 2, "5": 3, "6": 4, "7": 5,
  "8": 6, "9": 7, "10": 8, "J": 9, "Q": 10, "K": 11, "A": 12
};

const suitOrder = { "♣": 0, "♦": 1, "♥": 2, "♠": 3 };

function restartGame() {
    players.forEach(player => {
        player.totalCardsHeld += player.hand.length;
      });
    const gameOverPlayer = players.find(p => p.totalCardsHeld >= 26);
    if (gameOverPlayer) {
      const lowestScore = Math.min(...players.map(p => p.totalCardsHeld));
      const winners = players.filter(p => p.totalCardsHeld === lowestScore);
      const youWin = winners.some(p => !p.isBot);
  
      if (youWin) {
        document.getElementById('win-message').style.display = 'block';
        stats.gamesWon++;
        stats.currentWinStreak++;
        stats.currentLossStreak = 0;
        if (stats.currentWinStreak > stats.bestWinStreak) {
          stats.bestWinStreak = stats.currentWinStreak;
        }
      } else {
        document.getElementById('lose-message').style.display = 'block';
        stats.gamesLost++;
        stats.currentLossStreak++;
        stats.currentWinStreak = 0;
        if (stats.currentLossStreak > stats.bestLossStreak) {
          stats.bestLossStreak = stats.currentLossStreak;
        }
      }
  
      updateStatsUI();
      playButton.disabled = true;
      checkButton.disabled = true;
      sortSelect.disabled = true;
      newGameButton.style.display = 'inline-block';
      return; // ✅ ONLY RETURN IF GAME OVER
    }
  
    // ✅ If not game over, continue setup for new round
    selectedCards = [];
    roundNumber = 1;
    checkCount = 0;
    lastPlayedHand = null;
    lastPlayedType = null;
    lastPlayedBy = null;
    tableDiv.innerHTML = '';
    log.innerHTML += `<hr><p><strong>New hand begins.</strong></p>`;

    const deck = shuffleDeck(createDeck());
    for (let i = 0; i < players.length; i++) {
      players[i].hand = deck.splice(0, 13);
    }
    if (!players[0].isBot) {
      sortHand('rank');
    }
  
    renderBotHands();
  
    if (isFirstGame) {
        for (let i = 0; i < players.length; i++) {
          if (players[i].hand.some(card => card.rank === "2" && card.suit === "♣")) {
            currentPlayerIndex = i;
            break;
          }
        }
      
        const starter = players[currentPlayerIndex];
        isFirstGame = false; // ✅ Only set this to false here, so it never runs again
      
        if (starter.isBot) {
          setTimeout(() => {
            const twoClubs = starter.hand.find(c => c.rank === "2" && c.suit === "♣");
            let play = null;
            let type = null;
      
            if (twoClubs) {
              const combos = findCombinationsWithTwoClubs(starter.hand);
              if (combos.length > 0) {
                play = combos[0];
                type = detectHandType(play);
              } else {
                play = [twoClubs];
                type = "Single";
              }
      
              logMessage(`${starter.name} starts the game with ${type}: ${play.map(c => c.code).join(', ')}`);
              updateTable(play);
              removeCardsFromHand(starter, play);
              renderBotHands();
              updateScoreboard();
              lastPlayedHand = [...play];
              lastPlayedType = type;
              lastPlayedBy = starter.name;
              roundNumber++;
              checkCount = 0;
              if (starter.hand.length === 0) return restartGame();
              advanceTurn();
            }
          }, 1000);
        } else {
          renderHand();
          logMessage("You go first and must play a hand with 2♣.");
          checkButton.disabled = true;
        }
      
        return;
      }           
  
    const startingPlayer = players[currentPlayerIndex];
    if (startingPlayer.isBot) {
      setTimeout(() => botTakeTurn(startingPlayer), 1000);
    } else {
      renderHand();
      if (players[0].hand.some(c => c.rank === "2" && c.suit === "♣")) {
        logMessage("Your turn! You have the 2♣.");
      } else {
        logMessage("Your turn!");
      }      
      updateScoreboard();
      checkButton.disabled = true;
    }
  
    isFirstGame = false;
  }  


  function renderHand() {
    const hand = players[0].hand;
    playerHandDiv.innerHTML = '';
  
    hand.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.classList.add('card');
  
      const rank = card.rank;
      const suit = card.suit;
      const cardKey = rank + (suit === "♠" ? "S" : suit === "♥" ? "H" : suit === "♦" ? "D" : "C");
  
      const faceCards = ["J", "Q", "K", "A"];
  
      if (faceCards.includes(rank)) {
        cardDiv.innerHTML = `<img src="images/${cardKey}.png" alt="${rank} of ${suit}" style="width:100%; height:100%; object-fit:contain;" />`;
      } else {
        cardDiv.innerHTML = `
          <div class="corner top-left">${rank}${suit}</div>
          <div class="corner bottom-right">${rank}${suit}</div>
        `;
      }
  
      if (suit === '♦' || suit === '♥') {
        cardDiv.classList.add('red');
      }
  
      // ✅ This block must be inside the loop
      if (selectedCards.find(c => c.code === card.code)) {
        cardDiv.classList.add('selected');
      }
  
      cardDiv.addEventListener('click', () => {
        cardDiv.classList.toggle('selected');
        const index = selectedCards.findIndex(c => c.code === card.code);
        if (index > -1) {
          selectedCards.splice(index, 1);
        } else {
          selectedCards.push(card);
        }
      });
  
      cardDiv.setAttribute('draggable', true);
      cardDiv.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.code);
      });
      cardDiv.addEventListener('dragover', (e) => e.preventDefault());
      cardDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedCode = e.dataTransfer.getData('text/plain');
        const fromIndex = hand.findIndex(c => c.code === draggedCode);
        const toIndex = hand.findIndex(c => c.code === card.code);
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          const [movedCard] = hand.splice(fromIndex, 1);
          hand.splice(toIndex, 0, movedCard);
          renderHand();
        }
      });
  
      playerHandDiv.appendChild(cardDiv);
    });
  }
  

function renderBotHands() {
    const botDivs = [
        document.querySelector('#bot-1-hand .bot-hand-inner'),
        document.getElementById('bot-2-hand'),
        document.querySelector('#bot-3-hand .bot-hand-inner')
      ];
          const bots = players.filter(p => p.isBot);
  
    bots.forEach((bot, i) => {
      const botDiv = botDivs[i];
      botDiv.innerHTML = ''; // Clear previous cards
  
      for (let j = 0; j < bot.hand.length; j++) {
        const cardBack = document.createElement('div');
        cardBack.classList.add('card', 'back');
        botDiv.appendChild(cardBack);
      }
    });
  }
  
function sortHand(method) {
  const hand = players[0].hand;
  if (method === 'rank') {
    hand.sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank] || suitOrder[a.suit] - suitOrder[b.suit]);
  } else if (method === 'suit') {
    hand.sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankOrder[a.rank] - rankOrder[b.rank]);
  }
  renderHand();
}

sortSelect.addEventListener('change', (e) => sortHand(e.target.value));
sortHand('rank');

playButton.addEventListener('click', () => {
  if (currentPlayerIndex !== 0) return logMessage("It's not your turn!");
  if (selectedCards.length === 0) return logMessage("No cards selected.");

  const handType = detectHandType(selectedCards);
  if (!handType) return logMessage("Invalid hand. Must be a single, pair, trip, or valid fiver.");

  if (isFirstGame && roundNumber === 1 && !selectedCards.some(c => c.rank === "2" && c.suit === "♣")) {
    return logMessage("The first play of the first game must contain the 2♣.");
  }  

  if (lastPlayedHand && !canBeat(selectedCards, handType, lastPlayedHand, lastPlayedType)) {
    return logMessage(`Your ${handType} does not beat the current ${lastPlayedType}.`);
  }

  logMessage(`You played a ${handType}: ${selectedCards.map(c => c.code).join(', ')}`);
  updateTable(selectedCards);
  removeCardsFromHand(players[0], selectedCards);
  if (players[0].hand.length === 0) {
    logMessage(`${players[0].name} wins the round!`);
    stats.handsWon++; // ✅ ADD
    updateStatsUI();  // ✅ ADD
    logMessage("Starting new round...");
    updateScoreboard();
    currentPlayerIndex = 0;
    return restartGame();
  }
  
   
  lastPlayedHand = [...selectedCards];
  lastPlayedType = handType;
  lastPlayedBy = players[0].name;
  selectedCards = [];
  checkCount = 0;
  renderHand();
  roundNumber++;
  advanceTurn();
});

checkButton.addEventListener('click', () => {
  if (currentPlayerIndex !== 0) return logMessage("It's not your turn!");
  logMessage("You checked.");
  checkCount++;

  if (checkCount >= 3) {
    logMessage("Three checks — table is cleared. " + lastPlayedBy + " starts a new round.");
    clearTable();
    lastPlayedHand = null;
    lastPlayedType = null;
    roundNumber++;
    checkCount = 0;
    currentPlayerIndex = players.findIndex(p => p.name === lastPlayedBy);
  }

  advanceTurn();
});

function advanceTurn() {
  if (!lastPlayedHand) {
    currentPlayerIndex = players.findIndex(p => p.name === lastPlayedBy);
  } else {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  }
  const current = players[currentPlayerIndex];
  if (current.isBot) {
    setTimeout(() => botTakeTurn(current), 1000);
  } else {
    renderHand();
    logMessage("Your turn!");

    if (!lastPlayedHand) {
        checkButton.disabled = true;
      } else {
        checkButton.disabled = false;
      }
  }
}

function findPairs(hand) {
    const rankGroups = {};
    hand.forEach(card => {
      rankGroups[card.rank] = rankGroups[card.rank] || [];
      rankGroups[card.rank].push(card);
    });
    return Object.values(rankGroups).filter(group => group.length >= 2).map(group => group.slice(0, 2));
  }
  
  function findTrips(hand) {
    const rankGroups = {};
    hand.forEach(card => {
      rankGroups[card.rank] = rankGroups[card.rank] || [];
      rankGroups[card.rank].push(card);
    });
    return Object.values(rankGroups).filter(group => group.length >= 3).map(group => group.slice(0, 3));
  }

  function findFivers(hand) {
    const fivers = [];
  
    // Generate all 5-card combinations
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        for (let k = j + 1; k < hand.length; k++) {
          for (let l = k + 1; l < hand.length; l++) {
            for (let m = l + 1; m < hand.length; m++) {
              const combo = [hand[i], hand[j], hand[k], hand[l], hand[m]];
              const type = detectHandType(combo);
              if (type) {
                fivers.push({ cards: combo, type });
              }
            }
          }
        }
      }
    }
  
    return fivers;
  }  

  function findCombinationsWithTwoClubs(hand) {
    const twoClubs = hand.find(c => c.rank === "2" && c.suit === "♣");
    if (!twoClubs) return [];
  
    const result = [];
    for (let r = 1; r <= 5; r++) {
      const combos = getCombinations(hand, r);
      combos.forEach(combo => {
        if (combo.includes(twoClubs) && detectHandType(combo)) {
          result.push(combo);
        }
      });
    }
    return result;
  }
  
  function getCombinations(arr, r) {
    const results = [];
    function combine(start, combo) {
      if (combo.length === r) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    }
    combine(0, []);
    return results;
  }  
  
  function botTakeTurn(bot) {
    const hand = bot.hand;
  
    // 🔁 FORCE: First play of the entire game must include 2♣
    if (isFirstGame && roundNumber === 1 && !lastPlayedHand) {
        const twoClubs = hand.find(c => c.rank === "2" && c.suit === "♣");
        let firstPlay = null;
        let type = null;
        
        if (twoClubs) {
          // Find the *best* combo that includes 2♣, or fallback to single
          const combos = findCombinationsWithTwoClubs(hand);
          if (combos.length > 0) {
            firstPlay = combos[0];
            type = detectHandType(firstPlay);
          } else {
            firstPlay = [twoClubs];
            type = "Single";
          }
        } else {
          // Should never happen, but safe fallback
          firstPlay = [hand[0]];
          type = "Single";
        }        

if (firstPlay) {
        logMessage(`${bot.name} starts the game with ${type}: ${firstPlay.map(c => c.code).join(', ')}`);
        updateTable(firstPlay);
        removeCardsFromHand(bot, firstPlay);
        renderBotHands();
        updateScoreboard();
        if (bot.hand.length === 0) {
          logMessage(`${bot.name} wins the round!`);
          if (bot.name !== "You") {
            stats.handsLost++;
            updateStatsUI();
          }
          logMessage("Starting new round...");
          currentPlayerIndex = players.findIndex(p => p.name === bot.name);
          return restartGame();
        }
        lastPlayedHand = [...firstPlay];
        lastPlayedType = type;
        lastPlayedBy = bot.name;
        roundNumber++;
        checkCount = 0;
        isFirstGame = false;
        return advanceTurn();
      }
    }
  
    // 🔁 STRATEGIC OPENING MOVE
    if (!lastPlayedHand) {
      const sortedHand = [...hand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank] || suitOrder[a.suit] - suitOrder[b.suit]);
      const trips = findTrips(hand);
      const pairs = findPairs(hand);
      const fivers = findFivers(hand);
  
      const leftPlayerIndex = (players.findIndex(p => p.name === bot.name) + 1) % players.length;
      const leftPlayer = players[leftPlayerIndex];
      const leftPlayerHasOneCard = leftPlayer.hand.length === 1;
  
      let combo = null;
      let type = null;
  
      if (leftPlayerHasOneCard) {
        if (trips.length > 0) {
          combo = trips[0];
          type = "Trip";
        } else if (pairs.length > 0) {
          combo = pairs[0];
          type = "Pair";
        } else if (fivers.length > 0) {
          combo = fivers[0].cards;
          type = fivers[0].type;
        } else {
          combo = [sortedHand.find(c => rankOrder[c.rank] >= 10) || sortedHand[sortedHand.length - 1]];
          type = "Single";
        }
      } else {
        if (trips.length > 0) {
          combo = trips[0];
          type = "Trip";
        } else if (pairs.length > 0) {
          combo = pairs[0];
          type = "Pair";
        } else {
          combo = [sortedHand[0]];
          type = "Single";
        }
      }
  
      logMessage(`${bot.name} starts the round with a ${type}: ${combo.map(c => c.code).join(', ')}`);
      updateTable(combo);
      removeCardsFromHand(bot, combo);
      renderBotHands();
      updateScoreboard();
      if (bot.hand.length === 0) {
        logMessage(`${bot.name} wins the round!`);
        if (bot.name !== "You") {
          stats.handsLost++;
          updateStatsUI();
        }
        logMessage("Starting new round...");
        currentPlayerIndex = players.findIndex(p => p.name === bot.name);
        return restartGame();
      }
      lastPlayedHand = [...combo];
      lastPlayedType = type;
      lastPlayedBy = bot.name;
      checkCount = 0;
      return advanceTurn();
    }
  
    // 🔁 RESPONDING TO OTHER PLAYS
    if (lastPlayedType === "Single") {
      const sortedHand = [...hand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank] || suitOrder[a.suit] - suitOrder[b.suit]);
      const beatableCard =
        sortedHand.find(card => !isHighCard(card) && canBeat([card], "Single", lastPlayedHand, "Single")) ||
        sortedHand.find(card => canBeat([card], "Single", lastPlayedHand, "Single"));
      if (beatableCard) {
        logMessage(`${bot.name} plays ${beatableCard.code}`);
        updateTable([beatableCard]);
        removeCardsFromHand(bot, [beatableCard]);
        renderBotHands();
        updateScoreboard();
        if (bot.hand.length === 0) {
          logMessage(`${bot.name} wins the round!`);
          if (bot.name !== "You") {
            stats.handsLost++;
            updateStatsUI();
          }
          logMessage("Starting new round...");
          currentPlayerIndex = players.findIndex(p => p.name === bot.name);
          return restartGame();
        }
        lastPlayedHand = [beatableCard];
        lastPlayedType = "Single";
        lastPlayedBy = bot.name;
        checkCount = 0;
        return advanceTurn();
      }
    }
  
    if (lastPlayedType === "Pair") {
      const botPairs = findPairs(hand);
      const beatablePair = botPairs.find(pair =>
        !pair.some(isHighCard) && canBeat(pair, "Pair", lastPlayedHand, "Pair")
      ) || botPairs.find(pair =>
        canBeat(pair, "Pair", lastPlayedHand, "Pair")
      );
      if (beatablePair) {
        logMessage(`${bot.name} plays pair: ${beatablePair.map(c => c.code).join(', ')}`);
        updateTable(beatablePair);
        removeCardsFromHand(bot, beatablePair);
        renderBotHands();
        updateScoreboard();
        if (bot.hand.length === 0) {
          logMessage(`${bot.name} wins the round!`);
          if (bot.name !== "You") {
            stats.handsLost++;
            updateStatsUI();
          }
          logMessage("Starting new round...");
          currentPlayerIndex = players.findIndex(p => p.name === bot.name);
          return restartGame();
        }
        lastPlayedHand = [...beatablePair];
        lastPlayedType = "Pair";
        lastPlayedBy = bot.name;
        checkCount = 0;
        return advanceTurn();
      }
    }
  
    if (lastPlayedType === "Trip") {
      const botTrips = findTrips(hand);
      const beatableTrip =
        botTrips.find(trip => !trip.some(isHighCard) && canBeat(trip, "Trip", lastPlayedHand, "Trip")) ||
        botTrips.find(trip => canBeat(trip, "Trip", lastPlayedHand, "Trip"));
      if (beatableTrip) {
        logMessage(`${bot.name} plays trip: ${beatableTrip.map(c => c.code).join(', ')}`);
        updateTable(beatableTrip);
        removeCardsFromHand(bot, beatableTrip);
        renderBotHands();
        updateScoreboard();
        if (bot.hand.length === 0) {
          logMessage(`${bot.name} wins the round!`);
          if (bot.name !== "You") {
            stats.handsLost++;
            updateStatsUI();
          }
          logMessage("Starting new round...");
          currentPlayerIndex = players.findIndex(p => p.name === bot.name);
          return restartGame();
        }
        lastPlayedHand = [...beatableTrip];
        lastPlayedType = "Trip";
        lastPlayedBy = bot.name;
        checkCount = 0;
        return advanceTurn();
      }
    }
  
    if (lastPlayedHand.length === 5) {
      const botFivers = findFivers(hand);
      const beatableFiver =
        botFivers.find(f => !f.cards.some(isHighCard) && canBeat(f.cards, f.type, lastPlayedHand, lastPlayedType)) ||
        botFivers.find(f => canBeat(f.cards, f.type, lastPlayedHand, lastPlayedType));
  
      if (beatableFiver) {
        logMessage(`${bot.name} plays ${beatableFiver.type}: ${beatableFiver.cards.map(c => c.code).join(', ')}`);
        updateTable(beatableFiver.cards);
        removeCardsFromHand(bot, beatableFiver.cards);
        renderBotHands();
        updateScoreboard();
        if (bot.hand.length === 0) {
          logMessage(`${bot.name} wins the round!`);
          if (bot.name !== "You") {
            stats.handsLost++;
            updateStatsUI();
          }
          logMessage("Starting new round...");
          currentPlayerIndex = players.findIndex(p => p.name === bot.name);
          return restartGame();
        }
        lastPlayedHand = [...beatableFiver.cards];
        lastPlayedType = beatableFiver.type;
        lastPlayedBy = bot.name;
        checkCount = 0;
        return advanceTurn();
      }
    }
  
    // Bot checks if no valid play
    logMessage(`${bot.name} checked.`);
    checkCount++;
    if (checkCount >= 3) {
      logMessage("Three checks — table is cleared. " + lastPlayedBy + " starts a new round.");
      clearTable();
      lastPlayedHand = null;
      lastPlayedType = null;
      roundNumber++;
      checkCount = 0;
      currentPlayerIndex = players.findIndex(p => p.name === lastPlayedBy);
    }
    advanceTurn();
  }  

function detectHandType(cards) {
  if (cards.length === 1) return "Single";
  if (cards.length === 2 && cards[0].rank === cards[1].rank) return "Pair";
  if (cards.length === 3 && cards.every(c => c.rank === cards[0].rank)) return "Trip";
  if (cards.length !== 5) return null;

  const ranks = cards.map(c => rankOrder[c.rank]).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = ranks.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
  const rankCounts = {};
  cards.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isRoyalFlush = isFlush && ranks.toString() === [8, 9, 10, 11, 12].toString();
  if (isRoyalFlush) return "Royal Flush";
  if (isFlush && isStraight) return "Straight Flush";
  if (counts[0] === 4) return "Quads";
  if (counts[0] === 3 && counts[1] === 2) return "Full House";
  if (isFlush) return "Flush";
  if (isStraight) return "Straight";
  return null;
}

function removeCardsFromHand(player, cardsToRemove) {
  cardsToRemove.forEach(card => {
    const index = player.hand.findIndex(c => c.code === card.code);
    if (index > -1) player.hand.splice(index, 1);
  });
}

function updateTable(cards) {
  tableDiv.innerHTML = '';
  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    const rank = card.rank;
    const suit = card.suit;
    const cardKey = rank + (suit === "♠" ? "S" : suit === "♥" ? "H" : suit === "♦" ? "D" : "C");
    const faceCards = ["J", "Q", "K", "A"];

    if (faceCards.includes(rank)) {
      cardDiv.innerHTML = `<img src="images/${cardKey}.png" alt="${rank} of ${suit}" style="width:100%; height:100%; object-fit:contain;" />`;
    } else {
      cardDiv.innerHTML = `
        <div class="corner top-left">${rank}${suit}</div>
        <div class="corner bottom-right">${rank}${suit}</div>
      `;
    }

    if (suit === '♦' || suit === '♥') {
      cardDiv.classList.add('red');
    }
    tableDiv.appendChild(cardDiv);
  });
}

function clearTable() {
    const tableCards = [...tableDiv.children];
  
    tableCards.forEach(cardDiv => {
      const clone = cardDiv.cloneNode(true);
      const rand = Math.random().toFixed(2); // random float between 0.00 and 1.00
      clone.style.setProperty('--rand', rand); // rotate angle via CSS custom prop
      discardPileDiv.appendChild(clone);
    });
  
    tableDiv.innerHTML = '';
  }  

function logMessage(msg) {
  const p = document.createElement('p');
  p.textContent = msg;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function updateScoreboard() {
    scoreList.innerHTML = '';
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = `${player.name}: ${player.totalCardsHeld} points`;
      scoreList.appendChild(li);
    });
  }
   

function canBeat(newHand, newType, oldHand, oldType) {
  const typeRank = {
    "Single": 1, "Pair": 2, "Trip": 3, "Straight": 4,
    "Flush": 5, "Full House": 6, "Quads": 7,
    "Straight Flush": 8, "Royal Flush": 9
  };
  if (newHand.length !== oldHand.length) return false;
  if (newType !== oldType && newHand.length < 5) return false;
  if (newHand.length === 5) {
    const newRank = typeRank[newType] || 0;
    const oldRank = typeRank[oldType] || 0;
    if (newRank !== oldRank) return newRank > oldRank;
  }
  return compareHighestCard(newHand, oldHand);
}

function compareHighestCard(handA, handB) {
  const sortedA = [...handA].sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank] || suitOrder[b.suit] - suitOrder[a.suit]);
  const sortedB = [...handB].sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank] || suitOrder[b.suit] - suitOrder[a.suit]);
  const topA = sortedA[0];
  const topB = sortedB[0];
  if (rankOrder[topA.rank] > rankOrder[topB.rank]) return true;
  if (rankOrder[topA.rank] < rankOrder[topB.rank]) return false;
  return suitOrder[topA.suit] > suitOrder[topB.suit];
}

function isHighCard(card) {
    return card.rank === "A" || card.rank === "K";
  }
  
  function updateStatsUI() {
    const totalGames = stats.gamesWon + stats.gamesLost;
    const totalHands = stats.handsWon + stats.handsLost;
  
    localStorage.setItem('shangStats', JSON.stringify(stats));
  
    // If you're not displaying the stats in index.html, you can skip updating spans
    // This is only needed if you want live updates on the game page too
  }

  document.getElementById('view-stats-button').addEventListener('click', () => {
    window.location.href = 'stats.html';
  });

  document.getElementById('view-rules-button').addEventListener('click', () => {
    window.location.href = 'rules.html';
  });
  
  
  