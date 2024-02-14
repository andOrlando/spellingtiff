import { getSpellingBee } from "../api.js"
console.log("doing stuff")

//consts
//thanks https://mattomath.wordpress.com/2020/11/16/secrets-of-the-spelling-bee/
const TITLES = ["Beginner", "Good Start", "Moving Up", "Good", "Solid", "Nice", "Great", "Amazing", "Genius", "Queen Bee"]
const PERCENTAGES = [0, 2, 5, 8, 15, 25, 40, 50, 70, 100]
const COLORS = ["#99c3f2", "#7db1e8", "#5ea0e6", "#3382d6", "#1965b5", "#16579c", "#194675", "#152e52", "#142040", "#c492fc"]

//variables
const data = await getSpellingBee().then(a => a.json())
console.log(data)
const button_elems = [...document.querySelectorAll(".sbb:not(#center)")]
const center_elem = document.getElementById("center")
const word_elem = document.getElementById("word")
const score_elem = document.getElementById("score")
const found_elem = document.getElementById("found")
const rank_elem = document.getElementById("rank")
const countdown_elem = document.getElementById("countdown")
const totalprogress_elem = document.getElementById("totalprogress")
const stageprogress_elem = document.getElementById("stageprogress")
const scorebox_elem = document.getElementById("scorebox")
const mostrecent_elem = document.getElementById("mostrecent")

const letters = [...data.outerLetters]
let score = 0
let word = ""
const found = []

const total = data.answers.reduce((sum, a) => sum += scoreWord(a), 0)
const breakpoints = PERCENTAGES.map(a => Math.round(a * 0.01 * total))
let rank = 0

//set values with cookies
async function cookie2Found() {
  const stuff = (localStorage.getItem("spellingbee") || "").split(",")
  if (stuff[0] != data.printDate) return localStorage.removeItem("spellingbee")
  stuff.shift()

  await Promise.resolve(r => setTimeout(r, 1000))
  for (const word of stuff) {
    await Promise.resolve(r => setTimeout(r, 300))
    givePoints(scoreWord(word))
    findWord(word)
  }
}
function found2Cookie() {
  localStorage.setItem("spellingbee", data.printDate + "," + found.join(","))
}
cookie2Found()

//initialize UI
const capitalize=w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()
function setLetters(buttons) {
  for (let i=0; i<buttons.length; i++)
    buttons[i].innerHTML = letters[i].toUpperCase()
}

const setProgress=(elem, percent)=>elem.setAttribute("style", `--done: ${percent}; --color: ${COLORS[rank]}`)
setProgress(totalprogress_elem, 0)
setProgress(stageprogress_elem, 0)
function updateRank() { rank_elem.innerText = TITLES[rank] }
function updateScore() { score_elem.innerText = score }
function scoreboxToast(pts) {
  const elem = document.createElement("span")
  elem.innerText = `+${pts}!` 
  elem.style.left = `${score_elem.offsetWidth + 4 + Math.random() * 4}px`
  elem.style.bottom = `${Math.random() * 8 - 6}px`
  elem.classList.add("points")
  scorebox_elem.appendChild(elem)
  requestAnimationFrame(() => {
    elem.classList.add("die")
  })
  setTimeout(() => elem.classList.add("diedie"), 900)
  setTimeout(() => elem.remove(), 1000)
}
function givePoints(pts) {
  score += pts
  updateScore()
  scoreboxToast(pts)

  if (score < breakpoints[rank]) {
    const last = rank ? breakpoints[rank-1] : 0
    setProgress(stageprogress_elem, (score-last)/(breakpoints[rank]-last))
    return
  }
  while (score >= breakpoints[rank]) rank++
  setProgress(stageprogress_elem, (score-breakpoints[rank-1])/(breakpoints[rank]-breakpoints[rank-1]))
  setProgress(totalprogress_elem, rank / (TITLES.length-1))
  stageprogress_elem.style.background = 
  updateRank()
}

function makeFoundElem(word) {
  const elem = document.createElement("div")
  elem.innerText = word
  return elem
}
function initFound() {
  for (const word of found)
    found_elem.appendChild(makeFoundElem(word))
}
function findWord(word, cookie=true) {
  found.push(word)
  found_elem.appendChild(makeFoundElem(capitalize(word)))
  mostrecent_elem.innerText = capitalize(word)

  if (cookie) found2Cookie()
}


setLetters(button_elems)
center_elem.innerHTML = data.centerLetter.toUpperCase()
initFound()
updateScore()
updateRank()

//functionality

function addChar(c) {

  // if word is currently empty remove placeholder
  if (word == "") word_elem.querySelector(".placeholder").remove()
  
  const elem = document.createElement("span")
  elem.innerText = c.toUpperCase()
  elem.classList.add("char")
  if (c == data.centerLetter) elem.classList.add("center")
  
  word_elem.appendChild(elem)
  word += c
}
function putPlaceholder() { 
    const elem = document.createElement("span")
    elem.innerText = "WORD"
    elem.classList.add("placeholder")
    word_elem.appendChild(elem)
}
putPlaceholder()
function removeLastChar() {
  if (word.length == 0) return
  //otherwise just remove last like normal
  word_elem.removeChild(word_elem.children[word_elem.children.length-1])
  word = word.slice(0, -1)

  if (word == "") putPlaceholder()
}
function setWord(s) {
  word_elem.innerHTML = ""
  word = "";
  [...s].forEach(addChar)
}
function addTempAttr(elem, name, timeout) {
  elem.setAttribute(name, (elem.getAttribute(name) || 0) + 1)
  setTimeout(() => {
    const count = elem.getAttribute(name) || 0
    if (count <= 1) elem.removeAttribute(name)
    else elem.setAttribute(name, count-1)
  }, timeout)
}

function submit() {
  if (data.answers.includes(word) && !found.includes(word)) {
    givePoints(scoreWord(word))
    findWord(word)
    addTempAttr(word_elem, "good", 600)
  }
  else {
    addTempAttr(word_elem, "bad", 600)
  }

  setWord("")
  putPlaceholder()
}

center_elem.addEventListener("click", () => addChar(data.centerLetter))
button_elems.forEach((a, i) => a.addEventListener("click", () => {
  addChar(letters[i])
}))
document.getElementById("shuffle").addEventListener("click", () => {
  shuffle(letters)
  setLetters(button_elems)
})
document.getElementById("delete").addEventListener("click", removeLastChar)
document.getElementById("enter").addEventListener("click", submit)
let rotation = 0;
document.getElementById("dropdown").addEventListener("click", () => {
    document.getElementById("arrow").style.transform = `rotate(${rotation += 180}deg)`
    document.getElementById("found").classList.toggle("show")
})

//universal keypress listener
document.addEventListener("keydown", e => {
  if (e.code == "Enter") submit()
  if (e.code == "Backspace") removeLastChar()
  if (e.key == data.centerLetter) addChar(data.centerLetter)
  if (letters.includes(e.key)) addChar(e.key)
});

let date = new Date(Date.parse(data.printDate))
date.setHours(date.getHours() - 4) //into EST
date.setTime(date.getTime() - Date.now() + 5 * 60 * 60 * 1000) //make readable

function updateCountdown() {
  date.setSeconds(date.getSeconds() - 1)
  countdown_elem.innerText = date.toTimeString().split(" ")[0]
  setTimeout(updateCountdown, 1000)
}
updateCountdown()




//helper functions
function scoreWord(word) {
  if (word.length == 4) return 1
  if (data.pangrams.includes(word)) return word.length + 7
  return word.length
}

function shuffle(arr) {
  for (let i=0; i<arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}


