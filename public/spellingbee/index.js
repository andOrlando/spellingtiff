import { getSpellingBee } from "../api.js"
console.log("doing stuff")

//consts
const TITLES = ["Beginner", "Good Start", "Moving Up", "Good", "Solid", "Nice", "Great", "Amazing", "Genius", "Queen Bee"]
const PERCENTAGES = [0, 2, 5, 8, 15, 25, 40, 50, 70, 100]

//variables
const data = await getSpellingBee().then(a => a.json())
const button_elems = [...document.querySelectorAll(".sbb:not(#center)")]
const center_elem = document.getElementById("center")
const word_elem = document.getElementById("word")
const score_elem = document.getElementById("score")
const found_elem = document.getElementById("found")
const rank_elem = document.getElementById("rank")

const letters = [...data.outerLetters]
let score = 0
let word = ""
const found = []

const total = data.answers.reduce((sum, a) => sum += scoreWord(a), 0)
const breakpoints = PERCENTAGES.map(a => Math.round(a * 0.01 * total))
let rank = 0

//initialize UI
function setLetters(buttons) {
  for (let i=0; i<buttons.length; i++)
    buttons[i].innerHTML = letters[i]
}

function updateRank() { rank_elem.innerText = TITLES[rank] }
function updateScore() { score_elem.innerText = score }
function givePoints(pts) {
  score += pts
  updateScore()

  if (score < breakpoints[rank]) return
  while (score >= breakpoints[rank]) rank++
  updateRank()
}

function makeFoundElem(word) {
  const elem = document.createElement("li")
  elem.innerText = word
  return elem
}
function initFound() {
  for (const word of found)
    found_elem.appendChild(makeFoundElem(word))
}
function findWord(word) {
  found.push(word)
  found_elem.appendChild(makeFoundElem(word))
}


setLetters(button_elems)
center_elem.innerHTML = data.centerLetter
initFound()
updateScore()
updateRank()

//functionality

function addChar(c) {
  
  const elem = document.createElement("span")
  elem.innerText = c
  elem.classList.add("char")
  if (c == data.centerLetter) elem.classList.add("center")
  
  word_elem.appendChild(elem)
  word += c
}
function removeLastChar() {
  if (word.length == 0) return
  word_elem.removeChild(word_elem.children[word_elem.children.length-1])
  word = word.slice(0, -1)
}
function setWord(s) {
  word_elem.innerHTML = ""
  word = "";
  [...s].forEach(addChar)
}
function submit() {
  if (data.answers.includes(word) && !found.includes(word)) {
    givePoints(scoreWord(word))
    findWord(word)
  }
  else {
    console.log("word is bad")
  }

  setWord("")
}

center_elem.addEventListener("click", () => addChar(data.centerLetter))
button_elems.forEach((a, i) => a.addEventListener("click", () => {
  addChar(letters[i])
}))
document.getElementById("shuffle").addEventListener("click", () => {
  shuffle(letters)
  setLetters(button_elems)
})
document.getElementById("backspace").addEventListener("click", removeLastChar)
document.getElementById("clear").addEventListener("click", () => setWord(""))
document.getElementById("submit").addEventListener("click", submit)

//universal keypress listener
document.addEventListener("keydown", e => {
  if (e.code == "Enter") submit()
  if (e.code == "Backspace") removeLastChar()
  if (e.key == data.centerLetter) addChar(data.centerLetter)
  if (letters.includes(e.key)) addChar(e.key)
});




//helper functions
function scoreWord(word) {
  if (word.length == 4) return 1
  if (data.pangrams.includes(word)) return word.length + 7
  return word.length
}

//thanks https://mattomath.wordpress.com/2020/11/16/secrets-of-the-spelling-bee/




function makeCurveFn() {
  return x => Math.floor(total * Math.sqrt(x / 11))
}





function shuffle(arr) {
  for (let i=0; i<arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}


