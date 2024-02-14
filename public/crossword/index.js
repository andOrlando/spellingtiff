
import { getCrossword } from "../api.js"


//variables
const all = await getCrossword().then(a => a.json())
const data = all.body[0]
console.log(all)

const countdown_elem = document.getElementById("countdown")
const board_elem = document.getElementById("board")
const across_elem = document.getElementById("across")
const down_elem = document.getElementById("down")
const rebus_elem = document.getElementById("rebus")
const clue_elem = document.getElementById("clue")

//init
const [WIDTH, HEIGHT] = [data.dimensions.width, data.dimensions.height]
const SIZES = data.SVG.children[1].children
const guesses = new Array(WIDTH*HEIGHT).fill(undefined)

//reverse index for clues
const RI_across = new Array(WIDTH*HEIGHT).fill(undefined)
const RI_down = new Array(WIDTH*HEIGHT).fill(undefined)

data.clues.forEach(({ cells, direction }, i) => {
  const ri = direction == "Across" ? RI_across : RI_down
  cells.forEach(b => ri[b] = i)
})

board_elem.innerHTML = data.board
const applyOverlay=()=>all.assets.forEach(({ uri }) => {
  board_elem.querySelector("svg").innerHTML +=
    `<image xlink:href="${uri}" width="100%" height="100%" style="pointer-events: none"></image>`
})

if ((!data.overlays || !data.overlays.afterSolve) && all.assets) applyOverlay()

const cell_elems = [...document.querySelectorAll(".cells g")]

let down = 0
let selected = undefined
let clues = [RI_across, RI_down] //for down indexing
const clue_elems = []
let rebussing = false

let ismobile = false;
(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) ismobile = true;})(navigator.userAgent||navigator.vendor||window.opera);


//cookies
const strstate = {
  NONE: 0,
  CORRECT: 1,
  INCORRECT: 2
}
const cookie = localStorage.getItem("guesses")
function cookie2Guesses(cookie) {
  const stuff = cookie.split(" ")
  if (stuff[0] != all.publicationDate) return localStorage.setItem("guesses", undefined)
  
  for (const [i, guess] of stuff.entries()) {
    if (!i || !guess) continue
    switch (parseInt(guess.substr(0, 1))) {
      case strstate.CORRECT:
        cell_elems[i-1].classList.add("correct")
        break
      case strstate.INCORRECT:
        cell_elems[i-1].classList.add("incorrect")
        break
    }
    putStr(i-1, guess.substr(1), true)
  }
}
if (cookie) cookie2Guesses(cookie)

function guesses2Cookie() {
  return all.publicationDate + " " + guesses.map((a, i) => {
    if (!a) return ""
    if (cell_elems[i].classList.contains("correct")) return strstate.CORRECT + a
    if (cell_elems[i].classList.contains("incorrect")) return strstate.INCORRECT + a
    return strstate.NONE + a
  }).join(" ")
}



//UI init
function makeClueElem({ label, text, cells, direction }) {
  const elem = document.createElement("div")
  elem.innerText = `${label}. ${text[0].plain}`
  elem.addEventListener("click", () => updateDS((direction=="Down")|0, cells[0]))
  return elem
}
const gamestate = {
  UNFINISHED: 0,
  FINISHED: 1,
  WON: 2,
}
function checkGameState() {
  let done = true
  let win = true
  for (const [{ answer }, i] of data.cells.filter(c => c.answer != undefined).entries()) {
    if (!guesses[i]) {
      done = false
      break
    }

    if (guesses[i] != answer) win = false
  }
  if (done && win) return gamestate.WON
  else if (done) return gamestate.FINISHED
  return gamestate.UNFINISHED
}

function putStr(i, str, forcookies=false) {
  if (i == undefined) return
  if (cell_elems[i].classList.contains("correct")) return
  cell_elems[i].classList.remove("incorrect")
  guesses[i] = str ? str.toUpperCase() : str

  const text = cell_elems[i].querySelector(".guess")
  text.innerHTML = (str || "").toUpperCase()

  //do size fixin
  const font_size = parseFloat(SIZES[i].children
    .findLast(({ name }) => name == "text").attributes
    .find(({ name }) => name == "font-size").value)

  const width = parseFloat(SIZES[i].children
    .find(({ name }) => name == "rect").attributes
    .find(({ name }) => name == "width").value)

  text.setAttribute("font-size", font_size)
  const realwidth = text.getBoundingClientRect().width
  if (realwidth >= width) text.setAttribute("font-size", text.getAttribute("font-size") / realwidth * width)

  //if this is for cookies we can stop here
  if (forcookies) return

  //upate cookies
  localStorage.setItem("guesses", guesses2Cookie())
  
  //game end check
  switch (checkGameState()) {
    case gamestate.WON:
      console.log("you won!")
      break
    case gamestate.FINISHED:
      console.log("loser!")
      break
  }

}

