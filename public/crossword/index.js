
import { getCrossword } from "../api.js"


//variables
const all = await getCrossword().then(a => a.json())
const data = all.body[0]
const cells = data.cells
console.log(data)

const countdown_elem = document.getElementById("countdown")
const board_elem = document.getElementById("board")
const across_elem = document.getElementById("across")
const down_elem = document.getElementById("down")

//init
const SELECTED_COLOR = "#afe"
const WORD_COLOR = "#eee"
const [WIDTH, HEIGHT] = [data.dimensions.width, data.dimensions.height]
const guesses = new Array(WIDTH*HEIGHT).fill(undefined)

//reverse index for clues
const RI_across = new Array(WIDTH*HEIGHT).fill(undefined)
const RI_down = new Array(WIDTH*HEIGHT).fill(undefined)

data.clues.forEach(({ cells, direction }, i) => {
  const ri = direction == "Across" ? RI_across : RI_down
  cells.forEach(b => ri[b] = i)
})

let down = 0
let clues = [RI_across, RI_down] //for down indexing

let selected = undefined

//UI init
board_elem.innerHTML = data.board
const cell_elems = [...document.querySelectorAll(".cells > g")]

function makeClueElem({ label, text, cells, direction }) {
  const elem = document.createElement("li")
  elem.innerText = `${label}. ${text[0].plain}`
  elem.addEventListener("click", () => updateDS((direction=="Down")|0, cells[0]))
  return elem
}
function putChar(i, c) {
  guesses[i] = c
  cell_elems[i].querySelector(".guess").innerHTML = (c || "").toUpperCase()
}

data.clues.forEach(c => {
  const { direction } = c
  if (direction == "down") down_elem.appendChild(makeClueElem(c))
  else across_elem.appendChild(makeClueElem(c))
})

//do date things
const date = new Date(Date.parse(all.publicationDate))
date.setDate(date.getDate() + 1)
date.setHours(date.getHours() + 5)
date.setHours(date.getHours() - 2)
if (date.getUTCDay() == 0)
  date.setHours(date.getHours() - 4)

function updateCountdown() {
  const diff = date.getTime() - Date.now()
  const hours = Math.floor(diff / 60 / 60 / 1000 % 24)
  const minutes = Math.floor(diff / 60 / 1000 % 60)
  const seconds = Math.floor(diff / 1000 % 60)
  countdown_elem.innerText = `${hours} hrs ${minutes} mins ${seconds} secs`
  setTimeout(updateCountdown, 1000)
}
updateCountdown()
  


//functionality

function updateDS(_down, _selected) {

  // if selected doesn't exist just highlight simple
  if (selected == undefined) {
    word(_down, _selected).forEach(i => colorCell(i, i == _selected ? SELECTED_COLOR : WORD_COLOR))
  }
  
  // if it's a different word
  else if (_down != down || clues[down][_selected] != clues[down][selected]) {
    //total wipe and rewrite
    word(down, selected).forEach(i => colorCell(i, "none"))
    word(_down, _selected).forEach(i => colorCell(i, i == _selected ? SELECTED_COLOR : WORD_COLOR))
  }

  // if selected is constant (we know down is not)
  else if (_selected == selected)  {
    //wipe everything but selected
    console.log("b")
    word(down, selected).forEach(i => i != selected ? colorCell(i, "none") : undefined)
    word(_down, selected).forEach(i => i != selected ? colorCell(i, WORD_COLOR) : undefined)
  }

  //if its within the same word (we know down is the same I think?)
  else {
    colorCell(selected, WORD_COLOR)
    colorCell(_selected, SELECTED_COLOR)
  }

  down = _down
  selected = _selected
}

cell_elems.forEach((a, i) => a.addEventListener("click", () => {

  // if we click on black do nothing
  if (cells[i].type == undefined) { null }

  // if we're currently selected, flip
  else if (selected == i) { updateDS(down ^ 1, selected) }

  //otherwise just reselect and keep down state
  else { updateDS(down, i) }
}))

//universal thingy listener
document.addEventListener("keydown", e => {
  
  //if nothing's selected die
  if (selected == undefined) return
  
  //if its a character put the character and move forward
  if (e.key.match(/^[a-z]$/) != null) {
    putChar(selected, e.key)
    moveForward()
  }

  //backspace
  if (e.code == "Backspace") {
    moveBackward()
    putChar(selected, undefined)
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

  if (e.code == "Tab" && e.shiftKey) {
    e.preventDefault()
    const new_clue = data.clues[(clues[down][selected] - 1 + data.clues.length) % data.clues.length]
    updateDS((new_clue.direction == "Down")|0, new_clue.cells[0])
  }
  
  else if (e.code == "Tab") {
    e.preventDefault()
    const new_clue = data.clues[(clues[down][selected] + 1) % data.clues.length]
    updateDS((new_clue.direction == "Down")|0, new_clue.cells[0])
  }

})



//helper methods
//color a cell by index
function colorCell(i, fill) {
  cell_elems[i].querySelector("path").setAttribute("fill", fill)
}

//get word as list of indices
function word(down, selected) {
  return data.clues[clues[down][selected]].cells
}


const moveForward=mkMoveFn((s, w) => s != w[w.length-1], l=>l[0], 1)
const moveBackward=mkMoveFn((s, w) => s != w[0], l=>l[l.length-1], -1)
function mkMoveFn(comparator, nextindex, dir) { return () => {
  //get current word
  const w = word(down, selected)

  //if it's not the last one, just go to the next index
  if (comparator(selected, w)) {
    updateDS(down, selected + (down ? WIDTH : 1) * dir )
    return
  }
    
  //if it is the last one we gotta increment the current clue
  const new_clue = data.clues[(clues[down][selected] + dir + data.clues.length) % data.clues.length]
  updateDS((new_clue.direction == "Down")|0, nextindex(new_clue.cells))
}}


function mobileCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
