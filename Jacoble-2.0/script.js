import { WORDS } from "./words.js";

const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let guessHistory = [];

// The target word NEVER changes
const rightGuessString = "jacob";

// Calculate daily game number with Epoch = August 23, 2026
// Month index in JS Date constructor is 0-indexed (7 = August)
const GAME_EPOCH = new Date(2026, 7, 23).getTime();

function getGameNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDifference = Math.floor((today - GAME_EPOCH) / (1000 * 60 * 60 * 24));
  return Math.max(1, dayDifference + 1);
}

const currentGameNumber = getGameNumber();

function initBoard() {
  let board = document.getElementById("game-board");

  for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
    let row = document.createElement("div");
    row.className = "letter-row";

    for (let j = 0; j < 5; j++) {
      let box = document.createElement("div");
      box.className = "letter-box";
      row.appendChild(box);
    }

    board.appendChild(row);
  }
}

function shadeKeyBoard(letter, color) {
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    if (elem.textContent === letter) {
      let oldColor = elem.style.backgroundColor;
      if (oldColor === "green") {
        return;
      }

      if (oldColor === "yellow" && color !== "green") {
        return;
      }

      elem.style.backgroundColor = color;
      break;
    }
  }
}

function deleteLetter() {
  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
  let box = row.children[nextLetter - 1];
  box.textContent = "";
  box.classList.remove("filled-box");
  currentGuess.pop();
  nextLetter -= 1;
}

function insertLetter(pressedKey) {
  if (nextLetter === 5) {
    return;
  }
  pressedKey = pressedKey.toLowerCase();

  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
  let box = row.children[nextLetter];
  animateCSS(box, "popIn");
  box.textContent = pressedKey;
  box.classList.add("filled-box");
  currentGuess.push(pressedKey);
  nextLetter += 1;
}

function checkGuess() {
  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
  let guessString = currentGuess.join("");
  let rightGuess = Array.from(rightGuessString);

  if (guessString.length !== 5) {
    showToast("Not enough letters!");
    return;
  }

  if (!WORDS.includes(guessString)) {
    showToast("Word not in list!");
    return;
  }

  let letterColor = ["gray", "gray", "gray", "gray", "gray"];

  // First pass: find exact green matches
  for (let i = 0; i < 5; i++) {
    if (rightGuess[i] === guessString[i]) {
      letterColor[i] = "green";
      rightGuess[i] = null;
    }
  }

  // Second pass: find yellow matches
  for (let i = 0; i < 5; i++) {
    if (letterColor[i] === "green") continue;

    for (let j = 0; j < 5; j++) {
      if (rightGuess[j] === guessString[i]) {
        letterColor[i] = "yellow";
        rightGuess[j] = null;
        break;
      }
    }
  }

  // Push guess colors to history FIRST before checking game completion
  guessHistory.push([...letterColor]);

  // Animate row tiles
  for (let i = 0; i < 5; i++) {
    let box = row.children[i];
    let delay = 250 * i;
    setTimeout(() => {
      animateCSS(box, "flipInX");
      box.style.backgroundColor = letterColor[i];
      shadeKeyBoard(guessString.charAt(i) + "", letterColor[i]);
    }, delay);
  }

  // Check win condition
  if (guessString === rightGuessString) {
    guessesRemaining = 0;
    setTimeout(() => {
      showToast("You guessed right! Game over!");
      shareResults(true);
    }, 1500);
    return;
  } else {
    guessesRemaining -= 1;
    currentGuess = [];
    nextLetter = 0;

    if (guessesRemaining === 0) {
      setTimeout(() => {
        showToast("You've run out of guesses! Game over!");
        showToast(`The right word was: "${rightGuessString}"`);
        shareResults(false);
      }, 1500);
    }
  }
}

async function shareResults(isWin) {
  const emojiMap = {
    green: "🟩",
    yellow: "🟨",
    gray: "⬛"
  };

  const score = isWin ? guessHistory.length : "X";

  // Build emoji grid
  const grid = guessHistory
    .map((row) => row.map((color) => emojiMap[color]).join(""))
    .join("\n");

  // Construct final share string with game number and link strictly at bottom
  const shareText = `Jacoble #${currentGameNumber} ${score}/${NUMBER_OF_GUESSES}\n\n${grid}\n\nhttps://jacobrothberg.com`;

  // Display and hook up share button
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.style.display = "block";
    shareBtn.onclick = () => shareResults(isWin);
  }

  // Mobile Web Share API
  if (navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
    try {
      await navigator.share({ text: shareText });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }

  // Fallback Clipboard API
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareText);
      showToast("Copied results to clipboard!");
    } catch (err) {
      showToast("Failed to copy results.");
    }
  }
}

function showToast(message) {
  // Utility toast function implementation or custom alert fallback
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = "toast-message";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

const animateCSS = (element, animation, prefix = "animate__") =>
  new Promise((resolve) => {
    const animationName = `${prefix}${animation}`;

    element.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      element.classList.remove(`${prefix}animated`, animationName);
      resolve("Animation ended");
    }

    element.addEventListener("animationend", handleAnimationEnd, { once: true });
  });

document.addEventListener("keyup", (e) => {
  if (guessesRemaining === 0) {
    return;
  }

  let pressedKey = String(e.key);
  if (pressedKey === "Backspace" && nextLetter !== 0) {
    deleteLetter();
    return;
  }

  if (pressedKey === "Enter") {
    checkGuess();
    return;
  }

  let found = pressedKey.match(/[a-z]/i);
  if (!found || found[0].length !== 1) {
    return;
  } else {
    insertLetter(pressedKey);
  }
});

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
  const target = e.target;

  if (!target.classList.contains("keyboard-button")) {
    return;
  }
  let key = target.textContent;

  if (key === "Del") {
    key = "Backspace";
  }

  document.dispatchEvent(new KeyboardEvent("keyup", { key: key }));
});

initBoard();