if (!ismobile) data.clues.forEach(c => {
  const { direction } = c
  const clue_elem = makeClueElem(c)
  if (direction == "Down") down_elem.appendChild(clue_elem)
  else across_elem.appendChild(clue_elem)
  clue_elems.push(clue_elem)
})


//do date things
const date = new Date(Date.parse(all.publicationDate))
date.setHours(date.getHours() + 27)
if (!date.getUTCDay()) date.setHours(date.getHours() - 4)

//make readable
date.setTime(date.getTime() - Date.now() + 5 * 60 * 60 * 1000)

function updateCountdown() {
  date.setSeconds(date.getSeconds() - 1)
  countdown_elem.innerText = date.toTimeString().split(" ")[0]
  setTimeout(updateCountdown, 1000)
}
updateCountdown()
  

//keyboard things
//TODO: this should probably be in a seperate file or smth


let key_state = 0
const KEY_STATES = [
  [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["123", "z", "x", "c", "v", "b", "n", "m"]
  ],
  [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""],
    ["#+=", ".", ",", "?", "!", "'"]
  ],
  [
    ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
    ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
    ["abc", ".", ",", "?", "!", "''"]
  ]
]
const key_elems = [
  document.querySelectorAll("#row1 > div"),
  document.querySelectorAll("#row2 > div"),
  document.querySelectorAll("#row3 > div")
]
const key_button_elems = [
  document.querySelectorAll("#row1 > div button"),
  document.querySelectorAll("#row2 > div button"),
  document.querySelectorAll("#row3 > div button")
]
const key_hint_elems = [
  document.querySelectorAll("#row1 > div > div"),
  document.querySelectorAll("#row2 > div > div"),
  document.querySelectorAll("#row3 > div > div")
]
const switch_elem = document.getElementById("switch")

function setKeyState(s) {
  key_state = s
  for (let row=0; row<3; row++) {
    for (let i=0; i<key_elems[row].length; i++) {

      if (row == 2 && i == 8) continue // backspace
      if (i >= KEY_STATES[s][row].length) { key_elems[row][i].classList.add("hide"); continue }
      key_elems[row][i].classList.remove("hide")
      
      key_elems[row][i].children[0].innerText = KEY_STATES[s][row][i]
      if (row != 2 || i != 0) key_elems[row][i].children[1].innerText = KEY_STATES[s][row][i]
    }
  }
}
if (ismobile) { document.getElementById("keyboard").classList.remove("hide"); setKeyState(0) }
document.getElementById("nextclue").addEventListener("click", ()=>nextClueBetter())
document.getElementById("prevclue").addEventListener("click", ()=>prevClueBetter())

const mkKeyDivFn=prop=>(i,j)=>{
  key_elems[i][j].children[0].classList[prop]("hover")
  if (i != 2 || j != 0) key_elems[i][j].children[1].classList[prop]("popup")
}
const keyDivUp=mkKeyDivFn("remove")
const keyDivDown=mkKeyDivFn("add")

console.log(key_elems)

key_elems.forEach((row, i) => row.forEach((button, j) => {
  button.addEventListener("touchstart", () => {

    //switch key
    if (i == 2 && j == 0) { setKeyState((key_state + 1) % 3) }
      
    //backspace
    else if (i == 2 && j == KEY_STATES[key_state][2].length) {

      if (rebussing && guesses[selected]) return putStr(selected, guesses[selected].substring(0, guesses[selected].length-1))

      if (!guesses[selected]) moveBackward() //moveBackward does literally just do moveBackward
      putStr(selected, undefined)

    //otherwise
    } else {

      if (rebussing) return putStr(selected, (guesses[selected]||"")+KEY_STATES[key_state][i][j])

      putStr(selected, KEY_STATES[key_state][i][j])
      moveForwardBetter()
      
    }
  })
  button.addEventListener("touchstart", ()=>keyDivDown(i,j))
  button.addEventListener("touchend", ()=>keyDivUp(i,j))
  button.addEventListener("touchcancel", ()=>keyDivUp(i,j))
}))

switch_elem.addEventListener("click", () => {
  
})
document.getElementById("backspace")

//functionality
const mkSelectClue=prop=>(down, selected)=>{
  const clue_elem = clue_elems[clues[down][selected]]
  clue_elem.classList[prop]("selected")
  if (prop == "add") clue_elem.scrollIntoView({ behavior: "smooth", block: "center" })
}
const select_clue=mkSelectClue("add")
const unselect_clue=mkSelectClue("remove")

