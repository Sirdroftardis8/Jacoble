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
const SECRET_JACOB_WORD = "pizzatime"; // Passcode for true Jacobs

function authenticateUser() {
  const name = prompt("Welcome to Jacoble! Please enter your first name:");
  if (name && name.trim().toLowerCase() === "jacob") {
    const secret = prompt("Hello Jacob. Enter the secret passcode:");
    if (secret && secret.trim().toLowerCase() === SECRET_JACOB_WORD) {
      isRealJacob = true;
      showToast("Access Granted. Welcome, Jacob!");
      return;
    }
  }
  
  isRealJacob = false;
  showToast("Guest Mode Activated.");
}

authenticateUser();

// Calculate daily game number (Epoch: August 23, 2026)
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

// Generates an unwinnable target word dynamically for non-Jacobs
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
      if (rightGuess[j] === guessString
