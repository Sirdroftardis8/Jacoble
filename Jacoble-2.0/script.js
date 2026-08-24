import { WORDS } from "./words.js";

const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let guessHistory = [];

// The authentic target word
let rightGuessString = "jacob";

// Security state and secret passcode
let isRealJacob = false;
const SECRET_JACOB_WORD = "monkey";

// Calculate daily game number (Epoch: August 23, 2026)
const GAME_EPOCH = new Date(2026, 7, 23).getTime();

function getGameNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDifference = Math.floor((today - GAME_EPOCH) / (1000 * 60 * 60 * 24));
  return Math.max(1, dayDifference + 1);
}

const currentGameNumber = getGameNumber();

function setupGate() {
  const gateContainer = document.getElementById("jacob-gate");
  const gateBtn = document.getElementById("gate-btn");
  const nameInput = document.getElementById("gate-name");
  const secretInput = document.getElementById("gate-secret");
  const statusDiv = document.getElementById("gate-status");

  if (!gateBtn || !nameInput || !secretInput) return;

  let promptForPasscode = false;

  const hideGate = () => {
    if (gateContainer) {
      gateContainer.style.display = "none";
    }
  };

  const verifyUser = () => {
    const rawName = nameInput.value.trim();
    const name = rawName.toLowerCase();
    const passcode = secretInput.value.trim().toLowerCase();

    if (!rawName) {
      showToast("Please enter a name");
      return;
    }

    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // Scenario A: User is NOT named Jacob -> Let them in, lock win condition, remove gate
    if (name !== "jacob") {
      isRealJacob = false;
      showToast(`Welcome, ${formattedName}!`);
      hideGate();
      return;
    }

    // Scenario B: User IS named Jacob, step 1 -> Ask for passcode
    if (name === "jacob" && !promptForPasscode) {
      promptForPasscode = true;
      secretInput.style.display = "inline-block";
      secretInput.focus();
      if (statusDiv) {
        statusDiv.textContent = "Confirm identity: Enter passcode";
        statusDiv.style.color = "#d7a15c";
      }
      showToast("Prove it!");
      return;
    }

    // Scenario C: User claims to be Jacob and provided a passcode
    if (name === "jacob" && promptForPasscode) {
      if (passcode === SECRET_JACOB_WORD) {
        isRealJacob = true;
        showToast(`Welcome, ${formattedName}!`);
        hideGate();
      } else {
        isRealJacob = false;
        showToast("Don't lie about being a Jacob!");
        hideGate();
      }
    }
  };

  gateBtn.addEventListener("click", verifyUser);

  // If they change input away from Jacob, hide passcode box
  nameInput.addEventListener("input", () => {
    if (nameInput.value.trim().toLowerCase() !== "jacob") {
      secretInput.style.display = "none";
      promptForPasscode = false;
    }
  });

  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") verifyUser(); });
  secretInput.addEventListener("keydown", (e) => { if (e.key === "Enter") verifyUser(); });
}

function initBoard() {
  let board = document.getElementById("game-board");
  if (!board) return;
  board.innerHTML = "";

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
  if (!row) return;
  let box = row.children[nextLetter - 1];
  if (!box) return;
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
  if (!row) return;
  let box = row.children[nextLetter];
  if (!box) return;
  animateCSS(box, "popIn");
  box.textContent = pressedKey;
  box.classList.add("filled-box");
  currentGuess.push(pressedKey);
  nextLetter += 1;
}

function getUnwinnableTarget(userGuess) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let target = "";
  for (let i = 0; i < 5; i++) {
    let char = alphabet[Math.floor(Math.random() * alphabet.length)];
    while (char === userGuess[i]) {
      char = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    target += char;
  }
  return target;
}

function checkGuess() {
  let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining];
  let guessString = currentGuess.join("");

  if (guessString.length !== 5) {
    showToast("Not enough letters!");
    return;
  }

  if (!WORDS.includes(guessString)) {
    showToast("Word not in list!");
    return;
  }

  let activeTarget = isRealJacob ? rightGuessString : getUnwinnableTarget(guessString);
  let rightGuess = Array.from(activeTarget);

  let letterColor = ["gray", "gray", "gray", "gray", "gray"];

  // First pass: green matches
  for (let i = 0; i < 5; i++) {
    if (rightGuess[i] === guessString[i]) {
      letterColor[i] = "green";
      rightGuess[i] = null;
    }
  }

  // Second pass: yellow matches
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

  guessHistory.push([...letterColor]);

  for (let i = 0; i < 5; i++) {
    let box = row.children[i];
    let delay = 250 * i;
    setTimeout(() => {
      animateCSS(box, "flipInX");
      box.style.backgroundColor = letterColor[i];
      shadeKeyBoard(guessString.charAt(i) + "", letterColor[i]);
    }, delay);
  }

  if (guessString === activeTarget) {
    guessesRemaining = 0;
    setTimeout(() => {
      showToast("Good job, Jacob!" );
      shareResults(true);
    }, 1500);
    return;
  } else {
    guessesRemaining -= 1;
    currentGuess = [];
    nextLetter = 0;

    if (guessesRemaining === 0) {
      setTimeout(() => {
        const revealWord = isRealJacob ? rightGuessString : WORDS[Math.floor(Math.random() * WORDS.length)];
        showToast("Better luck next time!");
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

  const grid = guessHistory
    .map((row) => row.map((color) => emojiMap[color]).join(""))
    .join("\n");

  const shareText = `Jacoble #${currentGameNumber} ${score}/${NUMBER_OF_GUESSES}\n\n${grid}\n\nhttps://jacobrothberg.com/Jacoble-2.0`;

  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.style.display = "block";
    shareBtn.onclick = () => shareResults(isWin);
  }

  if (navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
    try {
      await navigator.share({ text: shareText });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }

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
  const container = document.getElementById("toast-container") || document.body;

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.style.cssText = "position:fixed; top:10%; left:50%; transform:translateX(-50%); background:#fff; color:#000; padding:10px 16px; border-radius:4px; font-weight:bold; z-index:100000; box-shadow:0 4px 12px rgba(0,0,0,0.3); pointer-events:none;";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
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
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
  if (activeTag === "input" || activeTag === "textarea") return;

  if (guessesRemaining === 0) return;

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

const keyboardContainer = document.getElementById("keyboard-cont");
if (keyboardContainer) {
  keyboardContainer.addEventListener("click", (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (activeTag === "input" || activeTag === "textarea") return;

    const target = e.target;
    if (!target.classList.contains("keyboard-button")) return;

    let key = target.textContent;
    if (key === "Del") key = "Backspace";

    document.dispatchEvent(new KeyboardEvent("keyup", { key: key }));
  });
}

function startApp() {
  initBoard();
  setupGate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