const mkHighlight=prop=>(down, selected, incsel=true)=>{
  const clue = data.clues[clues[down][selected]]
  
  clue.cells.forEach(i=>cell_elems[i].classList[prop](i==selected?(incsel?"selected":undefined):"word"))
  if (clue.relatives) clue.relatives.forEach(r=>data.clues[r].cells.forEach(i=>cell_elems[i].classList[prop]("referenced")))
}
const highlight_full=mkHighlight("add")
const unhighlight_full=mkHighlight("remove")

rebus_elem.addEventListener("keydown", e => {
  if (e.key == "Enter") { rebus(false) }
  if (e.key == "Tab") e.preventDefault()
})
rebus_elem.addEventListener("input", ()=>putStr(selected, rebus_elem.value))
/**
 * sets whether it's rebussing or not to value of on
 * @param {boolean} on - true means rebussing, false means not
 */
function rebus(on) {
  rebussing = on

  //for mobile we don't actually need an input box
  if (ismobile && on) return
  else if (ismobile) return moveForward()

  rebus_elem.classList[on ? "add" : "remove"]("hide")
  rebus_elem.value = on ? guesses[selected] || "" : ""
  if (on) rebus_elem.focus()
  else if (guesses[selected]) moveForward()
}

function updateDS(_down, _selected) {


  //if literally anything changes, unrebus
  if (rebussing) rebus(false)

  // if selected doesn't exist just highlight simple
  if (selected == undefined) {
    highlight_full(_down, _selected)
    if (!ismobile) select_clue(_down, _selected)
    else clue_elem.innerText = data.clues[clues[_down][_selected]].text[0].plain
  }
  
  // if it's a different word
  else if (_down != down || clues[down][_selected] != clues[down][selected]) {
    //total wipe and rewrite
    unhighlight_full(down, selected)
    highlight_full(_down, _selected)

    //reselect clue
    if (!ismobile) {
      unselect_clue(down, selected)
      select_clue(_down, _selected)
    }

    else clue_elem.innerText = data.clues[clues[_down][_selected]].text[0].plain
  }

  // if selected is constant (we know down is not)
  else if (_selected == selected)  {
    //wipe everything but selected
    unhighlight_full(down, selected, false)
    highlight_full(_down, selected, false)

    //reselect clue
    if (!ismobile) {
      unselect_clue(down, selected)
      select_clue(_down, selected)
    }

    else clue_elem.innerText = data.clues[clues[_down][_selected]].text[0].plain
  }

  //if its within the same word (we know down is the same I think?)
  else {
    cell_elems[selected].classList.remove("selected")
    cell_elems[selected].classList.add("word")
    cell_elems[_selected].classList.remove("word")
    cell_elems[_selected].classList.add("selected")
  }

  down = _down
  selected = _selected
}

cell_elems.forEach((a, i) => a.addEventListener("click", () => {

  // if we click on black do nothing
  if (data.cells[i].type == undefined) { null }

  // if we're currently selected, flip
  else if (selected == i) { updateDS(down ^ 1, selected) }

  //otherwise just reselect and keep down state
  else { updateDS(down, i) }
}))

