import makeFetchCookie from 'fetch-cookie'
import { FileCookieStore } from 'tough-cookie-file-store';
import 'dotenv/config'
import { writeFile, readFile, access } from "fs/promises"

const store = new FileCookieStore("./cookies.json")
const jar = new makeFetchCookie.toughCookie.CookieJar(store, { allowSpecialUseDomain: true })
const fetchCookie = makeFetchCookie(fetch, jar);

const urls = {
  DATADOME_URL: "https://myaccount.nytimes.com/auth/enter-email",
  AUTH_TOKEN_URL: "https://myaccount.nytimes.com/auth/enter-email?response_type=cookie&client_id=lgcl&redirect_uri=https%3A%2F%2Fwww.nytimes.com",
  EMAIL_URL: "https://myaccount.nytimes.com/svc/lire_ui/authorize-email",
  PASSWORD_URL: "https://myaccount.nytimes.com/svc/lire_ui/login",
  CROSSWORD_URL: date => `https://www.nytimes.com/svc/crosswords/v6/puzzle/daily/${date}.json`,
  SPELLING_BEE_URL: "https://www.nytimes.com/puzzles/spelling-bee",
}
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0"
const files = {
  CROSSWORD: "./crossword.json",
  SPELLING_BEE: "./spellingbee.json"
}

export async function getSpellingBee() {
  
  if (await access(files.SPELLING_BEE).then(()=>false,()=>true)) return writeSpellingBee()
  const spellingbee = await readFile(files.SPELLING_BEE).then(a => JSON.parse(a))

  // cutoff is after 3pm est
  let cutoff = new Date(Date.parse(spellingbee.printDate))
  cutoff.setHours(cutoff.getHours() - 5) //into EST
  cutoff.setHours(cutoff.getHours() - 9) // into cutoff

  if (new Date() > cutoff) return writeSpellingBee()
  return spellingbee
}

export async function getCrossword() {

  //load up current current crossword, if doesn't exist just get, write and return
  if (await access(files.CROSSWORD).then(()=>false,()=>true))
    return writeCrossword()
  const crossword = await readFile(files.CROSSWORD).then(a => JSON.parse(a))

  /* check whether crossword date matches, heuristic:

  Weekday and Saturday puzzles are available at 10 p.m.
  EST the previous day. Sunday puzzles are available at
  6 p.m. EST on Saturday */

  let cutoff = new Date(Date.parse(crossword.publicationDate))
  cutoff.setHours(cutoff.getUTCHours() - 5) //into EST
  cutoff.setHours(cutoff.getUTCHours() - (cutoff.getUTCDay() == 6 ? 6 : 2)) // into cutoff
  
  // if there is a new cutoff, just write the crossword
  if (new Date() > cutoff) return writeCrossword(true)

  // otherwise we're good
  return crossword
}

async function writeCrossword() {

  let SIDNY_cookie;
  store.findCookie("nytimes.com", "/", "SIDNY", (_, c) => SIDNY_cookie = c)

  // if we no longer have auth, get it again (thanks mom lol)
  if (SIDNY_cookie == null) getAuthCookies()
  console.log(`getting auth with cookie that expires in ${SIDNY_cookie.expiration_date - Date.now()}`)

  const date = new Date()
  date.setHours(date.getUTCHours() - 5)
  date.setHours(date.getUTCHours() + (date.getUTCDay() == 6 ? 6 : 8))
  const ds = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
  
  const crossword = await fetchCookie(urls.CROSSWORD_URL(ds), { "User-Agent": USER_AGENT, })
    .then(a => a.text())

  await writeFile(files.CROSSWORD, crossword)
  return crossword
}

async function writeSpellingBee() {

  const spellingbee = await fetch(urls.SPELLING_BEE_URL)
    .then(a => a.text())
    .then(a => a.match(/<script.*?>window\.gameData\s*=\s*{"today":(.*?),"yesterday".*?<\/script>/)[1])
  
  await writeFile(files.SPELLING_BEE, spellingbee)
  return spellingbee
}

//get all our auth cookies using my mom's nyt account
async function getAuthCookies() {

  console.log("GETTING AUTH if you're seeing this often you probably shouldn't be")

  await fetchCookie(urls.DATADOME_URL, { "User-Agent": USER_AGENT })

  const AUTH_TOKEN = await fetchCookie(urls.AUTH_TOKEN_URL, { "User-Agent": USER_AGENT, })
    .then(a => a.text())
    .then(a => a.match(/(?<=authToken&quot;:&quot;).*?(?=&quot;)/)[0])
    .then(a => a.replace("&#x3D;", "="))

  await fetchCookie(urls.EMAIL_URL, {
    method: "POST",
    body: JSON.stringify({
      email: process.env.EMAIL,
      auth_token: AUTH_TOKEN,
      form_view: "enterEmail"
    }),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    }
  })

  await fetchCookie(urls.PASSWORD_URL, {
    method: "POST",
    body: JSON.stringify({
      username: process.env.EMAIL,
      auth_token: AUTH_TOKEN,
      form_view: "login",
      password: process.env.PASSWORD,
      remember_me: "Y"
    }),
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.5",
      "Referer": "https://myaccount.nytimes.com/auth/enter-email?response_type=cookie&client_id=lgcl&redirect_uri=https%3A%2F%2Fwww.nytimes.com",
      "Content-Type": "application/json",
      "Req-Details": "[[it:lui]]",
      "Origin": "https://myaccount.nytimes.com",
      "DNT": "1",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "TE": "trailers"
    }
  })
}
