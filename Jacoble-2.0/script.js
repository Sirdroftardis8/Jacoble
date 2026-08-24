import { WORDS } from "./words.js";

const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let guessHistory = [];

// The authentic target word
let rightGuessString = "jacob";

// Jacob Verification Security State
let isRealJacob = false;
const SECRET_JACOB_WORD = "pizzatime";

// Calculate daily game number (Epoch: August 23, 2026)
const GAME_EPOCH = new Date(2026, 7, 23).getTime();

function getGameNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDifference = Math.floor((today - GAME_EPOCH) / (1000 * 60 * 60 * 24));
  return Math.max(1, dayDifference + 1);
}

const currentGameNumber = getGameNumber();

function createAuthModal() {
  // Remove existing modal if one already exists
  const existingModal = document.getElementById("auth-modal-backdrop");
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div id="auth-modal-backdrop" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999999; font-family:sans-serif;">
      <div style="background:#121213; border:1px solid #3a3a3c; padding:24px; border-radius:12px; text-align:center; max-width:320px; width:90%; color:#fff; box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <h2 style="margin-top:0; font-size:22px; margin-bottom:8px;">Welcome to Jacoble</h2>
        <p style="font-size:14px; color:#ccc; margin-bottom:16px;">Please verify your identity to proceed.</p>
        <input id="auth-name-input" type="text" placeholder="First Name" style="width:100%; padding:12px; margin-bottom:10px; box-sizing:border-box; border-radius:6px; border:1px solid #3a3a3c; background:#1e1e1f; color:#fff; font-size:16px; outline:none;">
        <input id="auth-secret-input" type="password" placeholder="Passcode (Optional)" style="width:100%; padding:12px; margin-bottom:16px; box-sizing:border-box; border-radius:6px; border:1px solid #3a3a3c; background:#1e1e1f; color:#fff; font-size:16px; outline:none;">
        <button id="auth-submit-btn" style="width:100%; padding:12px; border:none; background:#538d4e; color:#fff; font-weight:bold; border-radius:6px; font-size:16px; cursor:pointer;">Start Playing</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const submitAuth = () => {
    const name = (document.getElementById("auth-name-input")?.value || "").trim().toLowerCase();
    const secret = (document.getElementById("auth-secret-input")?.value || "").trim().toLowerCase();

    if (name === "jacob" && secret === SECRET_JACOB_WORD) {
      isRealJacob = true;
      showToast("Access Granted. Welcome, Jacob!");
    } else {
      isRealJacob = false;
      showToast("Guest Mode Activated.");
    }

    const backdrop = document.getElementById("auth-modal-backdrop");
    if (backdrop) backdrop.remove();
  };

  document.getElementById("auth-submit-btn").onclick = submitAuth;

  // Handle 'Enter' key inside inputs
  const nameInput = document.getElementById("auth-name-input");
  const secretInput = document.getElementById("auth-secret-input");

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth();
  });
  secretInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth();
  });

  // Auto-focus first input field
  setTimeout(() => nameInput.focus(), 100);
}

function initBoard() {
  let board = document.getElementById("game-board");
  if (!board) return;
  board.innerHTML = ""; // Clear existing grid if any

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
        const revealWord = isRealJacob ? rightGuessString : WORDS[Math.floor(Math.random() * WORDS.length)];
        showToast(`The right word was: "${revealWord}"`);
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

  const shareText = `Jacoble #${currentGameNumber} ${score}/${NUMBER_OF_GUESSES}\n\n${grid}\n\nhttps://jacobrothberg.com/Jacob-2.0`;

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
  if (document.getElementById("auth-modal-backdrop")) return;
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
    if (document.getElementById("auth-modal-backdrop")) return;

    const target = e.target;
    if (!target.classList.contains("keyboard-button")) return;

    let key = target.textContent;
    if (key === "Del") key = "Backspace";

    document.dispatchEvent(new KeyboardEvent("keyup", { key: key }));
  });
}

// Immediate + Safe DOM Load Handler
function startApp() {
  initBoard();
  createAuthModal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