//universal thingy listener
if (!ismobile) document.addEventListener("keydown", e => {

  //if rebussing, ignore
  if (rebussing) return
  
  //if nothing's selected die
  if (selected == undefined) return
  
  //if its a character put the character and move forward

  if (e.key.match(/^[a-zA-Z0-9\-\/:;()$^@\\.,?!'[\]{}#%^*+=_|~<>€£¥•"]$/)) {
    putStr(selected, e.key)
    moveForwardClipped()
  }

  //backspace
  if (e.code == "Backspace") {
    
    if (!guesses[selected]) moveBackwardClipped()
    putStr(selected, undefined)
  }

  //down matches
  if (((e.code == "ArrowRight" || e.code == "ArrowLeft") && down)
    || ((e.code == "ArrowUp" || e.code == "ArrowDown") && !down))

    updateDS(down ^ 1, selected)

  //down does not match
  else {
    if (e.code == "ArrowRight" || e.code == "ArrowDown") moveForward()
    if (e.code == "ArrowLeft" || e.code == "ArrowUp") moveBackward()
  }

  if (e.code == "Tab" && e.shiftKey) prevClueBetter()
  else if (e.code == "Tab") nextClueBetter()

  if (["Backspace", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Tab"].includes(e.code))
    e.preventDefault()
})


function checkCell(i) {
  if (!data.cells[i].answer) return
  if (guesses[i] == data.cells[i].answer) cell_elems[i].classList.add("correct")
  else cell_elems[i].classList.add("incorrect")
}
function revealCell(i) {
  if (!data.cells[i].answer) return
  putStr(i, data.cells[i].answer)
  cell_elems[i].classList.add("correct")
}

document.getElementById("checkword").addEventListener("click", ()=>word(down, selected).forEach(checkCell))
document.getElementById("checkpuzzle").addEventListener("click", ()=>{for (let i=0; i<WIDTH*HEIGHT; i++) checkCell(i)})
document.getElementById("revealword").addEventListener("click", ()=>word(down, selected).forEach(revealCell))
document.getElementById("revealpuzzle").addEventListener("click", ()=>{for (let i=0; i<WIDTH*HEIGHT; i++) revealCell(i)})
document.getElementById("rebusbtn").addEventListener("click", () => rebus(!rebussing))


//helper methods
//get word as list of indices
function word(down, selected) {
  return data.clues[clues[down][selected]].cells
}

//used for backspace on mobile
const moveForward=()=>updateDS(...moveNOUPDATE(down, selected, true, false))
const moveBackward=()=>updateDS(...moveNOUPDATE(down, selected, false, false))
//used for letters and backspace on web
const moveForwardClipped=()=>updateDS(...moveNOUPDATE(down, selected, true, true))
const moveBackwardClipped=()=>updateDS(...moveNOUPDATE(down, selected, false, true))

/**
 * Given a down and selected, return the down and selected of the next or previous tile
 * @param {boolean} next - true means forwards, false means backwards
 * @param {boolean} clip - whether or not to advance to the next clue when at an extreme
 */
function moveNOUPDATE(down, selected, next, clip) {
  const dir = next ? 1 : -1
  if (selected == undefined) return
  //get current word
  const w = word(down, selected)

  //if it's not the last one, just go to the next index
  if (next ? selected != w[w.length-1] : selected != w[0]) {
    return [down, selected + (down ? WIDTH : 1) * dir]
  }

  // if we're clipping it to the word, don't advance
  if (clip) return [down, selected]
    
  //if it is the last one we gotta increment the current clue
  const new_clue = data.clues[(clues[down][selected] + dir + data.clues.length) % data.clues.length]
  return [(new_clue.direction == "Down")|0, next ? new_clue.cells[0] : new_clue.cells[new_clue.cells.length-1]]
}


/**
 * Creates a fucntion that will, given a selected and down, move to the
 * next available open space.
 */
function moveBetterNOUPDATE(down, selected, next) {
  const gs = checkGameState();
  let [d,s] = moveNOUPDATE(down, selected, next)
  const w = word(down, selected)

  // if we're filled or if the next is empty, move normally
  if (gs == gamestate.FINISHED || gs == gamestate.WON || (!guesses[s] && w.includes(s)))
    return [d,s]

  //set selected to start before trying to moveNOUPDATE
  selected = w[0];
  
  while (guesses[selected]) [down, selected] = moveNOUPDATE(down, selected, next)
  return [down, selected]
}
//used for letters on mobile
const moveForwardBetter=()=>updateDS(...moveBetterNOUPDATE(down, selected, true))
// const moveBackwardBetter=()=>updateDS(...moveBetterNOUPDATE(down, selected, false))

/**
 * Given a down and selected, return the down and selected of the next or previous clue
 * @param {boolean} next - true means next clue, false means previous clue
 */
function clueNOUPDATE(down, selected, next) {
    const new_clue = data.clues[(clues[down][selected] + (next ? 1 : -1) + data.clues.length) % data.clues.length]
    return [(new_clue.direction == "Down")|0, new_clue.cells[0]]
}

/**
 * Creates function that will go to the next/prev unfilled clue and then the first unfilled cell
 * @param {boolean} next - true will go to next unfilled clue, false will go to prev unfilled clue
 */
function clueBetterNOUPDATE(down, selected, next) {
  const gs = checkGameState();
  [down, selected] = clueNOUPDATE(down, selected, next)
  if (gs == gamestate.FINISHED || gs == gamestate.WON) return updateDS(down, selected)

  while (word(down, selected).every(a => guesses[a])) [down, selected] = clueNOUPDATE(down, selected, next)

  //afterwards if the first char is selected, movebetter
  if (guesses[selected]) [down, selected] = moveBetterNOUPDATE(down, selected, true)
  return [down, selected]
}
//used for mobile
const nextClueBetter=()=>updateDS(...clueBetterNOUPDATE(down, selected, true))
const prevClueBetter=()=>updateDS(...clueBetterNOUPDATE(down, selected, false))



