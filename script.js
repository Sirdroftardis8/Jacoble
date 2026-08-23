// All solutions for daily challenges
const targetWords = [
"jacob"
];
// All acceptable words
const dictionary = [
"jacob"
];

const keyboard = document.querySelector("[data-keyboard]");
const guessGrid = document.querySelector("[data-guess-grid]");
const alertContainer = document.querySelector("[data-alert-container]");

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const referenceDate = new Date(2022, 0, 1);
const msOffsetFromRefDate = Date.now() - referenceDate;
const dayOffsetFromRefDate = msOffsetFromRefDate / 1000 / 60 / 60 / 24;

// Track the specific game day index
const currentGameNumber = Math.floor(dayOffsetFromRefDate);
const targetWord = targetWords[currentGameNumber % targetWords.length];

// NEW: Track all completed guesses made by the player
const guessesHistory = [];

startInteraction();

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey();
    return;
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey();
    return;
  }

  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length >= WORD_LENGTH) {
    return;
  }
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key;
  nextTile.dataset.state = "active";
}

function deleteKey() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile === null) return;
  lastTile.textContent = "";
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough letters!");
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");
  if (!dictionary.includes(guess)) {
    showAlert("Not in word list");
    shakeTiles(activeTiles);
    return;
  }

  stopInteraction();
  
  // NEW: Save the guess to your history state tracker
  guessesHistory.push(guess);

  activeTiles.forEach((...params) => flipTile(...params, guess));
}

function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter;
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");
      if (targetWord[index] === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if (duration == null) {
    return;
  }
  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}

// NEW: Customized alert that appends an interactive Share button inside the alert system
function showGameOverAlert(message, gameNumber, guesses) {
  const alert = document.createElement("div");
  alert.classList.add("alert", "game-over-alert");
  
  const textNode = document.createElement("span");
  textNode.textContent = message + " ";
  alert.appendChild(textNode);
  
  const shareBtn = document.createElement("button");
  shareBtn.textContent = "📊 Share";
  shareBtn.style.marginLeft = "10px";
  shareBtn.style.cursor = "pointer";
  shareBtn.onclick = () => handleShare(gameNumber, guesses);
  
  alert.appendChild(shareBtn);
  alertContainer.prepend(alert);
}

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    danceTiles(tiles);
    stopInteraction();
    // CHANGED: Use the persistent share alert box instead of a auto-hiding popup
    showGameOverAlert("You Win!!! 🎉", currentGameNumber, guessesHistory);
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    stopInteraction();
    // CHANGED: Use the persistent share alert box for a loss
    showGameOverAlert("Game Over! Word: " + targetWord.toUpperCase(), currentGameNumber, guessesHistory);
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

// NEW: Fully adapted text block parser optimized for your grid system rules
function generateShareText(gameNumber, guesses, maxRows) {
  const lastGuess = guesses[guesses.length - 1];
  const score = lastGuess === targetWord ? guesses.length : 'X';
  let text = `WordleClone #${gameNumber} ${score}/${maxRows}\n\n`;

  guesses.forEach(guess => {
    let line = '';
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === targetWord[i]) {
        line += '🟩';
      } else if (targetWord.includes(guess[i])) {
        line += '🟨';
      } else {
        line += '⬛';
      }
    }
    text += line + '\n';
  });

  return text.trim();
}

async function handleShare(gameNumber, guesses) {
  const shareText = generateShareText(gameNumber, guesses, 6);
  
  // 1. Try mobile/native system sharing sheet first
  if (navigator.share) {
    try {
      await navigator.share({ text: shareText });
      return;
    } catch (err) {
      // Native window closed or blocked; fall through to clipboard copy
    }
  }
  
  // 2. Desktop fallback: Force a visible alert popup window
  try {
    await navigator.clipboard.writeText(shareText);
    alert("📊 Results copied to clipboard!");
  } catch (err) {
    console.error("Clipboard copy failed: ", err);
  }
}

  
  await navigator.clipboard.writeText(shareText);
  showAlert("Copied to clipboard!", 2000);
}
